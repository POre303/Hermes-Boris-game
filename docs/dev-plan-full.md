# Hermes-Boris-Game 完整游戏开发方案

> 基于 `Hermes-Boris-一周冲刺计划(草稿).md` + `黑森町绮谭对标分析报告.md` + 项目现状（`C:\code\Hermes-Boris-game`，PR #1 已合并，PR #2 待合并）
>
> 本方案把"一周冲刺"定位为 **Phase 1（垂直切片）**，向下展开到全 4-5 小时成品的完整路线图。
>
> **生成日期**：2026-06-07
> **状态**：v1.0 草稿，等用户拍板 10 个决策点后开干 D1
> **关联**：[一周冲刺计划草稿](../Hermes-Boris-一周冲刺计划(草稿).md)（在 Desktop）/ [黑森町绮谭对标分析报告](../黑森町绮谭对标分析报告.md)（在 Desktop）

---

## 0. 立项摘要

| 维度 | 内容 |
|------|------|
| **一句话定位** | 完全对标《黑森町绮谭》的 16-bit 像素视觉小说——平成泡沫经济 + 都市传说主题，4-5 小时单线剧情 |
| **核心卖点** | 剧本扎实 + 美术精致 + 节奏精准 + 谜题不打断（黑森町范式） |
| **MVP 范围（一周冲刺）** | 序章 + 第 1 章（鹿骨怪谈）= 约 90 分钟可玩 |
| **完整版范围** | 序章 + 3 章 + 尾声 = 4-5 小时，普通结局 + 真结局 2 版 |
| **引擎栈** | Electron + electron-vite + TS + 16-bit Canvas 渲染（已落地） |
| **引擎范式** | 自研 6 态状态机 + YAML 剧本驱动（已落地骨架） |
| **目标体量** | `< 1 GB`（对标黑森町 1 GB） |

---

## 1. 已有决策（来自一周冲刺草稿，继承不议）

| 维度 | 决策 | 备注 |
|------|------|------|
| 主题 | 完全抄黑森町绮谭 | 都市传说 + 平成泡沫经济 |
| 剧本格式 | **YAML** | 不混 JSON，不硬编码 |
| 调色板 | 3 套按章节切 | `tokyo_heisei` / `train_night` / `theatre_warm` |
| 章节粒度 | 严格抄 | 序章 + 3 章 + 尾声 |
| 结局 | 2 个（普通 + 真） | 不做多分支 |
| 谜题配比 | L1+L2 占 80%，L3 几乎不用 | 观察 + 收集为主 |
| 对话文本 | 30-50 字/页，不超 3 行 | 节奏优先 |
| 资产来源 | **音频 AI 优先**（Suno BGM + Stable Audio SFX，详见 `docs/research/ai-audio-prompts.md`） + freesound CC0 兜底；**美术 CC0 优先**（OpenGameArt / itch.io CC0）+ AI 占位 | 美术走 CC0，音频走 AI |
| 字体 | **fusion-pixel-font**（OFL-1.1 + MIT，12px proportional woff2 3626 KB，详见 `docs/research/zpix-font.md`） | 替换当前 Press Start 2P | ~~Zpix 是专有字体，商用 $1000~~ |
| 自动跑 | **仅 Windows Task Scheduler** | 不上 GH Actions cron |
| 包管理 | pnpm only | 见 CLAUDE.md 17 条陷阱 |
| 协作模式 | orchestrator 主 session + 5 tab | 不动 main；squash merge；SSH push |

---

## 2. 完整游戏设计文档（GDD）

### 2.1 世界观（world-bible 草案）

```
时空：现代日本（地名虚构），平行情景
时代：表世界 2010s；里世界飘忽 1980s 平成泡沫经济余韵
入口：现代主角在"异常事件"中被吸入"黑森町"（虚构地名）
核心意象：鹿骨 / 猫之列车 / 妖怪映画 / 报纸 / 蒸汽 / 黄昏广播
反题：表面是怪谈，里层是泡沫经济时代普通人的执念与失去
```

**主角**（占位命名 `nori`，可调）：
- 性别/年龄/职业留白——刻意"普通人"，让玩家代入
- 动机：被迫进入异常空间，想逃出
- 弱点：谜题难度 0/体力极弱（无战斗）

