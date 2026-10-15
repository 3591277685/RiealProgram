# AGENT — RiealProgram 项目记忆

> 本文件记录本项目的背景、环境、已完成的操作、用户的要求与约定，供后续接手的 AI 助手（Agent）快速建立上下文。
> 创建时间：2026-10-15　最后更新：2026-10-15（第六次更新：按新全局指令改为按日期分节记录）

## 每日记录（按日期汇总）

> 依据全局指令「日期标注要求」：每天单独成节，同一天的内容追加到本日小节内。

### 2026/10/15

**完成的操作**

1. 搭建并首次推送 RiealProgram 仓库：`git init -b main`、配置提交身份与 origin、写 README.md 与通用 .gitignore，首提交 6f53bef 推送成功。
2. 目录搬迁：D:\RiealDeepseek → D:\RiealProgram（旧目录被工作区占用，改为搬内容后删除）。
3. 处理一次推送被拒：远程有网页端提交 9bcf396「Update README.md」，本地 README 暂存改动冲突，备份后用 `git pull --ff-only` 快进解决。
4. 用户自行完成两次提交并推送：3beaad0「补充git使用方法和常用命令」、37a9155「改变布局」。
5. 建立项目记忆机制：AGENT/AGENT.md（先名为 AGENTmemory.md 后改名）、全局 C:\Users\rieal\.codex\AGENTS.md、项目 AGENTS.md，提交 bd3d86d 并推送。
6. 核对仓库现状：修正第九节「AGENT/ 与 AGENTS.md 尚未提交」的过期待办与第一节过期的「当前最新提交」字段；工作区干净、main 与 origin/main 同步。
7. 查证界面提示「背景信息窗口」：确认是上下文用量指示器（Context window 与 tokens 的误译），并记录应用文案位置 app.asar 的排查方法。
8. 按要求修改全局指令：新增「日期标注要求」章节（本文件随即开始按日期分节）。

**结论与教训**

- 提交已经推送成功后不要再 `git commit --amend`（会与远程分叉导致 non-fast-forward）；需要改就再加一个提交，或用 `git fetch` + `git reset --soft origin/main` 把改动接到远程提交之上。
- 推送失败多为网络瞬时问题（Connection was reset / Could not connect to server），隔一会儿重试即可。
- developers.openai.com 从本机 curl 访问返回 403，查界面文案可直接读 app.asar 里的 defaultMessage。

**当日待办**

- README 的「目录结构」一节仍待补充
- 可选：配置一键同步脚本 sync.ps1 或 post-commit 自动 push 钩子

## 一、项目基本信息

| 项目 | 内容 |
| --- | --- |
| 仓库名 | RiealProgram |
| 远程地址 | https://github.com/3591277685/RiealProgram.git |
| GitHub 账号 | 3591277685（显示名 Rieal_） |
| 可见性 | 公开（Public） |
| 本地目录 | D:\RiealProgram |
| 默认分支 | main |
| 最新提交 | 以 `git log --oneline -1` 为准；截至 2026-10-15 为记忆文件更新类提交 |

提交身份（仓库本地配置与全局配置均已设置）：

- user.name = Rieal_
- user.email = 3591277685@users.noreply.github.com

## 二、本地环境与已知问题

- 操作系统：Windows，终端 PowerShell
- Git 版本：2.55.0.windows.5
- 凭据管理：Git Credential Manager 已缓存 GitHub 账号 3591277685，正常 push 无需重复登录
- Codex 沙箱执行后端在 2026-10-15 的会话中故障（报错 helper_unknown_error: setup refresh had errors），沙箱内的命令执行与 node 运行时均无法启动，只能以「沙箱外」方式执行命令
- 沙箱进程以受限账号 LAPTOP-ILL817PQ\CodexSandboxOffline 写入文件，与真实用户 rieal 不一致，会让 git 报 dubious ownership；当时的处理是删除该 .git 后由 rieal 重新初始化
- 目录搬迁后，Codex 的工作区路径仍指向已删除的 D:\RiealDeepseek，因此在会话中执行命令需要显式指定工作目录 D:\RiealProgram

## 三、已完成的操作（时间线）

