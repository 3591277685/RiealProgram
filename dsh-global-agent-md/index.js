/**
 * dsh-global-agent-md — 把「程序目录下的全局 AGENT.md」注入 DSH 的每一次请求。
 *
 * 动机：DSH 内置的 agent-instructions 只认 AGENTS.md / CLAUDE.md（全局那份的文件名在
 * 源码里写死为 AGENTS.md），所以想用 `AGENT.md` 这个文件名、放在程序自己目录下，
 * 就需要一个插件自己把它读进来。
 *
 * 做法：注册一个「运行时上下文」（ctx.systemPrompt.context），provider 在每次组装
 * 请求时求值，读取文件内容并注入；文件按 mtime + size 缓存，没变就不重复读盘。
 *
 * 与内置机制的差别（README 里也写了）：文件变化不会触发「指令已更新」的增量通知，
 * 但每次请求都会重新求值，所以改完立刻在下一轮生效。
 *
 * @module dsh-global-agent-md
 */

import { readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import z from '@deepseek-ai/schemastery'

/** 插件名。 */
export const name = 'global-agent-md'

/** 依赖：等提示词注册表就绪后再 apply。 */
export const inject = ['systemPrompt']

const DEFAULT_MAX_BYTES = 262_144

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

/**
 * 插件入口：注册全局 AGENT.md 的运行时上下文贡献。
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
  // 缓存上一次成功读取的快照：mtime + size 未变则复用文本，避免每步都读盘。
  let cache = { key: '', text: '' }
  let warnedMissing = false

  // 注意：systemPrompt 的 provider 必须是同步函数（契约是 () => string），
  // 返回 Promise 会污染提示词，所以这里用同步读盘 + mtime/size 缓存。
  const render = () => {
    let info
    try {
      info = statSync(target)
    } catch {
      if (!warnedMissing) {
        warnedMissing = true
        ctx.logger?.info?.(`global-agent-md: 未找到全局指令文件 ${target}（创建它即可生效）`)
      }
      return ''
    }
    if (!info.isFile()) return ''
    warnedMissing = false
    const key = `${info.mtimeMs}:${info.size}`
    let body
    if (cache.key === key) {
      body = cache.text
    } else {
      try {
        body = readFileSync(target, 'utf8')
      } catch (error) {
        ctx.logger?.warn?.(`global-agent-md: 读取 ${target} 失败：%o`, error)
        return ''
      }
      cache = { key, text: body }
    }
    const trimmed = body.trim()
    if (trimmed.length === 0) return ''
    const bounded = truncateUtf8(trimmed, maxBytes)
    const notice = bounded.truncated
      ? `\n\n[global-agent-md] 内容超过 ${maxBytes} 字节上限，已在 ${Buffer.byteLength(bounded.text, 'utf8')} 字节处截断。`
      : ''
    return [
      `<global-instructions source="${target}">`,
      '全局指令（对所有项目生效）',
      '',
      bounded.text,
      notice,
      '</global-instructions>',
    ].join('\n')
  }

  ctx.systemPrompt.context({
    name: 'global-agent-md',
    order: config.order,
    // provider 形式：每次组装请求时求值，所以文件一改，下一轮就生效。
    text: () => render(),
    // 内容里可能含 {{...}} 之类的花括号，按字面量保留，不做变量插值。
    interpolate: false,
  })

  ctx.logger?.info?.(`global-agent-md: 已挂载，全局指令文件 ${target}`)
}