**引导者**（占位 `rin`）：
- 看似知晓规则的少女/少年，谜语式对话
- 第 1 章给方向；第 3 章揭示其真实身份（"被遗留的平成记忆"）

**配角**（每章 2-3 个）：
- 第 1 章：村长 / 失踪女孩 / 鹿雕工匠
- 第 2 章：列车员 / 猫群 / 旅人
- 第 3 章：影院老板 / 失意导演 / 胶片修复师

### 2.2 章节节奏模板（每章统一）

```
[章节头] 场景异常 → 主角介入（5min）
[第一幕] 环境建立 + 1-2 个 L1 谜题（20min）
[第二幕] NPC 接触 + 背景揭示 + 1 个 L2 谜题（25min）
[高潮]   怪谈 / 追逐 / 关键道具（L2-L3 一个）（10min）
[收束]   真相揭示 + 情感冲击（5min）
[章尾]   主角被传送到下一场景（2min）
─────────
小计     60-90 分钟
```

### 2.3 完整章节蓝图

| 章节 | 标题 | 时长 | 场景 | 调色板 | 主要谜题 | 关键道具 |
|------|------|------|------|--------|---------|---------|
| 序章 | 「黑森町的入口」 | 15-20 | 城市异常 → 进入 | `tokyo_heisei` | 0 | 一张旧报纸 |
| Ch.1 | 鹿骨怪谈 | 60-75 | 村庄（RPG Maker 风） | `tokyo_heisei` | L1 灯笼颜色 / L2 鹿骨收集 | 鹿雕、风铃 |
| Ch.2 | 猫之列车 | 60-75 | 火车站 / 列车 | `train_night` | L1 车票匹配 / L2 信号灯 | 猫铃、列车时刻表 |
| Ch.3 | 妖怪映画 | 75-90 | 剧院 / 映画 | `theatre_warm` | L3 胶片序列 / L2 舞台道具 | 胶片、剧本手稿 |
| 尾声 | 「回到 2010s 的雨天」 | 15-20 | 现实 + 真相 | `theatre_warm` | 0 | （无） |
| **合计** | | **4-5h** | | | | |

### 2.4 谜题系统设计

**L1 = 观察型**（占比 50%）
- 颜色匹配（灯笼 / 信号灯 / 道具）
- 文字顺序（车票 / 海报 / 报纸头条）
- 不需"道具栏"，靠眼力

**L2 = 收集型**（占比 30%）
- 散落物收集（鹿骨 / 猫铃碎片 / 胶片帧）
- 简单组合（把 A 放到 B 处）
- 需要"物品栏"组件

**L3 = 序列型**（占比 20%，仅用于高潮）
- 电影胶片排序（最复杂的一种）
- 信号灯时序（中等）
- 不做"复杂机关 / 锁和钥匙"

**统一接口**（在 `src/puzzle/`）：
```ts
interface Puzzle<L extends 1|2|3> {
  id: string; chapter: 1|2|3;
  type: 'L1' | 'L2' | 'L3';
  hint: string;             // 1 句话
  solution: Solution<L>;   // 校验回调
  onSolve(): SceneTransition | null;
}
```

### 2.5 调色板（3 套，按章节切）

| 章节 | palette 名 | 6 主色 | 情绪 | JSON 路径 |
|------|------------|--------|------|-----------|
| 序 + Ch.1 | `tokyo_heisei` | 暗紫 / 酒红 / 和风米 / 暮蓝 / 烛黄 / 黑 | 神秘 / 压抑 | `assets/palette-tokyo-heisei.json` |
| Ch.2 | `train_night` | 深蓝 / 铁灰 / 黄灯 / 雾白 / 站台绿 / 黑 | 离别 / 陪伴 | `assets/palette-train-night.json` |
| Ch.3 + 尾声 | `theatre_warm` | 暖红 / 金黄 / 深绿 / 幕布紫 / 胶片棕 / 黑 | 真相 / 余韵 | `assets/palette-theatre-warm.json` |

**实现**（不在一周冲刺内，但**要预留接口**）：
- `assets/palette.json` 改 JSON 数组 + `chapter` 字段
- `src/render/palette.ts` 运行时按 state 切
- 主菜单 / Settings 允许"调色板"切换（高级选项，方便录屏）