1. 初始化仓库：git init -b main，配置提交身份与 remote origin
2. 创建 README.md 与通用 .gitignore（覆盖 Windows / Python / Node / IDE / 密钥）
3. 首次提交 6f53bef「chore: 初始化仓库，添加 README 与 .gitignore」，经 GitHub 设备码授权推送成功
4. 目录改名：D:\RiealDeepseek → D:\RiealProgram。直接改名被系统拒绝（该目录是 Codex 的工作区根目录、被占用），改用整体搬移内容到新目录，旧目录清空后删除。git 不记录绝对路径，因此不受影响
5. 处理一次推送被拒：远程有网页端提交 9bcf396「Update README.md」，本地落后 1 个提交，且本地 README 暂存改动与远程冲突。处理方式：将本地 README 备份到 C:\Users\rieal\AppData\Local\Temp\README.local-backup.md，还原工作区，再 git pull --ff-only 快进
6. 用户自行完成两次提交并推送成功：3beaad0「补充git使用方法和常用命令」、37a9155「改变布局」
7. 创建项目记忆文件：先建为 AGENT/AGENTmemory.md，随后按用户要求改名为 AGENT/AGENT.md，并同步更新文件内的自我引用
8. 配置 Codex 指令文件：全局 C:\Users\rieal\.codex\AGENTS.md 写入「把项目下所有对话用中文整理进 AGENT/AGENT.md」的规则；项目 D:\RiealProgram\AGENTS.md 写入本项目约定并指向 AGENT/AGENT.md
9. 将 AGENT/ 记忆文件与 AGENTS.md 提交并推送到 GitHub，提交信息为「添加项目记忆文件与 AGENTS.md 约定」
10. 用户询问「我们之前做了什么」，助手读取本文件、README.md、git log 与工作区状态后向用户汇报历史；核对中发现本文件第九节仍有「AGENT/ 与 AGENTS.md 尚未提交」的过期待办（实际已在提交 bd3d86d 完成），以及第一节「当前最新提交」字段停留在 37a9155，均一并修正。随后用户询问工作区变更是否正确，助手核对后再次校订本文件措辞。本次更新推送时一度连不上 GitHub（Connection was reset / Could not connect to server），重试后成功；中途一次 amend 重写了已推送的提交导致 non-fast-forward，用 `git reset --soft origin/main` 把改动接到远程提交之上解决（未丢失任何内容）

## 四、用户的要求与交流偏好

- 使用中文交流，回复也使用中文
- 倾向于让助手直接动手完成，而非只给步骤；给出命令时要说明每一步的作用
- git 属于边学边用：会自己在终端敲命令，也会直接在 GitHub 网页上编辑文件
- 关心原理，会追问「为什么」，例如报错原因、特殊字符怎么打出来
- 曾提到希望本地改动能自动同步到 GitHub（尚未实施）
- 要求把项目下的对话内容与要求用中文整理进 AGENT/AGENT.md，并已通过全局指令固化下来

## 五、已解答的问题速查

- GitHub 是做什么的：基于 Git 的代码托管与协作平台，含 Pull Request、Issue、Actions、Releases 等能力
- 在目录里放文件不会自动上传，必须走 add → commit → push 三步
- 手动提交与推送的完整流程（见第八节）
- 报错 error: pathspec '-' did not match any file(s) known to git：命令被敲成 git commit - -m "..."，多了一个横杠，多出的 - 被当成文件名
- 报错 ! [rejected] main -> main (fetch first)：远程有本地没有的提交，先 git pull --rebase 再 push
- 特殊字符输入：反引号（grave accent，U+0060）在键盘左上角、Esc 下方、数字 1 左侧；Shift 加同一键是波浪号 ~；中文标点状态下可能打出全角 ｀，需先切到英文状态。Markdown 中三个反引号表示代码块
- 不认识的字怎么打：直接复制粘贴 / Win + . 打开符号面板 / 运行 charmap 字符映射表
- Codex 本地记忆文件在哪里：见第八节
- 「我们之前做了什么」：见第三节时间线与本节速查，摘要为——搭建并推送了 RiealProgram 仓库（README + .gitignore）、把目录从 D:\RiealDeepseek 搬到 D:\RiealProgram、处理过一次远程 README 冲突、建立了项目记忆文件 AGENT/AGENT.md 与两级 AGENTS.md 指令
- 模型名旁边的圆环和「背景信息窗口」提示是什么：那是输入框右下角的上下文用量指示器（context usage donut）。悬停显示「Context window:」+「{usage}% used ({remaining}% left)」+「{usedTokens}k / {contextWindow}k tokens used」，例如「47k / 996k tokens used」表示这次对话已占用约 4.7 万 token，所选模型的总上下文窗口约 99.6 万 token。作用是知道当前对话还剩多少上下文空间、会不会触发压缩（旧内容被摘要），据此决定何时开新对话；它不是计费额度或次数限制。中文界面里的「背景信息窗口」是 Context window 的误译、「标记」是 tokens 的误译（宜译「词元」）

