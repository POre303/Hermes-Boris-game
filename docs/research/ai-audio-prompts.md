# Hermes-Boris-Game — AI 音频生成 prompt 集 (D1-4.5)

> **替代原 D1-4 CC0 调研**（已弃用，URL 未验证）。
> **生成原则**：需要多少就生成多少，本文件只列 sprint-week1 范围（序章 + Ch.1）。
> **作者**：orchestrator（Claude-M3 文本模型，不能直接生成音频）
> **生成器**：BGM → Suno v3.5+（suno.com）/ SFX → Stable Audio（stableaudio.com）

---

## 0. 工作流（手动，per-asset）

1. 打开对应生成器（suno.com 或 stableaudio.com）
2. 复制本文件对应章节的 prompt
3. 调整长度 / 风格细节
4. 生成（一般 3-5 个变体，挑最好的）
5. 下载 → 用 ffmpeg 转 OGG Vorbis q5：
   ```bash
   ffmpeg -i input.mp3 -c:a libvorbis -q:a 5 assets/audio/track.ogg
   ffmpeg -i input.wav -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a libvorbis -q:a 5 assets/audio/track.ogg
   ```
6. 放 `assets/audio/bgm/<name>.ogg` 或 `assets/audio/sfx/<name>.ogg`
7. 音量 normalize 到 **-16 LUFS**（CLAUDE.md 音频工作流要求）
8. 在 `assets/audio/CREDITS.md` 写一行 AI 生成 + 模型版本

---

## 1. BGM（3 首，sprint-week1 范围）

### 1.1 `prologue_anomaly` — 序章 / 不安 / 异世界入口

**Suno prompt**（instrumental，~2:30）：
```
Eerie Japanese synthwave with haunting tubular bells, mysterious and unsettling atmosphere, 70 BPM, deep analog synthesizer pad and ghostly bell chimes, inspired by 1980s YMO darker works and 1990s horror anime soundtracks, slow evolving texture with subtle tension building, instrumental only, 2 minutes 30 seconds
```

**风格关键词**（Suno style field 可填）：
```
synthwave, dark ambient, japanese retro, horror soundtrack, instrumental
```

**情绪锚点**：神秘 / 压抑 / 时间错位
**预期使用**：序章开头，主角进入"黑森町"

---

### 1.2 `prologue_rin_theme` — 序章 / 引导者登场

**Suno prompt**（instrumental，~1:30）：
```
Gentle and melancholic Japanese piano theme with delicate wind chimes, intimate and slightly mysterious, 60 BPM, solo piano melody with sparse wind chime accents and soft reverb, reminiscent of Joe Hisaishi and Ryuichi Sakamoto, a young girl's theme, hopeful but with underlying sadness, instrumental only, 1 minute 30 seconds
```

**风格关键词**：
```
piano, japanese, melancholic, wind chimes, instrumental, hisaishi-style
```

**情绪锚点**：陪伴 / 神秘 / 谜语
**预期使用**：rin 首次出现

---

### 1.3 `village_dusk` — Ch.1 / 神秘 / 暮色村庄

**Suno prompt**（instrumental，~3:00）：
```
Mysterious and sacred Japanese folk ambient, twilight village atmosphere, 50 BPM, plucked shamisen-like string sample with cicada background texture and slow evolving synth pad, evokes a forgotten mountain village at dusk, minimal and meditative with occasional ethereal flute, instrumental only, 3 minutes
```

**风格关键词**：
```
japanese folk, ambient, shamisen, twilight, mysterious, instrumental
```

**情绪锚点**：神秘 / 暮色 / 村庄集体记忆
**预期使用**：Ch.1 村庄场景循环 BGM

---

## 2. SFX（11 个，sprint-week1 范围）

> Stable Audio prompt 格式：`[描述]，[时长]`

### 2.1 序章环境（5 个）

| ID | 名称 | Stable Audio prompt | 时长 |
|----|------|---------------------|------|
| sfx_wind | 风 | `Soft wind blowing through autumn forest with occasional gusts, continuous gentle breeze, no music, 8 seconds` | 8s |
| sfx_rain | 雨 | `Light rain falling on traditional Japanese roof tiles, continuous steady rainfall, no thunder, 10 seconds` | 10s |
| sfx_cicada | 蝉 | `Summer evening cicada chorus in Japanese countryside, continuous ambient insect sounds, 6 seconds` | 6s |
| sfx_wind_chime | 风铃 | `Single delicate Japanese wind chime struck, glassy resonance fading slowly, no music, 3 seconds` | 3s |
| sfx_clock_tick | 时钟 | `Vintage mechanical clock ticking, wooden case, steady tick-tock rhythm, no music, 4 seconds` | 4s |

