// 校验脚本：直接请求测试实例的探针端点，确认插件是否把全局 AGENT.md 注入请求上下文。
// 用法：<bundled node> fetch-probe.mjs <token>
const token = process.argv[2]
const base = 'http://127.0.0.1:3081'
const urls = [`${base}/?token=${token}`, `${base}/agent-md-probe?token=${token}`]

for (const url of urls) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const body = await res.text()
    console.log(`URL=${url}`)
    console.log(`STATUS=${res.status} LEN=${body.length}`)
    if (url.includes('agent-md-probe')) console.log(body.slice(0, 2000))
    else console.log(body.slice(0, 200))
  } catch (error) {
    console.log(`URL=${url}\nERR=${error.name}: ${error.message}`)
  } finally {
    clearTimeout(timer)
  }
}