## 六、约定与注意事项

- 工作目录固定为 D:\RiealProgram，旧路径 D:\RiealDeepseek 已不存在
- 推送标准流程：git add . → git commit -m "说明" → git pull --rebase → git push
- 不要同时在 GitHub 网页和本地修改同一个文件，容易产生冲突（README.md 已经踩过一次）
- .gitignore 已排除 .env、node_modules/、dist/ 等，被排除的文件不会上传
- git 不跟踪空文件夹，需要放占位文件（如 .gitkeep）才会出现在仓库里
- 大文件、临时文件、包含密钥的文件不要提交
- 全局指令文件 C:\Users\rieal\.codex\AGENTS.md 规定：每个项目都要把对话整理进 AGENT/AGENT.md
- 项目指令文件 D:\RiealProgram\AGENTS.md 会被 Codex 自动读取，修改它即改变本项目的工作约定

## 七、仓库当前文件

- .gitignore：通用忽略规则
- README.md：项目说明，含仓库信息、常用命令、使用方法；「目录结构」一节仍为待补充
- AGENTS.md：项目级 Codex 指令文件，写明本项目约定并指向本文件
- AGENT/AGENT.md：本文件，项目记忆

截至 2026-10-15 核对的结论：核对前工作区干净、main 与 origin/main 同步，共 5 个提交（最新 bd3d86d「添加项目记忆文件与 AGENTS.md 约定」）。核对后本文件的第三节、第五节、第七节、第九节已更新并推送成功；提交数量与最新哈希请以 `git log` 为准。远程地址为 origin = https://github.com/3591277685/RiealProgram.git

## 八、Codex 自身记忆机制（2026-10-15 查证）

- 全局指令文件：C:\Users\rieal\.codex\AGENTS.md。官方说明：Codex 在该目录先读 AGENTS.override.md，没有才读 AGENTS.md，且只取该层第一个非空文件（空文件等于没写）。本次已写入「把项目下的对话用中文整理进 AGENT/AGENT.md」的规则
- 项目级指令文件：项目根目录的 AGENTS.md，Codex 会自动读取。本次已在 D:\RiealProgram\AGENTS.md 写入本项目约定
- 应用自动积累的记忆：C:\Users\rieal\.codex\memories_1.sqlite（SQLite，含 stage1_outputs、jobs、consolidation_progress 等表）。config.toml 中 [features] memories = true，[memories] generate_memories / use_memories = true，由程序自动管理，不要手改
- 对话原始记录：C:\Users\rieal\.codex\sessions\2026\10\15\rollout-*.jsonl，索引为 session_index.jsonl
- 官方文档：https://developers.openai.com/codex/guides/agents-md（AGENTS.md 自定义指令）、https://developers.openai.com/codex/memories（Memories）
- 应用界面文案的位置：C:\Program Files\WindowsApps\OpenAI.Codex_<版本>\app\resources\app.asar。本次装的是 26.1007.9446.0，可用 `rg -a -b -o -F "关键字" app.asar` 快速定位字符串与字节偏移，再用 PowerShell 的 FileStream 定点读取上下文，即可看到某个界面元素的英文原文（defaultMessage）与说明（description）
- 官方文档域名 developers.openai.com 从本机 curl 访问返回 HTTP 403（带浏览器 UA 也一样），排查界面文案时可直接查 app.asar 里的 defaultMessage

## 九、待办与后续方向

- 补齐 README 的「目录结构」
- 可选：配置一键同步脚本（sync.ps1）或 post-commit 自动 push 钩子
- 按全局指令「日期标注要求」维护「每日记录（按日期汇总）」：每天的对话与总结追加到当天日期小节
- 本文件应随重要操作持续更新，新记录追加到时间线
- ~~AGENT/ 与 AGENTS.md 尚未提交到 git~~ 已完成：提交 bd3d86d 并推送（2026-10-15 核对确认）
