/**
 * 临时校验插件（不长期保留）：监听 system-prompt/assemble，把最近一次组装出来的
 * 上下文名与文本记录下来，通过 HTTP 暴露，用来确认 dsh-global-agent-md 真的把
 * 全局 AGENT.md 注入进了模型请求。
 */

export const name = 'agent-md-probe'

export const inject = ['webServer']

export function apply(ctx) {
  /** 最近一次组装快照（由 system-prompt/assemble 事件填充）。 */
  const seen = []

  ctx.on('system-prompt/assemble', (assembly) => {
    seen.push({
      at: new Date().toISOString(),
      contexts: assembly.contexts.map((entry) => ({ name: entry.name, text: String(entry.text) })),
      sectionNames: assembly.sections.map((entry) => entry.name),
    })
    while (seen.length > 3) seen.shift()
    return assembly
  })

  ctx.webServer.register({
    method: 'GET',
    path: '/agent-md-probe',
    handler: () => {
      if (seen.length === 0) {
        return { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'no assembly observed yet' }
      }
      const last = seen[seen.length - 1]
      const body = [
        `assemblies observed: ${seen.length}`,
        `last at: ${last.at}`,
        `sections: ${last.sectionNames.join(', ')}`,
        ...last.contexts.map((entry) => [
          '',
          `=== context "${entry.name}" (${entry.text.length} chars) ===`,
          entry.text.slice(0, 1200),
        ].join('\n')),
      ].join('\n')
      return { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body }
    },
  })

  ctx.logger?.info?.('agent-md-probe: mounted on /agent-md-probe')
}
