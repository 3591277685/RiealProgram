# RiealProgram

Rieal 的个人项目仓库。

## 仓库信息

- 远程地址：https://github.com/3591277685/RiealProgram
- 默认分支：`main`

## 开始使用

```bash
git clone https://github.com/3591277685/RiealProgram.git
```

## 常用命令

```bash
git status            # 查看改动
git add .             # 暂存全部改动
git commit -m "说明"  # 提交
git push              # 推送到 GitHub
git restore --staged 文件名     # 暂存错了，把它拿出来（改动还在）
git restore 文件名              # 不想要这个改动了，还原成上次提交的样子（会丢失改动，慎用）
git commit --amend -m "新说明"  # 提交信息写错了，改一下（还没 push 的时候用）
git pull --rebase      # 先把远程的新提交拉下来，把你的改动接在后面
git push               # 再推上去
```

## 使用方法
```
cd D:\RiealProgram     # 1. 进入仓库目录
git status             # 2. 看有什么改动（只读，随便敲）
git add .              # 3. 把改动放进暂存区
git commit -m "说明"    # 4. 提交到本地历史
git pull --rebase      # 5. 先同步远程，避免被拒
git push               # 6. 上传到 GitHub
```
## 目录结构

```
RiealProgram/
├── README.md                  项目说明（本文件）
├── AGENTS.md                  项目级 AI 指令：本项目的工作约定
├── .gitignore                 通用忽略规则（.env、node_modules/、dist/ 等）
├── AGENT/                     记忆与人格数据
│   ├── AGENT.md               项目记忆：背景、时间线、约定、待办
│   ├── PERSONALITY.md         「识」的人格档案，每次对话开始时先读
│   └── ARCHIVE/               按月份归档的历史记录（只追加，不覆盖）
│       └── ARCHIVE-2026-10.md
└── dsh-global-agent-md/       自写 DSH 插件：把程序目录下的全局 AGENT.md 注入每次请求
    ├── index.js               宿主半边：上下文注入 + 三条 HTTP 路由
    ├── client/client.js       浏览器半边：设置 → 插件 →「全局要求」页面
    ├── cordis.patch.yml       bundle 层声明
    ├── package.json           包信息与依赖
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── README.md              安装、配置与排查说明
    └── .probe/                自检脚本（不被运行时加载）
```

## 文件说明

| 路径 | 作用 |
| --- | --- |
| `AGENT/AGENT.md` | 项目记忆：基本信息、按日期汇总的每日记录、用户偏好、约定与待办、推送状态 |
| `AGENT/PERSONALITY.md` | 助手「识」的人格档案：身份、关键词、说话方式、互动节点与迁移指引 |
| `AGENT/ARCHIVE/` | 归档文件，按 `ARCHIVE-YYYY-MM.md` 命名；主文件只留最近 3 天 |
| `AGENTS.md` | 项目级约定（提交与推送节奏、交流方式、记忆文件维护规则） |
| `dsh-global-agent-md/` | DeepSeek Harness 插件，读取 `C:\Users\rieal\.dsh\AGENT.md` 并注入每次请求；详见其自带 README |