### 2.6 音频设计

| 类型 | 数量（全游戏） | 风格 | 来源 |
|------|--------------|------|------|
| BGM | 8-12 首 | 90s 复古合成器 + 钢琴 + 日本民谣采样 | **AI 生成**（Suno v3.5+，详见 `ai-audio-prompts.md`） |
| 突发音效 | 20-30 个 | 门、风铃、列车鸣笛、胶片倒带、妖怪低鸣 | **AI 生成**（Stable Audio）+ freesound CC0 兜底 |
| UI 音 | 5-8 个 | 翻页 / 选项 / 存档 / 错误 | **AI 生成**（Stable Audio 短音） |
| **合计** | 33-50 个音频文件 | | |

**关键设计原则**（已在 CLAUDE.md）：**突发音效比循环 BGM 更重要**——氛围靠"对的事件 + 对的音"，不靠 BGM 一直响。

### 2.7 UI/UX

- **对话框**（`src/ui/dialog.ts`，已存在）：打字机效果，每字 30ms，可快进
- **物品栏**（L2 谜题需要）：右下角小图标 5×2 网格
- **存档点**：每章开头自动存档 + 10 个手动槽
- **设置**：音量 / 调色板切换 / 文字速度 / 全屏
- **真结局触发**：通关一次普通结局后，在 Ch.3 高潮时自动出现隐藏选项

---

## 3. 技术架构

### 3.1 引擎栈（已落地）

```
Electron 30+        主进程 + preload + 渲染进程分离
electron-vite       构建
TypeScript          全栈类型
Canvas 2D           480×270 内部渲染，画布任意放大
Vitest              单元测试
Playwright          端到端 + 视觉回归
Biome               lint + format
pnpm                包管理
GitHub Actions      CI on windows-latest
```

### 3.2 状态机（6 态，已落地于 `src/renderer/`）

```
INTRO  → MENU  →  PROLOGUE  →  CHAPTER_X  →  EPILOGUE  →  ENDING
                       ↑          ↓
                       └──── 任何态可 → SAVE/LOAD
```

**扩展点**（Phase 2+）：
- 在 `CHAPTER_X` 内加 `Scene` 子状态机（场景图节点）
- 引入 `Puzzle<L>` 子态机（在场景内触发）

### 3.3 剧本系统（YAML 驱动，Phase 1 末落地）

```yaml
# scripts/yaml/chapter-1.yaml（草案）
chapter: 1
title: 鹿骨怪谈
palette: tokyo_heisei
duration_target_min: 70
scenes:
  - id: ch1_01_arrival
    bg: village_dusk.png
    bgm: village_quiet.ogg
    sfx_on_enter: [wind_chime.ogg]
    dialogs:
      - speaker: nori
        text: "……这是哪里？"
        portrait: nori_confused.png
        next: ch1_02_npc_old_man
  - id: ch1_02_npc_old_man
    bg: village_dusk.png
    dialogs:
      - speaker: 村长
        text: "外乡人……你不该在这时候来的。"
        portrait: elder_serious.png
    puzzles:
      - id: ch1_p1_lantern
        type: L1
        hint: "灯笼的颜色在告诉你顺序。"
        solution:
          type: color_sequence
          sequence: [red, white, red, blue]
```

**加载器**（Phase 1 实现 `src/script/yaml-loader.ts`）：
- 启动时 `pnpm build:yaml` → 输出 `dist/script.json`（运行时只读 JSON，避免 YAML parser 成本）
- 校验：zod schema（剧情节点 ID 唯一性 / 引用完整性 / 循环检测）

### 3.4 谜题系统（Phase 1 末）

```ts
// src/puzzle/index.ts
export interface Puzzle<L extends 1|2|3> {
  id: string;
  chapter: 1|2|3;
  type: 'L1' | 'L2' | 'L3';
  hint: string;
  // YAML 注入的运行时配置 + 通用 solver 调度
}
export function registerPuzzle(p: Puzzle<1|2|3>): void;
export function trySolve(id: string, input: unknown): SolveResult;
```

**3 个通用 solver**（覆盖 80% 谜题）：
- `colorSequenceSolver`（L1）
- `collectItemsSolver`（L2）
- `sequenceOrderSolver`（L3，仅 Ch.3 用）

