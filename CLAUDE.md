# Project: Hermes-Boris-Game

> 纯文字 + 16-bit 视觉像素风格的 Windows 独立游戏，**对标 Tales of the Black Forest**。
> 学习目标：用 Boris Cherny 的 "loops" 工作流做每日 5 次 commit 的节奏练手。
> 体量目标：构建产物 < 1GB（dist 目录 < 1GB）。

## 游戏定位（核心方向）

| 维度 | 定位 |
|------|------|
| 类型 | **Visual Novel / Light Novel-style**（视觉小说为主，轻解谜 + 短追逐） |
| 引擎参考 | RPG Maker 风格（线性剧情、低自由度、读文本为主） |
| 视觉 | 16-bit 像素、怀旧、90s 平成年代日本感 |
| 内容比 | **50%+ 时间读对话文本**，其余走格子 + 简单交互 |
| 时长目标 | 单次通关 3-4 小时 |
| 自由度 | **线性剧情**，不做开放世界、不做战斗系统 |
| 平台 | Windows 优先（不要求 Mac/Linux） |

## 绝对不要做的事（重要——避免跑偏）
- ❌ 不要做开放世界 / 沙盒 / 自由探索（**这是 VN，不是神界原罪 2**）
- ❌ 不要做战斗系统 / 技能树 / 装备
- ❌ 不要做多结局分支（除非显式规划）
- ❌ 不要做多人 / 联机
- ❌ 不要用 3D 资产（坚持 16-bit 像素）
- ❌ 不要让主循环里有"实时战斗"
- ❌ 不要装 npm 或 yarn 依赖（用 pnpm）
- ❌ 不要把 `node_modules/`、`dist/`、`.verify/`、`*.aseprite` 提交
- ❌ 不要在主分支直接 push（必须 PR）
- ❌ 不要用 `--dangerously-skip-permissions`

## 命名约定
- TS/TSX：PascalCase 组件名，camelCase hooks / utils
- 文件名：kebab-case（`game-loop.ts`、`render-pixels.ts`）
- 资源目录：`assets/text/`、`assets/sprites/`、`assets/audio/`
- 分支：`feat/<slug>`、`fix/<slug>`、`chore/<slug>`

## 包管理
- 永远用 `pnpm`，**不要用 npm 或 yarn**
- 装包：`pnpm add <pkg>`；跑脚本：`pnpm <script>`

## 常用命令

| 操作 | 命令 |
|------|------|
| 跑游戏 | `pnpm dev` |
| 打包 | `pnpm build` |
| 单测 | `pnpm test` |
| 端到端 | `pnpm test:e2e` |
| 格式化 | `pnpm format` |
| Lint | `pnpm lint` |
| 类型检查 | `pnpm typecheck` |
| 提交+推送+PR | `/commit-push-pr` |

## 视觉像素风格约束
- 主分辨率：480×270 内部渲染，画布任意放大
- 调色板：限定 16 色 NES 风格（`assets/palette.json` 定义）
- 字体：等宽像素字体（如 "Press Start 2P"），**不要用系统字体**
- 禁止平滑/抗锯齿：`image-rendering: pixelated`

## 文字系统约束
- 纯文字对话/旁白为主，**对话文本必须支持中文**
- 字体：等宽中文像素字体（"Zpix" 或 "Fusion Pixel Font"）
- 对话框：`src/ui/dialog.ts`，所有对话走这个组件

## 测试门禁
- 修改后必须跑 `pnpm typecheck && pnpm test`
- 任何 PR 必须有对应的测试文件（`*.test.ts` 与源文件同目录）

## 项目结构

```
Hermes-Boris-game/
├── src/                # 源代码
│   ├── core/           # 游戏循环、状态机
│   ├── ui/             # 文字对话框、菜单
│   ├── render/         # 像素渲染
│   ├── text/           # 文字系统、剧情脚本
│   └── main.ts         # 入口
├── assets/             # 资源
│   ├── palette.json    # 16色调色板
│   ├── sprites/        # 像素素材
│   ├── audio/          # 音效
│   └── text/           # 剧情脚本（JSON/YAML）
├── tests/              # 测试
├── docs/               # 设计文档
├── CLAUDE.md           # 本文件
└── README.md
```

## 日 commit 5 次节奏（loops 工作流）
- 早上一次：规划今天的 3-5 个 commit
- 每完成一个小功能就 commit（不攒 commit）
- 晚上一次：复盘，把"今天 Claude 犯的错"追加到本文件的「已知陷阱」

## 已知陷阱（Compounding Engineering 积累区）
> 每发现一个 Claude 犯的错就追加一条，写明日期。

- [2026-06-07] 初始化：先有这个文件，再迭代内容
- [2026-06-07] setup.ps1 的 PowerShell heredoc `@'...'@` 在内容含 `- [...]` 行时会被解析成参数；下次写脚本改用 `[System.IO.File]::WriteAllText` 或拆成多个小段
