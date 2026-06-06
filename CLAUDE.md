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

## 主题约束（2026-06-07 sprint-week1 锁定）

> 主题 = 都市传说 + 平成泡沫经济（完全抄黑森町绮谭）

- ❌ 不做战斗 / 技能 / 装备
- ❌ 不做开放世界 / 沙盒
- ❌ 不做多结局分支（只做"普通结局 + 真结局"两版）
- ✅ 主题 = 都市传说 + 平成泡沫经济（完全抄黑森町绮谭）
- ✅ 剧本走 **YAML 化**（不用 JSON，不用硬编码）
- ✅ 谜题 = **L1 + L2 占 80%**（观察 + 收集），L3 几乎不用
- ✅ 对话 **30-50 字 / 页**，不超过 3 行
- ✅ 调色板 = 3 套按章节切，**不用单色**（详见 `docs/dev-plan-full.md` 第 2.5 节）
- ✅ BGM = 8-12 首，**突发音效**比循环 BGM 更重要
- ✅ 存档 = 10 槽 + 截图，每章开头自动存档
- ✅ 防闪退 = try/catch 包裹场景切换 + 定期保存

## 章节约束

- 序章 15-20 分钟（无谜题，介绍主角+引导者）
- 章节 60-90 分钟（2-3 谜题，高潮事件）
- 尾声 15-20 分钟（真相 + 余韵 + 制作名单）

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
- [2026-06-06] pnpm 11 把 `pnpm.onlyBuiltDependencies` 从 `package.json` 移除，必须改写进 `pnpm-workspace.yaml` 的 `allowBuilds` 块（新键名），或在 `.npmrc` 用其他机制；写到 `package.json#pnpm` 会被忽略并打 WARN
- [2026-06-06] pnpm 11 对 native 包（electron、esbuild、@biomejs/biome）的 postinstall 加了硬性 "approve builds" 关卡；不批准就直接 exit 1，必须配 `allowBuilds` 才放行
- [2026-06-06] electron 二进制在 GitHub Releases 直连经常 `ECONNRESET`（沙盒/国内网络），`.npmrc` 加 `electron_mirror=https://npmmirror.com/mirrors/electron/` 后秒下；这是中国开发者必加
- [2026-06-06] electron-builder 25 拉了 `app-builder-bin@5.0.0-alpha.10` 上来，在 Windows 上跑 `process failed ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`；CI 用 `--dir` 暂时跳不过，疑似 pnpm 提升解析问题；考虑降级到 electron-builder 24 或固定 app-builder-bin
- [2026-06-06] `pnpm pack` 是 pnpm 内置的 npm pack 命令（打 tarball），不是 `package.json#scripts.pack`；要跑自定义脚本必须用 `pnpm run pack`
- [2026-06-06] 相对路径深度 off-by-one：`src/renderer/src/main.ts` 到 `src/shared/` 是 `../../shared`，但 `src/renderer/src/states/*.ts` 是 `../../../shared`（多一层）；`palette.ts` 同理要对 `../../../../assets/...`，而 `dialog-state.ts` 也是 `../../../../assets/text/...`，容易抄错
- [2026-06-06] web tsconfig 不包含 Node 类型，`NodeJS.Platform` 命名空间不能直接用；要导出共享 API 类型必须用字面量联合类型（`'win32' | 'darwin' | ...`）而不是 `NodeJS.Platform`
- [2026-06-06] `import x from './foo.json'` 在 web tsconfig 下需要 `.d.ts` 声明 `declare module '*.json'`；否则 `Cannot find module`
- [2026-06-06] `Proxy({} as T, handler)` 不满足 TS2740（缺一堆属性），必须 `as unknown as T` 中转
- [2026-06-06] biome `lint/style/noCommaOperator` 禁止 `(a, b)` 形式；侧效一句话能展开就展开，不能就用 `if/else`
- [2026-06-06] biome `lint/complexity/useLiteralKeys` 禁止 `process.env['FOO']`；直接写 `process.env.FOO`（TS 的 noPropertyAccessFromIndexSignature 规则需要单独管）
- [2026-06-06] `.claude/settings.json` 用 CRLF 换行，biome format 跑一遍会试图改成 LF，CI 上 `biome format .` 会 fail；把 `.claude/**` 加到 `biome.json#files.ignore` 才能过
- [2026-06-06] vitest happy-dom 15 不实现 `CanvasRenderingContext2D`（`getContext('2d')` 返回 null）；测试必须注入 Proxy mock，不能依赖 DOM
- [2026-06-06] 测试 mock 暴露的 `__press` / `__pressed` 等辅助方法，类型上必须把 `ctx.input` 扩成 `MockInput`（extends `InputSnapshot`）；直接当 `InputSnapshot` 用会 TS2339
- [2026-06-06] 对话/动画测试要"按帧推进"：state 内部时钟 + `update(ctx, dtMs)` 多次调用，再 `exit()` 拿决策；不要把 `exit` 当一次性接口
- [2026-06-06] **CI 教训**：`actions/checkout@v4` 的 `autocrlf: false` 参数是 **no-op**（v3 → v4 已重写）。windows-latest runner 的 git 全局 `core.autocrlf=true` **会覆盖** checkout 行为，文件仍然被转 CRLF。要真正控制 line ending 必须用 **`.gitattributes` 文件**（`*.ts text eol=lf` / `* text=auto eol=lf`）。诊断走错路：从"加个参数试试"开始 → 浪费 1 个无效 commit → 抓真实 CI log 才看出根因。教训：**加 workflow 参数前先查当前主版本文档**
- [2026-06-07] electron-builder 24 在 Windows 非 admin 用户下解 `winCodeSign-2.6.0.7z` 时挂：7z 要在 cache 里建 `darwin/10.12/lib/libcrypto.dylib`、`libssl.dylib` 这两个 macOS symlink，但 Windows 默认不允许非 admin 创 symlink → `cannot execute cause=exit status 2` / `ERROR: Cannot create symbolic link : 客户端没有所请求的特权`。我们只 pack win32，根本用不到 macOS signing。**3 个解法按推荐序**：(a) **Windows → Settings → For Developers → "Developer Mode" 开**（最干净，全局生效）；(b) `electron-builder.yml` 加 `win.signtoolOptions` 或环境变量 `CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过 codesign 步骤；(c) 用 admin PowerShell 跑一次让 cache 解开后续就能用
- [2026-06-07] **PowerShell heredoc 写带 `"` 的多行 commit message 会断**：`@"..."@` 块里的双引号会被 PowerShell 解析成参数边界，heredoc 提前闭合，commit message 残缺。**解法**：(1) 用 `[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)` 写到 `%TEMP%\msg.txt`；(2) `git commit -F $env:TEMP\msg.txt`（**用 `-F` 而不是 `-m` 也不是 `<`**）。或者用单引号 heredoc `@'...'@`（不展开变量）也行
- [2026-06-07] **直接写 `.git/...` 路径被 safety hook 拦**：Bash 工具对 `C:\code\Hermes-Boris-game\.git\xxx` 这种路径会拒（"危险路径"），即使只是想 cat 一下看 hook 错误。**解法**：`git -C <project_root> xxx` 或 `cd` 进项目根再操作。**通用**：任何 `.git/` 内文件操作走 git CLI 命令，不直接路径读写
- [2026-06-07] **biome 拦非标准 CSS 属性**：`font-smooth: never` / `-moz-osx-font-smoothing: auto` 等非标准（或 vendor 前缀不完整）会被 biome lint 拒绝。**解法**：只写**完整 vendor-prefix 形式**（如 `-webkit-font-smoothing: none` + `-moz-osx-font-smoothing: grayscale`）或**完全标准属性**（如 `font-smooth` 不存在就别用）。biome 规则倾向严格 CSS spec