### 3.5 音频系统（Phase 1 末）

```ts
// src/audio/index.ts
bgm.crossfade(track: string, durationMs: number): void;  // 默认 2000ms
sfx.play(track: string, opts?: {loop?: boolean; volume?: number}): void;
audio.setMasterVolume(0.0-1.0);
audio.mute();
```

**突发音效优先**：`sfx.play()` 不打断 BGM，独立通道。

### 3.6 存档系统（Phase 1 末）

```ts
// src/save/index.ts
type SaveSlot = {
  id: 0|1|...|9;
  chapter: 'prologue' | 1 | 2 | 3 | 'epilogue' | 'ending';
  scene: string;
  palette: 'tokyo_heisei' | 'train_night' | 'theatre_warm';
  inventory: string[];              // 物品 ID
  flags: Record<string, boolean>;   // 剧情标志
  solvedPuzzles: string[];          // 已解谜题 ID
  savedAt: number;                  // unix ms
  thumbnail: string;                // base64 PNG（最新一帧 240×135）
};
save.write(slot, data): Promise<void>;
save.read(slot): Promise<SaveSlot | null>;
save.list(): Promise<SaveSlotSummary[]>;
```

**存储**：`userData/saves/slot-{0..9}.json`（10 槽）+ `userData/screenshots/`（截图）

**自动存档**：每章开头强制存档到 `slot-0`（不可见）；每场景切换到 `autosave-X`（带轮转）

**防闪退保护**（已在一周冲刺 D2）：所有 `transition()` 包 try/catch + 写 `crash-recovery.json`

### 3.7 渲染管线

```
YAML scene → state.palette → render.drawBackground()
                            → render.drawPortrait()
                            → render.drawDialog()
                            → render.drawInventory()
                            → render.drawHUD()
                            → canvas.flush()
```

固定 60 FPS；480×270 内部；CSS `image-rendering: pixelated`。

### 3.8 CI / 自动验证

- **GitHub Actions**（已有）：windows-latest，typecheck + test + lint + build
- **本地**（一周冲刺 D1 加）：Windows Task Scheduler，每 5h 跑 `pnpm test-all` + Playwright 截图 + `pnpm audit`
- 失败时飞书 webhook 通知（用 `$env:LARK_WEBHOOK_URL`，用户在 profile 已配）
- 成功时只写报告 `docs/auto-reports/<timestamp>.md`（不打扰）

---

## 4. 内容生产管线

### 4.1 剧本工作流

```
大纲 (world-bible.md)
   ↓
章节 outline (docs/story/ch1-outline.md)
   ↓
场景剧本 YAML (scripts/yaml/chapter-1.yaml)
   ↓
走查：手动打 1 遍 (walkthrough.md)
   ↓
测试用例 (src/script/chapter-1.test.ts)
   ↓
合并
```

**作者：orchestrator 主 session**（你 + 我）
**走查：5 tab 之一**（dev tab 或专用 walkthrough tab）

### 4.2 美术工作流

```
风格定调 (palette + 1 张参考图)
   ↓
场景图 (bg-*.png, 480×270 内部)
   ↓
立绘 (portrait-*.png, 4 表情 × N 角色)
   ↓
sprite (道具 / 物品栏图标 32×32)
   ↓
全部丢 Aseprite 看 + 调整
   ↓
转 PNG + 标记 (sprite-sheet.json)
```

**来源策略**（按优先级）：
1. CC0 站（OpenGameArt / itch.io CC0 区）
2. AI 生成（占位，标 `[PLACEHOLDER]`）
3. 自己画（Aseprite，最慢但最对）

**Lottie/动画**暂不做——纯静态 + 局部抖动。

### 4.3 音频工作流（**AI 优先**，2026-06-06 pivot）

```
prompt 集 (docs/research/ai-audio-prompts.md)
   ↓
手动生成：BGM → Suno v3.5+ / SFX → Stable Audio
   ↓
下载 MP3/WAV → ffmpeg 转 OGG Vorbis q5
   ↓
loudnorm -16 LUFS（统一响度）
   ↓
放 assets/audio/bgm/ 或 assets/audio/sfx/
   ↓
元数据 (audio-meta.json: 章节/时长/情绪/AI 模型版本)
   ↓
CREDITS.md 标 AI 生成 + 模型版本
```

