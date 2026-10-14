# RiealProgram 项目约定

本文件是 Codex 在本项目中工作时需要遵守的约定。

## 记忆文件（重要）

- 本项目所有对话的内容、结论和用户要求，用中文整理后记录在 `AGENT/AGENT.md`。
- 开始任何工作之前，先阅读 `AGENT/AGENT.md`，其中包含项目背景、环境问题、历史操作和约定。
- 有重要操作或约定变化后，同步更新该文件：追加或修订对应章节，不要整份覆盖。

## 项目信息

- 工作目录：`D:\RiealProgram`（旧路径 `D:\RiealDeepseek` 已不存在，Codex 工作区应指向新路径）
- 远程仓库：https://github.com/3591277685/RiealProgram.git
- 默认分支：`main`
- 终端：Windows PowerShell

## 工作流程约定

- 推送标准流程：`git add .` → `git commit -m "说明"` → `git pull --rebase` → `git push`
- 提交信息使用中文，写清楚这次改了什么
- 不要同时在 GitHub 网页和本地修改同一个文件，容易产生冲突
- `.env`、`node_modules/`、`dist/` 等已被 `.gitignore` 排除，不会上传；密钥类文件绝不提交
- git 不跟踪空文件夹，需要放占位文件（如 `.gitkeep`）

## 交流约定

- 使用中文回复