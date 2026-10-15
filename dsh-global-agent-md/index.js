/**
 * dsh-global-agent-md — 把「程序目录下的全局 AGENT.md」注入 DSH 的每一次请求，
 * 并在「设置」里提供一个可随时编辑它的界面。
 *
 * 动机：DSH 内置的 agent-instructions 只认 AGENTS.md / CLAUDE.md（全局那份的文件名在
 * 源码里写死为 AGENTS.md），所以想用 `AGENT.md` 这个文件名、放在程序自己目录下，
 * 就需要一个插件自己把它读进来。
 *
 * 两部分能力：
 * 1) 提示词注入：注册一个「运行时上下文」（ctx.systemPrompt.context），provider 在每次
 *    组装请求时求值，读取文件内容并注入；文件按 mtime + size 缓存，没变就不重复读盘。
 * 2) 设置界面：注册三条同源 HTTP 路由（状态 / 保存 / 重载），供本包的客户端半边
 *    （client/client.js，在「设置 → 插件 → 全局要求」渲染文本框）调用。路由 handler
 *    是 Node 原生 (req, res) 形式——返回对象形式不会结束响应，浏览器侧会一直挂住。
 *
 * @module dsh-global-agent-md
 */

import { readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import z from '@deepseek-ai/schemastery'

/** 插件名。 */
export const name = 'global-agent-md'

/**
 * 依赖：提示词注册表 + Web 服务器。
 * 注意 webServer 必须声明成依赖——只在 apply 里 ctx.get 探测会拿到 undefined，
 * 结果是注入生效但设置界面的路由从未注册（GET 变 404）。
 */
export const inject = ['systemPrompt', 'webServer']

const DEFAULT_MAX_BYTES = 262_144
const API_PREFIX = '/global-agent-md/api'
const MAX_BODY_BYTES = 4 * 1024 * 1024

/**
 * 兜底解析 DSH 主目录：优先环境变量，其次 ~/.dsh。
 * @returns {string} DSH 主目录的绝对路径。
 */
function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) return fromEnv.trim()
  return path.join(homedir(), '.dsh')
}

/**
 * 展开路径里的 `~` 与 `${DSH_HOME}`，相对路径按 DSH 主目录解析。
 * @param {string} raw - 配置里的路径。
 * @returns {string} 绝对路径；空字符串表示未配置。
 */
function resolvePath(raw) {
  const home = dshHome()
  let value = String(raw ?? '').trim()
  if (value.length === 0) return ''
  value = value.replaceAll('${DSH_HOME}', home)
  if (value === '~') return home
  if (value.startsWith('~/') || value.startsWith('~\\')) value = path.join(home, value.slice(2))
  return path.isAbsolute(value) ? value : path.resolve(home, value)
}

/**
 * 配置 schema；默认值直接写在 schema 里。
 * 想停用本插件，把 path 配成空字符串即可。
 */
export const Config = z.object({
  path: z.string().default(''),
  order: z.number().default(9000),
  maxBytes: z.number().default(DEFAULT_MAX_BYTES),
})

/**
 * 按 UTF-8 字节安全截断（不把多字节字符切成半截）。
 * @param {string} value - 原始文本。
 * @param {number} maxBytes - 允许的最大字节数。
 * @returns {{ text: string, truncated: boolean }} 截断结果。
 */
function truncateUtf8(value, maxBytes) {
  const bytes = Buffer.from(value, 'utf8')
  if (bytes.length <= maxBytes) return { text: value, truncated: false }
  let end = Math.max(0, Math.trunc(maxBytes))
  while (end > 0 && (bytes.readUInt8(end) & 0xc0) === 0x80) end -= 1
  return { text: bytes.subarray(0, end).toString('utf8'), truncated: true }
}

/** 每次组装请求时的求值器：同步读盘 + mtime/size 缓存。 */
class InstructionSource {
  /**
   * @param {object} options - 目标路径、字节上限与日志器。
   * @param {string} options.target - 全局指令文件绝对路径。
   * @param {number} options.maxBytes - 注入内容的 UTF-8 字节上限。
   * @param {object} [options.logger] - Cordis 日志器。
   */
  constructor({ target, maxBytes, logger }) {
    this.target = target
    this.maxBytes = maxBytes
    this.logger = logger
    this.cache = { key: '', text: '' }
    this.warnedMissing = false
  }

  /**
   * 读取文件状态快照（不存在也返回，不抛）。
   * @returns {{ exists: boolean, mtimeMs: number|null, size: number|null, version: string, content: string }}
   */
  read() {
    let info
    try {
      info = statSync(this.target)
    } catch {
      if (!this.warnedMissing) {
        this.warnedMissing = true
        this.logger?.info?.(`global-agent-md: 未找到全局指令文件 ${this.target}（保存一次即可创建）`)
      }
      return { exists: false, mtimeMs: null, size: null, version: 'absent', content: '' }
    }
    this.warnedMissing = false
    if (!info.isFile()) {
      return { exists: false, mtimeMs: null, size: null, version: 'not-a-file', content: '' }
    }
    const key = `${info.mtimeMs}:${info.size}`
    let content
    if (this.cache.key === key) {
      content = this.cache.text
    } else {
      try {
        content = readFileSync(this.target, 'utf8')
      } catch (error) {
        this.logger?.warn?.(`global-agent-md: 读取 ${this.target} 失败：%o`, error)
        return { exists: false, mtimeMs: null, size: null, version: 'unreadable', content: '' }
      }
      this.cache = { key, text: content }
    }
    return { exists: true, mtimeMs: info.mtimeMs, size: info.size, version: key, content }
  }