**SFX 兜底**：Stable Audio 质量不稳时，按 sfx 名字在 freesound.org 短搜 CC0（**不走**原 D1-4 全量调研）。

### 4.4 测试用例

| 类型 | 工具 | 覆盖 |
|------|------|------|
| 单元 | Vitest | 谜题 solver / 存档读写 / 状态机迁移 |
| 走查 | 手动 + Markdown | 每章 1 份 walkthrough.md（步骤清单 + 期望结果） |
| 视觉回归 | Playwright | 每个场景 1 张截图 baseline（Phase 1 D6 落地） |
| 端到端 | Playwright | 完整序章 + ch1 自动化跑 1 遍 |

---

## 5. 资产清单（全游戏范围）

### 5.1 BGM 清单（8-12 首）

| 章节 | 标题 | 情绪 | 风格 | 时长 |
|------|------|------|------|------|
| 序章 | `prologue_anomaly` | 不安 / 异世界入口 | 合成器 + 钟 | 2:30 |
| 序章 | `prologue_rin_theme` | 引导者登场 | 钢琴 + 风铃 | 1:30 |
| Ch.1 | `village_dusk` | 神秘 / 暮色 | 民谣采样 + 蝉 | 3:00 |
| Ch.1 | `village_chase` | 紧张 / 追逐 | 鼓 + 弦 | 2:00 |
| Ch.1 | `village_truth` | 真相 / 牺牲 | 钢琴 + 大提琴 | 2:30 |
| Ch.2 | `train_departure` | 离别 / 旅途 | 钟琴 + 弦 | 3:00 |
| Ch.2 | `train_night` | 陪伴 / 时间错位 | 合成器 + 雨声 | 3:30 |
| Ch.2 | `train_arrival` | 抵达 / 释然 | 钢琴 | 2:00 |
| Ch.3 | `theatre_curtain` | 期待 / 进入 | 管弦 + 钟 | 2:30 |
| Ch.3 | `theatre_film` | 映画放映 | 钢琴 + 投影机噪声 | 3:00 |
| Ch.3 | `theatre_reveal` | 真相 / 冲击 | 弦乐 + 鼓 | 2:30 |
| 尾声 | `epilogue_rain` | 回到现实 / 余韵 | 钢琴 + 雨声 | 3:00 |

### 5.2 音效清单（20-30 个）

```
[UI] page_turn / option_select / option_cancel / save / load / error
[环境] wind / rain / cicada / wind_chime / clock_tick
[Ch.1] deer_step / lantern_light / bone_collect / villager_walk
[Ch.2] train_whistle / door_slide / cat_meow / signal_click
[Ch.3] projector / film_sprocket / curtain_rise / audience_murmur
[高潮] yokai_growl / chase_pulse / truth_reveal_chord
```

### 5.3 场景图清单（12-15 张）

```
[序章] city_street / anomaly_door / black_forest_entrance
[Ch.1] village_dusk / shrine_path / deer_craft_house / chase_woods / shrine_inner
[Ch.2] station_platform / train_corridor / train_window_night / cat_carriage / station_arrival
[Ch.3] theatre_facade / theatre_lobby / screening_room / projector_room / stage_backstage
[尾声] modern_street_rain
```

### 5.4 sprite / 立绘清单

```
[主角 nori] 4 表情 × 1 角色 = 4 张
[引导者 rin] 4 表情 × 1 角色 = 4 张
[配角 ch1] 村长 + 失踪女孩 + 鹿雕工匠 × 2 表情 = 6 张
[配角 ch2] 列车员 + 旅人 × 2 表情 = 4 张
[配角 ch3] 影院老板 + 失意导演 + 修复师 × 2 表情 = 6 张
[物品] 灯笼 / 鹿骨 / 鹿雕 / 猫铃 / 车票 / 信号灯 / 胶片 / 剧本手稿 / 报纸 = 9 个 icon
```

### 5.5 字体

