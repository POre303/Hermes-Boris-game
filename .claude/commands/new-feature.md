# /new-feature
输入功能描述。流程：
1. 先问 3 个澄清问题（不要直接动手）
2. 进 plan mode，给方案 + 文件改动清单 + 验收标准
3. 等用户点头
4. 用 worktree 开新分支：`git worktree add -b feat/<slug> ../wt-<slug>`
5. 实现 + 单测
6. 跑 /test-all
7. 跑 /commit-push-pr
