/**
 * 自检脚本：用假 ctx 调用插件 apply，抓取它注册进 systemPrompt 的 context 定义，
 * 并直接调用 text provider，验证返回类型、内容、mtime 缓存与字节上限行为。
 * 用法：<bundled node> selfcheck.mjs [被测文件路径]
 */

const target = process.argv[2] ?? new URL('../index.js', import.meta.url).href
const { apply, Config, name } = await import(target)

console.log(`module: name=${name} Config=${typeof Config} apply=${typeof apply}`)

// 用 schema 的默认值 + 显式路径，模拟 loader 传给 apply 的配置。
const parsed = Config({ path: 'C:/Users/rieal/.dsh/AGENT.md', order: 9000, maxBytes: 4096 })
console.log('parsed config:', JSON.stringify(parsed))

const registered = []
const ctx = {
  logger: {
    info: (...args) => console.log('[info]', ...args.map(String)),
    warn: (...args) => console.log('[warn]', ...args.map(String)),
  },
  systemPrompt: {
    context: (definition) => {
      registered.push(definition)
      return () => {}
    },
  },
}

apply(ctx, parsed)

if (registered.length !== 1) throw new Error(`expected exactly 1 registered context, got ${registered.length}`)
const definition = registered[0]
console.log(`registered: name=${definition.name} order=${definition.order} interpolate=${definition.interpolate} textType=${typeof definition.text}`)

const first = definition.text({})
console.log(`text() type: ${typeof first}  (must be string)`)
if (typeof first !== 'string') throw new Error('provider must return a string synchronously')
console.log(`text() bytes: ${Buffer.byteLength(first, 'utf8')}  lines: ${first.split('\n').length}`)
console.log('--- head ---')
console.log(first.split('\n').slice(0, 6).join('\n'))
console.log('--- tail ---')
console.log(first.split('\n').slice(-4).join('\n'))

// 第二次调用应命中 mtime+size 缓存，结果完全一致。
const second = definition.text({})
console.log(`cache stable: ${first === second}`)

// 未配置路径时用默认值（<DSH_HOME>/AGENT.md），换成本机实际路径再取一次。
const defaultConfig = Config({})
console.log('default path config:', JSON.stringify(defaultConfig))

// 超大上限：验证截断分支。
const tiny = Config({ path: 'C:/Users/rieal/.dsh/AGENT.md', order: 1, maxBytes: 200 })
const tinyRegistered = []
apply({ ...ctx, systemPrompt: { context: (d) => tinyRegistered.push(d) } }, tiny)
const tinyText = tinyRegistered[0].text({})
console.log(`tiny cap bytes: ${Buffer.byteLength(tinyText, 'utf8')}`)
console.log(`tiny cap truncated marker: ${tinyText.includes('已在')}`)