- **fusion-pixel-font**（OFL-1.1 + MIT，**替代 Zpix**）—— 替换 Press Start 2P
  - 12px proportional woff2 = 3626 KB，完整 CJK 覆盖
  - 详细对比见 `docs/research/zpix-font.md`（4 个候选对比 + 许可证验证 + 集成方案）
  - ~~Zpix 是专有字体，商用 $1000/产品，许可证不合规~~
- 字符子集化：仅保留 GB2312 一级 + Latin + 标点（减小 ~80% 体积），用 `pyftsubset`
- 字号：对话 16px，标题 24px，旁白 14px

---

## 6. 完整里程碑（5 个 Phase）

### Phase 0 — 基础（已完成 ✅）

| 任务 | 状态 |
|------|------|
| Electron + TS + electron-vite 脚手架 | ✅ PR #1 |
| 主进程 + preload + 渲染入口 | ✅ PR #1 |
| 6 态状态机 + 占位资产 | ✅ PR #1 |
| 单元测试 + Playwright 跑通 | ✅ PR #1 |
| CI autocrlf 教训复盘 | ⏳ PR #2 待合并 |

### Phase 1 — 一周冲刺（MVP = 序章 + Ch.1，~52h）

> 详见 `Hermes-Boris-一周冲刺计划(草稿).md` 第 1 节（在 Desktop）。本方案不重复，只追加：
> - D6 必加：**视觉回归 baseline**（每个新场景 1 张截图）
> - D7 必加：**`docs/sprint-week1.md`** 同步到本方案（追溯用）

### Phase 2 — Ch.2 猫之列车 + 调色板 2（~3 周）

| 周 | 任务 | 关键 commit |
|----|------|-------------|
| W1 | 调色板切换机制 + Ch.2 outline + 场景 1-2 | `feat: palette-runtime-switch` / `docs: ch2-outline` / `feat: ch2_scene_1-2` |
| W2 | Ch.2 场景 3-4 + 谜题 1（车票）+ 谜题 2（信号灯） | `feat: ch2_scene_3-4` / `feat: ch2_p1_ticket` / `feat: ch2_p2_signal` |
| W3 | Ch.2 列车 BGM + 音效 + 联调 + 视觉回归 | `assets: ch2_audio` / `test: ch2_walkthrough` / `release: v0.2.0` |

### Phase 3 — Ch.3 妖怪映画 + 调色板 3（~3 周）

| 周 | 任务 | 关键 commit |
|----|------|-------------|
| W1 | Ch.3 outline + 场景 1-2 | `docs: ch3-outline` / `feat: ch3_scene_1-2` |
| W2 | Ch.3 场景 3-4 + 谜题 L3（胶片序列） | `feat: ch3_scene_3-4` / `feat: ch3_p1_film_order` |
| W3 | 剧院 BGM + 音效 + 联调 + 真结局前置 | `assets: ch3_audio` / `test: ch3_walkthrough` / `feat: true-ending-trigger` |

### Phase 4 — 尾声 + 完整联调（~2 周）

| 周 | 任务 |
|----|------|
| W1 | 尾声剧本 + 场景 + 制作名单 + 真结局分支 |
| W2 | 全章节 walkthrough + Playwright 完整 E2E + 视觉回归全量 + 性能优化 |

### Phase 5 — 正式发布（~1 周）

| 任务 |
|------|
| 打包 + 签名 |
| Steam 商店页（可选）/ itch.io 主页 / GitHub Release |
| 截图集 + 预告片（可选） |
| README + 制作名单 + Credits |
| 终版 v1.0.0 |

**总工期估算**：
- Phase 0：已完成
- Phase 1：1 周（~52h）
- Phase 2-3：6 周（~180h）
- Phase 4-5：3 周（~90h）
- **合计：约 10 周 / 320 工时**（独立开发者节奏）

---

## 7. 协作模式（orchestrator + 5 tab）

继承用户的 5 tab 模式，不议：

| Tab | 角色 | 任务类型 |
|-----|------|---------|
| **Tab 1（主用）** | 写代码 | 主功能开发、bug 修复 |
| **Tab 2** | Debug | 报错排查 / Playwright 截图分析 / 状态机调试 |
| **Tab 3** | Refactor | 重构 / 类型优化 / 性能调优 |
| **Tab 4** | 探索 | 调研 / 试验 / 备选方案对比 |
| **Tab 5** | 文档 | 写 outline / walkthrough / world-bible |

