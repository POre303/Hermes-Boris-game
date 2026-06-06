# /screenshot-verify
对当前游戏状态跑视觉验证：
1. 启动 `pnpm dev`（后台）
2. 等 5 秒
3. 截屏到 `.verify/<timestamp>.png`
4. 检查 console 无 error
5. 报告截图路径
