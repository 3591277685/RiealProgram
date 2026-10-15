/** 鉴权实验插件：注册一个只读路由，用来确认第三方插件的 Web 路由是否需要页面令牌。 */
export const name = 'auth-probe'
export const inject = ['webServer']

export function apply(ctx) {
  ctx.webServer.register({
    method: 'GET',
    path: '/auth-probe',
    handler: () => ({ status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'auth-probe-ok' }),
  })
  ctx.logger?.info?.('auth-probe: mounted')
}
