# /commit-push-pr
按以下流程完成：
1. `git status` 看变更
2. `git diff --staged` 复述变更内容
3. 按 conventional commits 写 commit message（feat/fix/chore/refactor/docs/test）
4. `git add -A && git commit -m "<message>"`
5. `git push origin HEAD`
6. `gh pr create --fill --base main`
7. 把 PR URL 打印出来