**orchestrator（主 session，本会话）**：
- 汇报 / 协调 / 写文档 / 跨 tab 行动
- 写代码不直接动（"汇报不要动"）
- 授权后可帮 Tab 1 跑 commit / push / PR

**CI 不变量**：
- main 分支只接受 PR
- squash merge
- 每个 PR 必须有对应的测试文件
- 每个 PR 走完 `pnpm typecheck && pnpm test && pnpm build` 三关

---

## 8. 质量保证

| 关卡 | 工具 | 触发时机 | 通过标准 |
|------|------|---------|---------|
| 单元测试 | Vitest | 每次 commit | 全过 |
| Lint + Format | Biome | 每次 commit | 0 错 |
| Type check | tsc | 每次 commit | 0 错 |
| Build | electron-builder | 每次 PR | dist 可启动 |
| Walkthrough | 手动 + Markdown checklist | 每章 merge 前 | 步骤全过 |
| 视觉回归 | Playwright + screenshot diff | Phase 1 D6 起 | 0 diff |
| 端到端 | Playwright | Phase 4 | 完整 4h walkthrough 跑通 |
| 依赖审计 | `pnpm audit` | 自动每 5h | 0 high |
| 性能 | DevTools FPS | 手动 | 480×270 60 FPS |

---

## 9. 发布策略

### 9.1 渠道

| 渠道 | 范围 | 时间 |
|------|------|------|
| **GitHub Release** | 全版本 + 源码 | Phase 1 末（v0.1.0 起每 Phase 一发） |
| **itch.io** | 主分发，免费 / 付费可选 | Phase 5 |
| **Steam** | 商业发行（可选，¥36 定价参考黑森町） | Phase 5 后视情况 |
| **个人站** | 介绍 + 截图 + 试玩版 | Phase 5 |

### 9.2 版本号

- `v0.1.0` — Phase 1 末（序 + Ch.1）
- `v0.2.0` — Phase 2 末（+ Ch.2）
- `v0.3.0` — Phase 3 末（+ Ch.3）
- `v0.4.0` — Phase 4 末（+ 尾声 + 真结局）
- `v1.0.0` — Phase 5 末（正式发布）

### 9.3 推广资产

- 截图集（每个章节 4-6 张关键场景，4K 上采样）
- GIF 演示（谜题 1 个 + 高潮追逐 1 个）
- 中文 / 英文双语 README

---

## 10. 风险与回退

| 风险 | 概率 | 影响 | 回退 |
|------|------|------|------|
| ~~找不到合适 CC0 BGM~~ | ~~中~~ | ~~中~~ | ~~已 pivot：Suno AI 优先 + freesound 兜底（详见 ai-audio-prompts.md）~~ |
| ~~Zpix 字体集成麻烦~~ | ~~中~~ | ~~低~~ | ~~已修：改 fusion-pixel-font（OFL-1.1 + MIT），无版权风险~~ |
| Playwright 视觉回归集成慢 | 低 | 中 | 跳过 D6，先手动截图；Phase 2 再加 |
| 一周做不完序 + Ch.1 | **高** | 高 | 砍目标 = **序章完整 + Ch.1 场景 1-3 框架**（30min） |
| Ch.2/Ch.3 节奏失控 | 中 | 高 | 砍高潮事件复杂度，保留骨架 |
| 主角/引导者角色塑造弱 | 中 | 中 | 加大纲评审轮次；多 NPC 替代 |
| ~~中文像素字体版权~~ | ~~低~~ | ~~中~~ | ~~已修：Zpix 专有（$1000/产品）改 fusion-pixel-font（OFL-1.1 + MIT），无版权风险~~ |
| 单人开发 burnout | **高** | 高 | Phase 切小（1 周 1 Phase），每 Phase 末停 1-2 天 |
| 视觉回归误报 | 中 | 低 | 阈值调宽 + 手动审批 |
| 5 tab 上下文限制 | 中 | 中 | 切任务粒度小（每 tab 1 commit 完成就切） |

---

## 11. 待用户拍板的决策点

> 继承一周冲刺草稿中已锁定的 7 项；本节只列**未决**。