  /** 保存内容并让下一次注入立即看到新版本。 */
  write(content) {
    mkdirSync(path.dirname(this.target), { recursive: true })
    writeFileSync(this.target, content, 'utf8')
    this.cache = { key: '', text: '' }
  }

  /** 组装注入文本；没有内容时返回空串。 */
  render() {
    const state = this.read()
    if (!state.exists) return ''
    const trimmed = state.content.trim()
    if (trimmed.length === 0) return ''
    const bounded = truncateUtf8(trimmed, this.maxBytes)
    const notice = bounded.truncated
      ? `\n\n[global-agent-md] 内容超过 ${this.maxBytes} 字节上限，已在 ${Buffer.byteLength(bounded.text, 'utf8')} 字节处截断。`
      : ''
    return [
      `<global-instructions source="${this.target}">`,
      '全局指令（对所有项目生效）',
      '',
      bounded.text,
      notice,
      '</global-instructions>',
    ].join('\n')
  }
}

/**
 * 读取请求体（限长）。
 * @param {import('node:http').IncomingMessage} request - 原始请求。
 * @returns {Promise<string>} 请求体文本。
 */
function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

/**
 * 回一个 JSON 响应。
 * @param {import('node:http').ServerResponse} response - 原始响应。
 * @param {number} status - HTTP 状态码。
 * @param {unknown} payload - JSON 可序列化的载荷。
 */
function sendJson(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body, 'utf8'),
    'cache-control': 'no-store',
  })
  response.end(body)
}

/**
 * 插件入口：注入全局 AGENT.md，并挂上设置界面所需的路由。
 * @param {import('@deepseek-ai/cordis').Context} ctx - Cordis 上下文。
 * @param {{ path: string, order: number, maxBytes: number }} config - 校验后的插件配置。
 */
export function apply(ctx, config) {
  // 未配置时用 DSH 主目录下的 AGENT.md。
  const target = resolvePath(config.path && config.path.length > 0 ? config.path : 'AGENT.md')
  if (target.length === 0) {
    ctx.logger?.info?.('global-agent-md: path 为空，已停用')
    return
  }

  const maxBytes = Number.isFinite(config.maxBytes) && config.maxBytes > 0
    ? config.maxBytes
    : DEFAULT_MAX_BYTES
  const source = new InstructionSource({ target, maxBytes, logger: ctx.logger })

  ctx.systemPrompt.context({
    name: 'global-agent-md',
    order: config.order,
    // provider 必须是同步函数：契约是 () => string，返回 Promise 会污染提示词。
    text: () => source.render(),
    // 内容里可能含 {{...}} 之类的花括号，按字面量保留，不做变量插值。
    interpolate: false,
  })

  ctx.logger?.info?.(`global-agent-md: 已挂载，全局指令文件 ${target}`)

  const webServer = ctx.webServer

  const statePayload = () => {
    const state = source.read()
    return {
      path: target,
      exists: state.exists,
      version: state.version,
      mtimeMs: state.mtimeMs,
      bytes: state.exists ? Buffer.byteLength(state.content, 'utf8') : 0,
      chars: state.content.length,
      content: state.content,
    }
  }

  const disposers = [
    webServer.register({
      kind: 'exact',
      path: `${API_PREFIX}/state`,
      handler: (request, response) => {
        if (request.method !== 'GET') {
          response.writeHead(405, { allow: 'GET' })
          response.end()
          return
        }
        sendJson(response, 200, statePayload())
      },
    }),
    webServer.register({
      kind: 'exact',
      path: `${API_PREFIX}/save`,
      handler: async (request, response) => {
        if (request.method !== 'POST') {
          response.writeHead(405, { allow: 'POST' })
          response.end()
          return
        }
        let payload
        try {
          payload = JSON.parse(await readBody(request))
        } catch (error) {
          sendJson(response, 400, { ok: false, error: `请求体不是合法 JSON：${String(error)}` })
          return
        }
        if (payload === null || typeof payload !== 'object' || typeof payload.content !== 'string') {
          sendJson(response, 400, { ok: false, error: '缺少 content 字段' })
          return
        }
        const current = source.read()
        // 乐观锁：默认不允许覆盖「界面拿到之后被别处改过」的内容。
        if (payload.force !== true && typeof payload.version === 'string' && payload.version !== current.version) {
          sendJson(response, 409, {
            ok: false,
            error: '文件已被外部修改，未覆盖。',
            version: current.version,
          })
          return
        }
        try {
          source.write(payload.content)
        } catch (error) {
          sendJson(response, 500, { ok: false, error: `写入失败：${String(error)}` })
          return
        }
        sendJson(response, 200, { ok: true, ...statePayload() })
      },
    }),
    webServer.register({
      kind: 'exact',
      path: `${API_PREFIX}/reload`,
      handler: (request, response) => {
        if (request.method !== 'POST') {
          response.writeHead(405, { allow: 'POST' })
          response.end()
          return
        }
        // 丢掉缓存，强制重新读盘，让界面拿到磁盘上的当前内容。
        source.cache = { key: '', text: '' }
        sendJson(response, 200, { ok: true, ...statePayload() })
      },
    }),
  ]

  ctx.effect(() => () => {
    for (const dispose of disposers) dispose?.()
  }, 'global-agent-md: web routes')
}
