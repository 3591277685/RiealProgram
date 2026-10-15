/**
 * dsh-global-agent-md 的浏览器半边：在「设置 → 插件 → 全局要求」里提供一个
 * 可随时编辑全局 AGENT.md 的文本框。
 *
 * 形式：外壳（dsh-client-modules）只服务构建好的 bundle，不会替插件编译源码，
 * 所以这里手写成 `window.__ModuleLoader__.load({ id, factory })`——与 dshmarket
 * 的产物、以及官方文档里的 `@local/my-decoration` 示例同一种格式。
 *
 * 两点易错：
 * - 这是 Module Loader 包（factory(require) 取模块），不是 `cordis-client-runner`
 *   闭包，所以**没有** `styles` / `host` 这些符号；样式只能自己插 <style>。
 * - `inject` 用数组形式（`['slots', 'locale']`），对象形式是动态客户端那套的约定。
 *
 * 与宿主通信：走本包自己的同源 HTTP 路由（/global-agent-md/api/*，由 index.js 注册）。
 * 页面已持有会话 Cookie，同源 fetch 自动带上，无需自己处理鉴权。
 */

window.__ModuleLoader__.load({
  id: 'dsh-global-agent-md',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'dsh-global-agent-md'
    const API = '/global-agent-md/api'

    const DICT = {
      zh: {
        nav: '全局要求',
        title: '全局要求（AGENT.md）',
        intro: '这里编辑的是程序目录下的全局指令文件，无论对话开在哪个工作区都会被读取。保存后下一轮对话立即生效。',
        path: '文件路径',
        notExists: '文件当前不存在，保存后会创建。',
        load: '重新载入',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        discard: '放弃本地改动',
        dirty: '有未保存的改动',
        clean: '与磁盘内容一致',
        chars: '字符',
        conflict: '文件已被外部修改，未覆盖。请先「重新载入」，或点「强制覆盖」。',
        force: '强制覆盖',
        error: '出错了',
        readFailed: '读取失败',
        loadFailed: '加载失败',
        placeholder: '# 全局指令\n\n在这里写对所有项目生效的要求……',
      },
      en: {
        nav: 'Global instructions',
        title: 'Global instructions (AGENT.md)',
        intro: 'This edits the global instruction file in the program directory. It is read in every workspace, and changes apply from the next turn on.',
        path: 'File path',
        notExists: 'The file does not exist yet; saving creates it.',
        load: 'Reload',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        discard: 'Discard local changes',
        dirty: 'Unsaved changes',
        clean: 'Matches disk',
        chars: 'chars',
        conflict: 'The file changed on disk; nothing was overwritten. Reload first, or force overwrite.',
        force: 'Force overwrite',
        error: 'Error',
        readFailed: 'Read failed',
        loadFailed: 'Load failed',
        placeholder: '# Global instructions\n\nRequirements that apply to every project…',
      },
    }

    const CSS = [
      '.gam-root{display:flex;flex-direction:column;gap:10px;padding:4px 0 12px}',
      '.gam-head{display:flex;flex-direction:column;gap:4px}',
      '.gam-title{font-size:14px;font-weight:600}',
      '.gam-intro{font-size:12px;opacity:.75;line-height:1.6}',
      '.gam-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;opacity:.85;word-break:break-all}',
      '.gam-editor{width:100%;min-height:46vh;resize:vertical;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(127,127,127,.35);border-radius:8px;background:rgba(127,127,127,.06);color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6}',
      '.gam-editor:focus{outline:none;border-color:#4c8dff}',
      '.gam-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.gam-btn{padding:5px 12px;border-radius:7px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.08);color:inherit;font-size:12.5px;cursor:pointer}',
      '.gam-btn:hover{background:rgba(127,127,127,.16)}',
      '.gam-btn[disabled]{opacity:.5;cursor:default}',
      '.gam-btn.primary{border-color:transparent;background:#4c8dff;color:#fff}',
      '.gam-status{font-size:12px;opacity:.8}',
      '.gam-status.warn{color:#e0a020;opacity:1}',
      '.gam-status.err{color:#e05252;opacity:1}',
      '.gam-count{font-size:12px;opacity:.6;margin-left:auto}',
      '.gam-warn{font-size:12px;line-height:1.6;color:#e0a020}',
    ].join('\n')

    /** 插入本包样式表；返回移除函数（页面生命周期内由外层持有）。 */
    function insertStyle() {
      const tag = document.createElement('style')
      tag.setAttribute('data-plugin', NS)
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => { try { tag.remove() } catch { /* 页面卸载中，忽略 */ } }
    }

    /** 一次 API 调用；失败时抛出带可读信息的 Error（409 表示磁盘上已变更）。 */
    async function request(path, init) {
      const options = { credentials: 'same-origin', ...init }
      if (options.body !== undefined) {
        options.headers = { 'content-type': 'application/json', ...(options.headers || {}) }
      }
      const response = await fetch(`${API}${path}`, options)
      let payload = null
      try { payload = await response.json() } catch { payload = null }
      if (!response.ok) {
        const error = new Error((payload && payload.error) || `HTTP ${response.status}`)
        error.status = response.status
        throw error
      }
      return payload
    }

    /**
     * 设置面板主体。
     * @param {{ t: (key: string) => string }} props - 外壳注入的翻译函数。
     */
    function Panel(props) {
      const t = props.t
      const [state, setState] = React.useState(null)
      const [draft, setDraft] = React.useState('')
      const [status, setStatus] = React.useState({ kind: 'idle', text: '' })
      const [busy, setBusy] = React.useState(false)
      const [conflict, setConflict] = React.useState(false)

      const applyState = React.useCallback((next) => {
        setState(next)
        setDraft(next && typeof next.content === 'string' ? next.content : '')
        setConflict(false)
      }, [])

      const load = React.useCallback(async () => {
        setBusy(true)
        setStatus({ kind: 'idle', text: '' })
        try {
          applyState(await request('/state', { method: 'GET' }))
        } catch (error) {
          setStatus({ kind: 'err', text: `${t('loadFailed')}: ${error.message}` })
        } finally {
          setBusy(false)
        }
      }, [applyState, t])

      const reload = React.useCallback(async () => {
        setBusy(true)
        setStatus({ kind: 'idle', text: '' })
        try {
          applyState(await request('/reload', { method: 'POST', body: '{}' }))
        } catch (error) {
          setStatus({ kind: 'err', text: `${t('readFailed')}: ${error.message}` })
        } finally {
          setBusy(false)
        }
      }, [applyState, t])

      const save = React.useCallback(async (force) => {
        setBusy(true)
        setStatus({ kind: 'idle', text: t('saving') })
        try {
          const next = await request('/save', {
            method: 'POST',
            body: JSON.stringify({
              content: draft,
              version: state ? state.version : undefined,
              force: force === true,
            }),
          })
          applyState(next)
          setStatus({ kind: 'ok', text: `${t('saved')} · ${new Date().toLocaleTimeString()}` })
        } catch (error) {
          if (error.status === 409) {
            setConflict(true)
            setStatus({ kind: 'warn', text: t('conflict') })
          } else {
            setStatus({ kind: 'err', text: `${t('error')}: ${error.message}` })
          }
        } finally {
          setBusy(false)
        }
      }, [applyState, draft, state, t])

      React.useEffect(() => { void load() }, [load])

      const dirty = state !== null && draft !== state.content
      const statusClass = status.kind === 'err'
        ? 'gam-status err'
        : status.kind === 'warn' ? 'gam-status warn' : 'gam-status'
      const statusText = status.text || (dirty ? t('dirty') : t('clean'))

      const buttons = [
        h('button', {
          key: 'save',
          className: 'gam-btn primary',
          disabled: busy || !dirty,
          onClick: () => { void save(false) },
        }, t('save')),
        h('button', {
          key: 'reload',
          className: 'gam-btn',
          disabled: busy,
          onClick: () => { void reload() },
        }, t('load')),
      ]
      if (dirty) {
        buttons.push(h('button', {
          key: 'discard',
          className: 'gam-btn',
          disabled: busy,
          onClick: () => { setDraft(state ? state.content : ''); setConflict(false) },
        }, t('discard')))
      }
      if (conflict) {
        buttons.push(h('button', {
          key: 'force',
          className: 'gam-btn',
          disabled: busy,
          onClick: () => { void save(true) },
        }, t('force')))
      }
      buttons.push(h('span', { key: 'status', className: statusClass }, statusText))
      buttons.push(h('span', { key: 'count', className: 'gam-count' }, `${draft.length} ${t('chars')}`))

      return h('div', { className: 'gam-root' },
        h('div', { className: 'gam-head' },
          h('div', { className: 'gam-title' }, t('title')),
          h('div', { className: 'gam-intro' }, t('intro')),
          h('div', { className: 'gam-path' }, `${t('path')}: ${state ? state.path : '…'}`),
          state && state.exists === false ? h('div', { className: 'gam-warn' }, t('notExists')) : null,
        ),
        h('textarea', {
          className: 'gam-editor',
          value: draft,
          spellCheck: false,
          placeholder: t('placeholder'),
          onChange: (event) => { setDraft(event.target.value); setConflict(false) },
        }),
        h('div', { className: 'gam-bar' }, buttons),
      )
    }

    // 样式在 bundle 物化时插入（模块主体副作用允许放这里）。
    insertStyle()

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICT), 'dsh-global-agent-md: dictionaries')
        const t = ctx.locale.bind(NS)

        /**
         * 注册设置项。`slots.inject` 等到槽位出现才注册，所以在没有该槽位的外壳上
         * 只是不出现，不需要比对版本号。
         */
        const register = (slot) => ctx.slots.inject(slot, () => ctx.slots.register({
          name: slot,
          id: 'global-agent-md',
          order: 45,
          label: () => t('nav'),
          locale: NS,
          inject: () => ({ t }),
        }, Panel))

        // 设置 → 插件 → 全局要求（0.1.7+）；旧外壳走 settings.section。
        register('settings.plugins.tab')
        register('settings.section')
      },
    }
  },
})