### 2.2 序章交互（3 个）

| ID | 名称 | Stable Audio prompt | 时长 |
|----|------|---------------------|------|
| sfx_door_open | 开门 | `Old wooden door slowly opening with creaking hinges, no music, 2 seconds` | 2s |
| sfx_footstep | 脚步 | `Single soft footstep on tatami mat, gentle, no music, 1 second` | 1s |
| sfx_page_turn | 翻页 | `Old book page turning with paper rustle, no music, 1 second` | 1s |

### 2.3 Ch.1 主题（3 个）

| ID | 名称 | Stable Audio prompt | 时长 |
|----|------|---------------------|------|
| sfx_deer_step | 鹿步 | `Deer hooves walking softly on forest floor, gentle thuds on leaves, no music, 2 seconds` | 2s |
| sfx_lantern_light | 点灯 | `Old paper lantern being lit, soft flame whoosh and gentle paper rustle, no music, 1 second` | 1s |
| sfx_bone_collect | 拾骨 | `Small bone or wooden object being picked up, light clinking sound, no music, 1 second` | 1s |

---

## 3. 后期处理脚本

`scripts/postprocess-audio.sh`（sprint D2 时由 Tab 1 实现）：

```bash
#!/bin/bash
# Post-process AI-generated audio to game-ready OGG
# Usage: ./scripts/postprocess-audio.sh <input> <output-name> <type:bgm|sfx>

INPUT="$1"
NAME="$2"
TYPE="$3"

# 1. Normalize to -16 LUFS
# 2. Convert to OGG Vorbis q5
# 3. Place in assets/audio/<type>/

case "$TYPE" in
  bgm) OUTDIR="assets/audio/bgm" ;;
  sfx) OUTDIR="assets/audio/sfx" ;;
  *) echo "Usage: $0 <input> <name> <bgm|sfx>"; exit 1 ;;
esac

mkdir -p "$OUTDIR"
ffmpeg -i "$INPUT" \
  -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:a libvorbis -q:a 5 \
  "$OUTDIR/$NAME.ogg"
```

---

## 4. 资产追踪

| 类型 | ID | 状态 | 文件 | 备注 |
|------|----|------|------|------|
| BGM | prologue_anomaly | ⏳ 待生成 | — | Suno 1.1 |
| BGM | prologue_rin_theme | ⏳ 待生成 | — | Suno 1.2 |
| BGM | village_dusk | ⏳ 待生成 | — | Suno 1.3 |
| SFX | sfx_wind | ⏳ 待生成 | — | Stable Audio 2.1 |
| SFX | sfx_rain | ⏳ 待生成 | — | Stable Audio 2.1 |
| SFX | sfx_cicada | ⏳ 待生成 | — | Stable Audio 2.1 |
| SFX | sfx_wind_chime | ⏳ 待生成 | — | Stable Audio 2.1 |
| SFX | sfx_clock_tick | ⏳ 待生成 | — | Stable Audio 2.1 |
| SFX | sfx_door_open | ⏳ 待生成 | — | Stable Audio 2.2 |
| SFX | sfx_footstep | ⏳ 待生成 | — | Stable Audio 2.2 |
| SFX | sfx_page_turn | ⏳ 待生成 | — | Stable Audio 2.2 |
| SFX | sfx_deer_step | ⏳ 待生成 | — | Stable Audio 2.3 |
| SFX | sfx_lantern_light | ⏳ 待生成 | — | Stable Audio 2.3 |
| SFX | sfx_bone_collect | ⏳ 待生成 | — | Stable Audio 2.3 |

**生成策略**：按需生成，D2 推进序章时先生成 1.1 + 1.2 + 2.1 的 5 个 SFX；D3-D4 做 Ch.1 时生成 1.3 + 2.3。

---

## 5. 风险与备选

| 风险 | 概率 | 备选 |
|------|------|------|
| Suno 风格不达预期 | 中 | 调 prompt 关键词（"more 1990s" / "less reverb"）；尝试 Udio / MusicGen |
| Stable Audio SFX 质量差 | 高 | 回退 freesound CC0 短搜索（不走 D1-4 那种全量调研，按 sfx 名字直接搜） |
| AI 生成的 BGM 风格撞车 | 低 | 加 negative prompt 关键词 |
| ffmpeg 转换失败 | 低 | 试 ffmpeg-static npm 包 |

---

**关联**：
- `docs/story/world-bible.md` §3 核心意象（鹿骨 / 猫铃 / 胶片 / 报纸 / 黄昏广播）
- `docs/dev-plan-full.md` §2.6 音频设计 / §4.3 音频工作流 / §5.1 BGM 清单 / §5.2 音效清单
- CLAUDE.md 主题约束："突发音效比循环 BGM 更重要"
