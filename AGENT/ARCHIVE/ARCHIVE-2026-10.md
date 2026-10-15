# ARCHIVE — RiealProgram 项目归档日志（2026-10）

> 用途：存放 `AGENT/AGENT.md` 与 `AGENT/PERSONALITY.md` 中"较早"的内容，让主文件保持精简、便于每次对话快速读完。
> 归属项目：RiealProgram　建立：2026/10/15　最后更新：2026/10/15
> 命名规则：按月份一个文件，`ARCHIVE-YYYY-MM.md`（本文件对应 2026 年 10 月）。

## 搬迁规则

- 主文件 `AGENT/AGENT.md` 只保留最近 3 天的日期小节；更早的日期小节整块搬到当期归档文件。
- 搬迁时保留原文与措辞，不压缩、不改写；搬完在主文件的「归档索引」里加一行指向本文件。
- 人格档案 `AGENT/PERSONALITY.md` 的互动节点超过 30 条后，较早节点整块搬来本文件，主表只留索引与最近节点（描述可压缩，用户原话与关键结论不删）。
- 归档文件只追加、不整份覆盖；归档是"搬迁"不是"删除"，原内容仍在 git 历史里，随时可查。
- 与本文件相关的重要事实（如项目状态变化）同时更新主文件的主题章节，避免归档与主文件互相矛盾。

## 归档索引

| 归档日期 | 内容 | 原位置 | 迁入时间 |
| --- | --- | --- | --- |
| 2026/10/15 | 早期操作时间线（建仓、目录搬迁、README 冲突处理、记忆机制建立等 10 条） | `AGENT/AGENT.md` 第三节 | 2026/10/15 |

## 2026/10/15 · 早期操作时间线（原 AGENT.md 第三节全文迁入）

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

> 说明：2026/10/15 的其余操作（Slack 插件、人格档案、推送节奏、记忆模块查证等）仍在主文件 `AGENT/AGENT.md` 的「每日记录」与主题章节中，尚未到归档时间。