| # | 决策点 | 默认值 | 备选 | 备注 |
|---|--------|--------|------|------|
| D1 | 主角姓名 / 性别 | `nori` / 中性（可代入） | 固定性别（更易写对话） | 主角戏份 1/3，对话量不大 |
| D2 | 引导者姓名 / 真实身份 | `rin` / "被遗留的平成记忆" | 黑森町式"复数灵魂" | 涉及 Ch.3 真相揭示 |
| D3 | 是否做"二周目真结局" | 是 | 否（仅普通结局） | 草稿默认是 |
| D4 | 调色板切换是否给玩家 | 是（高级选项） | 否（固定） | 便于录屏 / 二创 |
| D5 | 主角是否死亡 / 受伤 | 不（全程无伤） | 是（Ch.3 假死一段） | 草稿默认不 |
| D6 | 是否加 Steam 创意工坊 | 否（Phase 5 后再议） | 是（早期规划） | 复杂度高 |
| D7 | 团队是否扩张 | 否（1 人） | 找 1 个美术 / 1 个作曲 | 单人节奏可控 |
| D8 | 是否做英文版 | Phase 5 后再说 | 是（同步做） | 翻译成本 |
| D9 | 真结局解锁条件 | 通关普通结局 + Ch.3 高潮选隐藏项 | 通关后回 Ch.1 找到 5 个隐藏物 | 黑森町是前者 |
| D10 | D1 是否开干 | **等你确认本方案** | 改方案 | 现在的决策点 |

---

## 12. 接下来动作（你拍板 D10 之后）

**D1 必须做**（继承一周冲刺草稿 + 本方案新增）：
1. ☐ 写 `docs/story/world-bible.md`（世界观 / 主角 / 引导者 / 全章节大纲）
2. ☐ CLAUDE.md 加 4 条主题约束（一周冲刺草稿第 4 节内容）
3. ☐ `assets/palette-tokyo-heisei.json` 新建 + `palette.json` 加 `chapter` 字段
4. ☐ 字体换 **fusion-pixel-font**（`src/renderer/index.html` + `assets/font/fusion-pixel-font.woff2`）—— 替代 Zpix（Zpix 商用 $1000/产品，许可证不合规）
5. ☐ 合并 PR #2（晚间复盘）
6. ☐ 修标题屏 flex 居中 + electron-builder 降级到 24
7. ☐ 注册 Windows Task Scheduler 跑 auto-verify
8. ☐ **新增**（本方案要求）：把本文件落地到 `docs/dev-plan-full.md`（追溯用）✅ **本步已完成**

**之后**：D2-D7 按一周冲刺草稿第 1 节执行，每个 commit 收尾即汇报。

---

## 附录 A：与一周冲刺草稿的差异

| 维度 | 草稿 | 本方案 |
|------|------|--------|
| 范围 | 1 周 / Phase 1 | 10 周 / Phase 0-5 |
| 调色板 | D1 切到 tokyo_heisei | 3 套按章节切（Phase 2-3 落实） |
| 谜题系统 | L1+L2 占 80% | 完整 3 级 + 通用 solver |
| 存档 | 10 槽 | 10 槽 + autosave 轮转 + 截图缩略图 |
| 角色设计 | 无 | 主角 + 引导者 + 5 配角草设 |
| 资产清单 | 草稿未列 | 33-50 音频 + 12-15 场景 + 24 立绘 + 9 物品 |
| 决策点 | 7 项已锁 | 10 项新增待你拍板 |
| 协作模式 | 5 tab 隐含 | 明示 + 任务类型分配 |
| 发布策略 | GitHub Release 一次 | 5 个版本号 + itch.io + Steam 备选 |

## 附录 B：未直接复用的现有信息

- **黑森町对标报告**（已读第 0-2 节）：第一章 30-75 min 时长分配可继续参考
- **`scripts/start-claude-tabs.ps1`**（已存在）—— 5 tab 启动脚本，可直接复用
- **PR #1 的 47 个文件结构** —— 是后续 Phase 的基线，不要破坏

---

**📌 等你确认：**
1. 上面 10 个决策点（D1-D10）的拍板
2. 是否要把本文件落地到 `docs/dev-plan-full.md`（✅ 已完成）
3. 是否要再调整本方案的内容

确认 D10 后我开干 D1 第一项（写 `docs/story/world-bible.md`）。
