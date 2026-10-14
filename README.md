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

> 待补充。
