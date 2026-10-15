# dsh-global-agent-md

把「程序目录下的全局 `AGENT.md`」注入 DSH 的**每一次请求**，并在 **设置 → 插件 → 全局要求** 里提供编辑界面，随时改、改完下一轮对话生效。

## 为什么需要它

DSH 内置的 `@deepseek-ai/dsh-agent-instructions` 已经会加载全局指令，但**全局那份的文件名写死为 `AGENTS.md`**（源码里 `USER_GLOBAL_FILE = 'AGENTS.md'`，探测路径为 `$DSH_HOME/AGENTS.md` 与 `~/.agents/AGENTS.md`）；配置项 `instructionFileCandidates` 只作用于「项目根 → 当前目录」的项目候选名。所以想用 `AGENT.md` 这个文件名，就得由插件自己把它读进来——这就是本插件做的事。

## 它做什么

**一、注入提示词**（宿主半边 `index.js`）

- 注册一个**运行时上下文**（`ctx.systemPrompt.context`），provider 在每次组装模型请求时求值；
- 读取配置的全局指令文件，包在 `<global-instructions source="…">` 里注入；
- 文件按 `mtime + size` 缓存，没变就不重复读盘；改完文件**下一轮对话立即生效**；
- 超过字节上限时按 UTF-8 边界截断，并附一行截断提示。

**二、设置界面**（浏览器半边 `client/client.js`）

- 在 `settings.plugins.tab`（旧外壳回落 `settings.section`）注册一页「全局要求」；
- 文本框直接编辑 `AGENT.md`，带保存 / 重新载入 / 放弃改动 / 字符计数 / 状态提示；
- **乐观锁**：保存时带上读到的版本号，若文件在别处被改过，服务端返回 409 且不覆盖，界面提示先「重新载入」或点「强制覆盖」。

浏览器半边通过本包自己的三条同源 HTTP 路由与宿主通信（页面自带会话 Cookie，不需要自己处理鉴权）：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/global-agent-md/api/state` | 读当前内容 + 版本号 + 字节/字符数 |
| POST | `/global-agent-md/api/save` | `{ content, version?, force? }`，版本不符返回 409 |
| POST | `/global-agent-md/api/reload` | 丢掉缓存重新读盘 |

## 安装

```sh
# 1) 装依赖（本插件用 schemastery 定义配置 schema）
cd <本插件目录>
pnpm install

# 2) 装进某个 profile（本机桌面端是 desktop）
dsh plugin --profile desktop add <本插件目录>
```

安装后**重启 DSH** 才会加载。若 `dsh plugin add` 因依赖已存在而跳过 bundle 登记，手动把包名加进该 profile 的 `package.json`：

```json
{ "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-global-agent-md"] } } }
```

客户端半边由外壳的 client-modules 按 `dsh.client` 声明扫描并服务，**不需要**单独构建：

```json
"dsh": { "client": { "platform": "web", "inject": ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings"] } },
"exports": { "./client": "./client/client.js" }
```

## 配置

在 profile 的 `cordis.patch.yml`（或本插件的 `cordis.patch.yml`）里改：

```yaml
- id: global-agent-md
  name: 'dsh-global-agent-md'
  config:
    # 留空则用 <DSH_HOME>/AGENT.md；填绝对路径或 ~ 开头都支持。
    # 把 path 设成空字符串即停用本插件。
    path: !!js process.env.DSH_GLOBAL_AGENT_MD || dshHomePath('AGENT.md')
    # 注入顺序：数值越大越靠后（越贴近本步请求）。
    order: 9000
    # 单次注入的 UTF-8 字节上限，超出则截断。
    maxBytes: 262144
```

注意 profile 补丁层是**按行覆盖**：`config` 是整块替换而不是深合并，写这一行时要把上面三个键都写全。

## 本机当前状态（2026/10/15 完成）

| 项 | 值 |
| --- | --- |
| 全局指令文件 | `C:\Users\rieal\.dsh\AGENT.md` |
| 插件目录 | `D:\RiealProgram\dsh-global-agent-md` |
| 安装位置 | `C:\Users\rieal\.dsh\profiles\desktop`（`link:` 方式链接，改插件代码后重启即生效） |
| 备份 | 同目录下 `package.json.bak`、`cordis.patch.yml.bak`（回滚用） |

## 自检与排查

宿主半边的自检脚本（假 ctx 调用 `apply`，抓取注册的 context 定义并调用 provider）：

```pwsh
& "C:\Users\rieal\AppData\Local\Programs\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\node\bin\node.exe" `
  "D:\RiealProgram\dsh-global-agent-md\.probe\selfcheck.mjs"
```

它会打印：注册的 context 定义、`text()` 的返回类型（必须是 `string`，同步）、注入内容的字节数与首尾、缓存是否稳定、截断是否生效。

排查要点（都是实际踩过的）：

- **注入没生效**：日志出现 `dsh: warning: N entry did not activate` + 插件名 `failed to import`，几乎都是插件目录缺少 `node_modules`（`@deepseek-ai/schemastery` 解析不到），在插件目录跑一次 `pnpm install`。
- **provider 必须是同步函数**：返回 Promise 会污染提示词（框架不会 await 它），而且不报错。
- **设置路由 404**：`webServer` 必须写进 `inject`（`inject = ['systemPrompt', 'webServer']`）。只靠 `ctx.get('webServer')` 探测会在服务就绪前拿到 `undefined`，结果是注入正常、路由从未注册。
- **路由 handler 是 Node 原生 `(req, res)`**：必须自己 `res.writeHead(...)` + `res.end(...)`。返回对象形式不会结束响应，浏览器侧一直挂住（表现为请求超时）。
- 想确认「到底注入了什么」，可以临时在 profile 的 `cordis.patch.yml` 里挂上 `.probe/probe.js`；用完记得删掉那一行。

## 许可

MIT
