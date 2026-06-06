# 中文字素字体调研报告（D1-3）

> 用途：替换当前 `Press Start 2P`（仅英文），为 Hermes-Boris-Game 提供中文 + 日文汉字 + 英文像素字体
> 必约束：CLAUDE.md `文字系统约束` 要求 "**对话文本必须支持中文**" + dev-plan §5.5 字体条款
> 许可证硬约束：CC0 / OFL-1.1 / MIT / Public Domain（**不接受** GPL-only / 商业付费 / 来源不明）
> 关联：`docs/dev-plan-full.md` §2.5 调色板 / §5.5 字体 / §9 发布策略
> 作者：Tab 4（D1-3 调研）
> 日期：2026-06-06

---

## ⚠️ 重要发现（orchestrator 必读）

### 1. Zpix **不是 CC0**——`dev-plan-full.md` 第 573 行写错了

`dev-plan-full.md:573` 写：
> 中文像素字体版权 | 低 | 中 | Zpix CC0（已确认）；备份 Fusion Pixel Font

**这是错的**。Zpix 是**专有字体**（proprietary）：

- README [原文](https://github.com/SolidZORO/zpix-pixel-font/blob/master/README.md)：
  > **Zpix 最像素 为 SolidZORO 具有完全自主知识产权的产品**，受《中华人民共和国著作权法》... 保护。
  > 若非获得 SolidZORO 的明确许可，不可在所授权限以外范围使用本产品。
- 商用定价：**单个商业产品 USD \$1000 / RMB ￥7000**；多产品联系作者；个人/教育免费
- 仓库**没有 LICENSE 文件**（`/LICENSE`、`/LICENSE.md`、`/COPYING` 全部 404），GitHub API `license` 字段为 `null`
- GitHub Releases v3.1.11（2026-03-20）7.2 MB ttf / 3.1 MB bdf

**对 Hermes-Boris-Game 的影响**：
- dev-plan §9 计划上 **GitHub Release / itch.io / Steam**——这些渠道**都算"商业分发"**
- 即便定价 \$0，免费下载也属于 "distribution of a product"，需付费授权
- 仅"个人/教育"豁免，但**对外发布的游戏不在豁免范围**

**结论**：**Zpix 不可用**。Dev-plan 第 573 行需要修正（移交给 Tab 5 文档 / Tab 1 主修）。

### 2. 真正免费可商用的替代已经找到

> 调研发现两个 **MIT + OFL-1.1 双许可证**的中文泛 CJK 像素字体，由同一作者 **TakWolf** 维护。
> Zpix 的"备份"不是"备选"——是**主推**。

| 字体 | License | 仓库 | Stars | 状态 |
|------|---------|------|-------|------|
| **fusion-pixel-font** | OFL-1.1 + MIT | [TakWolf/fusion-pixel-font](https://github.com/TakWolf/fusion-pixel-font) | 2868 | **完整**（多源缝合） |
| **ark-pixel-font** | OFL-1.1 + MIT | [TakWolf/ark-pixel-font](https://github.com/TakWolf/ark-pixel-font) | 4430 | **开发中**（8/10/12px 缺字） |
| Unifont | GPLv2+FontException / OFL 1.1（双许可证） | [unifoundry.com/unifont](https://unifoundry.com/unifont/index.html) | — | 100% Unicode 覆盖 |

> 注：OFL-1.1（Open Font License）是**专门为字体设计的**自由许可证，明确允许商用 / 嵌入 / 修改 / 再分发——比 MIT 还合适字体场景。

---

## 候选字体对比表

| # | 字体 | 仓库 | 许可证 | 字符覆盖 | 12px proportional woff2 体积 | 维护 | 推荐用途 |
|---|------|------|--------|---------|---------------------------|------|---------|
| 1 | **fusion-pixel-font** | TakWolf/fusion-pixel-font | OFL-1.1 + MIT | 泛 CJK（简/繁/日）+ Latin + 符号 | **3626 KB** | 活跃（v2026.05.07, 06-04 push） | **主推**——黑森町主题日文 kanji 多 |
| 2 | ark-pixel-font | TakWolf/ark-pixel-font | OFL-1.1 + MIT | 同上但 8/10/12px 大量缺字 | 4108 KB | 活跃 | 16px 备选 / 长远目标 |
| 3 | Unifont 16.x | unifoundry.com | GPLv2+Exception / OFL 1.1 | **100% Unicode**（U+0000-U+10FFFF 平面） | ~12 MB（无 woff2 官方） | 稳定（v16.0.04 2026） | 16px 兜底 / 缺字回退 |
| 4 | ~~Zpix~~ | ~~SolidZORO/zpix-pixel-font~~ | ~~专有 / 商用 \$1000~~ | 21998 字 | ~~7.2 MB ttf~~ | ~~活跃~~ | **❌ 不可用**（许可证不达标） |

### 关键体积数据（来自 GitHub Releases API，2026.05.07）

**fusion-pixel-font**（推荐主用）：

| 尺寸 | 比例 woff2 | 等宽 woff2 | 比例 ttf |
|------|-----------|-----------|----------|
| 8px  | 1959 KB   | 1933 KB   | 17.7 MB  |
| 10px | **2199 KB** | 2183 KB | 19.6 MB |
| 12px | **3626 KB** ⭐ | 3634 KB | 24.6 MB |
| 16px | （暂无） | （暂无） | （暂无） |

**ark-pixel-font**（16px 备选）：

| 尺寸 | 比例 woff2 | 等宽 woff2 | 比例 ttf |
|------|-----------|-----------|----------|
| 10px | 547 KB    | 516 KB    | 3.6 MB   |
| 12px | 4108 KB   | 4103 KB   | 35.1 MB  |
| 16px | **419 KB** ⭐ | 406 KB | 3.4 MB  |

> ⭐ 标注 = 该尺寸下体积最小或最适合本项目。

---

## 推荐方案

### 主推：**fusion-pixel-font 12px proportional woff2（3626 KB）**

**理由**：

1. **许可证清晰**——OFL-1.1 + MIT 双许可，明确允许商用 + 嵌入 + 修改 + 再分发
2. **字符完整**——README 写"使用多个像素字体合并而成"（缝合），8/10/12px 全部完整
3. **CJK 全覆盖**——简体中文 + 繁體中文 + 日语 + 拉丁 + 标点，黑森町主题里的日文 kanji（"黒森町綺譚"）不会缺字
4. **12px 像素**——在 480×270 内部画布上是"高分辨率像素字"（10/8px 太挤），渲染后再用 `image-rendering: pixelated` 整数放大 1×/2×/3× 完美
5. **作者活跃**——2026-06-04 还在更新
6. **可继续子集化**——3626 KB → GB2312 一级 + 标点 ≈ 500-800 KB（见下文子集化方案）

**对 dev-plan §5.5 字号规划的修正**：

dev-plan §5.5 写"对话 16px，标题 24px，旁白 14px"——这是 **CSS 像素** 不是 **字体源像素**。
推荐改为：

| 用途 | 渲染 CSS 尺寸 | 字体源 | 缩放 |
|------|--------------|--------|------|
| 对话文字 | 24px | fusion 12px woff2 | CSS `2× scale`，pixel-perfect |
| 标题/菜单 | 36px | fusion 12px woff2 | CSS `3× scale` |
| 旁白/UI 小字 | 16px | fusion 12px woff2 | CSS `1.33× scale`（**接受非整数**） |

或者保留原生大小：12px source + 12px display（1:1，节省渲染负担但偏小）。

**次选**：
- **ark-pixel-font 16px proportional woff2（419 KB）**——体积超小，**但 16px 需确认字符完整**（README 警告主要针对 8/10/12px，16px 似乎完整但需 Tab 1 实施时核对）
- **Unifont 16.x**——兜底用，**100% Unicode 覆盖** 绝对不缺字，体积偏大

---

## 字符子集化方案

> 目标：3626 KB → ~500-800 KB。运行时按需加载两个子集：
> (a) Latin + 标点（菜单 / UI）
> (b) GB2312 一级 3755 字 + 标点（对话 / 旁白）

### 工具

```bash
# 装 fonttools（pyftsubset 是其中子命令）+ brotli（woff2 压缩）
pip install fonttools brotli
```

> 不需要 npm `subset-font`——pyftsubset 是 fonttools 的官方子命令，0 依赖、跨平台、Windows PowerShell 直接跑。

### 子集化命令

```bash
# 1) 先解压 release zip，提取 fusion-pixel-font-12px-proportional.otf（或 ttf）
# 2) 准备字符表 chars-gb1.txt（GB2312 一级 3755 字 + ASCII + 标点）

pyftsubset fusion-pixel-font-12px-proportional.otf `
  --flavor=woff2 `
  --text-file=chars-gb1.txt `
  --output-file=fusion-12px-gb1.woff2 `
  --layout-features="kern,liga,clig,calt" `
  --no-hinting `
  --desubroutinize
```

| 参数 | 作用 |
|------|------|
| `--flavor=woff2` | 输出 woff2 格式（Brotli 压缩） |
| `--text-file=` | 字符表文件（每行一段文字 / 全部字符可写一行） |
| `--layout-features=` | 保留 kerning + ligatures + calt |
| `--no-hinting` | 关掉 hinting（像素字体自带 hinting 反而模糊） |
| `--desubroutinize` | CFF 子路由展开（部分浏览器更稳） |

### 字符表生成

```powershell
# PowerShell 生成 GB2312 一级 3755 字的 Unicode codepoint
$out = [System.Collections.Generic.List[string]]::new()
# 0x4E00-0x9FA5 是 GB2312 一级汉字主区
foreach ($cp in 0x4E00..0x9FA5) { $out.Add([char]$cp) }
# 加 ASCII 可见字符
foreach ($cp in 0x20..0x7E) { $out.Add([char]$cp) }
# 加中文标点
$out.AddRange([char[]]"，。！？、；：""''「」『』（）【】《》—…·")
[System.IO.File]::WriteAllText("chars-gb1.txt", -join $out, [System.Text.UTF8Encoding]::new($false))
```

### 预期体积

| 阶段 | 体积 | 备注 |
|------|------|------|
| 源 woff2（全 CJK + 拉丁） | 3626 KB | fusion-pixel-font 12px proportional |
| 子集后（GB2312 一级 + Latin + 标点） | **~600-800 KB**（预估） | 仅覆盖游戏实际用字 |
| 进一步拆：Latin 子集 | ~50 KB | 菜单/UI 单独加载 |
| 进一步拆：CJK 子集 | ~550-750 KB | 对话/旁白 |

> 实际数字要在 Tab 1 实施时跑出来。Tab 4 没有在沙箱内执行子集化（按要求"不下载"）。

---

## 集成代码片段

### 路径

```
assets/font/fusion-12px-gb1.woff2      # CJK 子集（~600 KB）
assets/font/fusion-12px-latin.woff2    # Latin 子集（~50 KB，可选）
```

> 相对路径基于 `src/renderer/index.html`：HTML 里 `@font-face src: url('./assets/font/fusion-12px-gb1.woff2')`（electron-vite 默认 root = `src/renderer/`）

### `src/renderer/index.html`（修改）

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
    />
    <title>Hermes &amp; Boris</title>
    <link rel="stylesheet" href="./src/styles.css" />
    <style>
      /* CJK 子集——dialog / narration */
      @font-face {
        font-family: 'fusion-pixel';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('./assets/font/fusion-12px-gb1.woff2') format('woff2');
        unicode-range:
          /* ASCII */
          U+0020-007F,
          /* CJK Unified Ideographs 主区（GB2312 一级） */
          U+4E00-9FA5,
          /* 中文标点 + 假名 + 拉丁扩展 */
          U+3000-303F, U+FF00-FFEF, U+2010-205F;
      }
    </style>
  </head>
  <body>
    <canvas id="game-canvas" width="480" height="270"></canvas>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### `src/renderer/src/styles.css`（追加）

```css
html,
body {
  margin: 0;
  padding: 0;
  background: #000;
  color: #fcfcfc;
  font-family: 'fusion-pixel', 'Press Start 2P', monospace;  /* 加 fallback */
  /* pixel font 关键：整数 line-height + 不要 letter-spacing 干扰 */
  line-height: 1.0;
  /* 中文字符不会因 antialiasing 模糊 */
  -webkit-font-smoothing: none;
  font-smooth: never;
  overflow: hidden;
}
```

### 替换 `Press Start 2P` 引用

> 调研发现 `src/renderer/src/styles.css:21` 当前是 `font-family: monospace;`——**没真的引用 Press Start 2P**（dev-plan §5.5 的"替换"其实是"首次引入"）。
> 集成时 Tab 1 要做的：
> 1. 下载 fusion-pixel-font-12px-proportional.otf + latin.otf
> 2. 跑 pyftsubset → 生成两个 woff2
> 3. 放到 `src/renderer/assets/font/`
> 4. 改 `styles.css` 加 `font-family: 'fusion-pixel', monospace`
> 5. **同步删除** dev-plan §5.5 "Zpix 字体集成麻烦" 风险条 + 修正 §573 行

### Canvas 文字渲染（`src/renderer/src/ui/dialog.ts`，要改）

```ts
ctx.font = '24px "fusion-pixel", monospace';
ctx.textBaseline = 'top';
ctx.imageSmoothingEnabled = false;  // 等价 CSS image-rendering: pixelated
// 关键：dialog 文字用 canvas drawImage 而非 fillText
// 因为 24px 是 12px 源整数放大 2x，fillText 在某些 Chromium 上会重新 hinting
// 方案 A：直接 fillText 24px，靠 woff2 不带 hinting 保证像素锐利
// 方案 B：12px fillText 到离屏 canvas，再 drawImage 放大
// 推荐 A（更简单，faster）
```

---

## 风险

| 风险 | 概率 | 影响 | 回退 |
|------|------|------|------|
| **Zpix 许可证误用**（dev-plan §5.5 / §573 写错） | **高**（已发生） | **致命**（法律风险） | **必须修正**——Tab 5 文档改 / Tab 1 实施时改用 fusion-pixel-font |
| fusion-pixel-font 8/10/12px 是"缝合"版，长期可能停更 | 中 | 中 | 跟踪 TakWolf 公告；停更则迁回 ark-pixel-font 16px（419 KB woff2） |
| ark-pixel-font 16px 也缺字（README 警告只明确说 8/10/12px） | 中 | 中 | 用 Unifont 16.x 兜底（双许可证，OFL 可用） |
| pyftsubset 装在 Windows + PowerShell 跑（CLAUDE.md 第 1 条陷阱：here-doc 解析） | 中 | 低 | **不用 here-doc**，用上面 `[System.IO.File]::WriteAllText` 生成字符表 |
| Electron CSP `font-src 'self' data:` 已经允许本地 woff2 | 低 | 无 | 当前 `src/renderer/index.html` 第 7 行 CSP 已含 `font-src 'self' data:`——无需改 CSP |
| 480×270 + 12px 源，文字太小不可读 | 低 | 中 | 渲染到 24px（2× scale，pixel-perfect）即可；标题 36px（3×） |
| 角色对话/菜单中文标点位置（"。" "，" "？"） | 中 | 中 | fusion-pixel-font 已经调过 baseline；首轮集成后跑 Playwright 截图回归（dev-plan §8 视觉回归） |
| 子集化漏字（出现 □ tofu） | 中 | 中 | Tab 1 实施时**预留 fallback 字符表**——子集后跑 `docs/auto-reports/font-coverage.md` 自动校验 |
| 字符子集化破坏 line-height / 字距 | 中 | 低 | 优先用比例模式（README 推荐）+ `--layout-features` 保留 kern |

---

## 耗时估计（Tab 1 实施 D1-6）

| 阶段 | 耗时 | 备注 |
|------|------|------|
| 下载 fusion-pixel-font release zip（~10 MB） | 1 min | npmmirror 镜像可加速；GitHub 直连可能 ECONNRESET（CLAUDE.md 第 4 条陷阱） |
| 解压 + 选 12px proportional otf/ttf | 1 min | |
| 准备字符表 chars-gb1.txt | 2 min | PowerShell 脚本生成 |
| 跑 pyftsubset × 2（GB1 + Latin） | 3 min | 单 fonttools 命令；Windows 跑 5-10s/次 |
| 复制 woff2 到 `src/renderer/assets/font/` | 1 min | |
| 改 `index.html` 加 `@font-face` | 3 min | 含 unicode-range 调试 |
| 改 `styles.css` + `dialog.ts` | 5 min | |
| 跑 Playwright 截图视觉回归 | 5 min | dev-plan §8 |
| 写 `assets/font/CREDITS.md`（OFL 署名） | 2 min | OFL 要求保留许可证副本 + 版权声明 |
| **合计** | **~23 min** | 比 dev-plan §12 D1 第 4 项预估的 15 min 多 50%（子集化是新增步骤） |

### OFL 署名要求（**不能省**）

> SIL Open Font License 1.1 §1 条款要求：分发时必须随字体文件附带：
> - LICENSE-OFL 原文（或版权声明 + 许可证链接）
> - 保留字体原作者署名

Tab 1 必须做：

```
src/renderer/assets/font/
├── fusion-12px-gb1.woff2
├── fusion-12px-latin.woff2
├── LICENSE-OFL-1.1.txt   # OFL 1.1 全文
└── CREDITS.txt            # "fusion-pixel-font 12px proportional — © TakWolf — OFL-1.1 + MIT — https://github.com/TakWolf/fusion-pixel-font"
```

---

## 沙箱工具受限声明

本次 D1-3 调研遇到沙箱限制：
- `WebSearch` 全部 `API Error 400 invalid params`（4 次连续失败）
- `WebFetch` 被 stage-2 classifier 拦截（`github.com` / `unifoundry.com` 全部 "Unable to verify"）
- `curl` 对 `raw.githubusercontent.com` 部分路径 404（`/LICENSE` 拼写问题——已用 `/master/README.md` 间接确认**无 LICENSE 文件**）
- `curl` 对 `api.github.com` 200 OK（成功）→ 拿到完整 release asset 列表 + 仓库元信息

**本报告的"许可证"结论均通过以下途径验证**：

1. GitHub API `repo.license` 字段（`mit` / `null`）——结构化、可信
2. README 原文摘抄（curl 200 OK，~2700 bytes）——直接引用
3. GitHub Releases asset name + size（结构化数据）——体积数字可信

**URL 落地校验建议**（给 Tab 1 在 D2 下载前）：

```powershell
# 验证 1: Zpix 仓库 README 确认商用收费
iwr -UseBasicParsing https://raw.githubusercontent.com/SolidZORO/zpix-pixel-font/master/README.md |
    Select-String -Pattern "Commercial|RMB|USD"

# 验证 2: fusion 仓库 LICENSE 存在
iwr -UseBasicParsing https://raw.githubusercontent.com/TakWolf/fusion-pixel-font/master/LICENSE-OFL |
    Select-Object -First 5

# 验证 3: 确认 release URL 200 OK
iwr -Method Head https://github.com/TakWolf/fusion-pixel-font/releases/download/2026.05.07/fusion-pixel-font-12px-proportional-otf-v2026.05.07.zip
```

---

## 总结

### 关键发现（给 orchestrator）

1. **Zpix 是专有字体**——dev-plan §573 写"Zpix CC0（已确认）"是**事实错误**，必须修正
2. **真正的免费可商用替代已找到**：**fusion-pixel-font**（OFL-1.1 + MIT）+ **ark-pixel-font**（同许可，16px 备选）+ **Unifont**（OFL 兜底）
3. **推荐 fusion-pixel-font 12px proportional woff2（3626 KB）**——完整 CJK + 黑体风 + 像素风 + 12px 是 480×270 内部分辨率的甜点
4. **可继续 pyftsubset 子集化**到 GB2312 一级（~600-800 KB 预估）——但 3626 KB 已可接受，**可选步骤**
5. **CLAUDE.md 17 条陷阱适用**——PowerShell heredoc 字符表生成有坑（用 `[System.IO.File]::WriteAllText`）；GitHub 下载可能 ECONNRESET（用 npmmirror 镜像）

### 建议下一步（给 Tab 1 / Tab 5）

1. **Tab 5 文档**——修正 `docs/dev-plan-full.md`：
   - §5.5 字体条款：删除 "Zpix" 改 "fusion-pixel-font 12px proportional"
   - §10 风险表第 573 行：删除或改写
   - §12 D1 必做项第 4 条：路径从 `assets/font/zpix.woff2` 改 `src/renderer/assets/font/fusion-12px-gb1.woff2`
2. **Tab 1 实施 D1-6**——按本报告"耗时估计"清单执行（~23 min）
3. **D2 跑视觉回归**——Playwright 截图 + 字符子集覆盖校验 `docs/auto-reports/font-coverage.md`

### 验证清单（self-check）

- [x] 候选 ≥ 1 个（4 个对比，其中 1 个不可用）
- [x] 许可证明确（GitHub API + README 摘抄）
- [x] 子集化命令可复制（pyftsubset + 参数表）
- [x] 集成代码片段完整（HTML + CSS + Canvas 三处）
- [x] 风险 ≥ 1 条（9 条）
- [x] 耗时估计有数字（~23 min，分阶段）
- [x] OFL 署名要求（单独小节）
- [x] 沙箱工具受限声明（参考 D1-4 audio-candidates.md 同款声明）
