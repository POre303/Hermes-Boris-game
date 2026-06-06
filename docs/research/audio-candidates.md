# CC0 音频候选清单 (D1-4)

> 用途：sprint-week1 序章 + Ch.1 鹿骨怪谈 的 BGM/SFX 候选池
> 找站：OpenGameArt / FreeMusicArchive / freesound / incompetech / soundimage / itch.io
> 许可证：CC0 / CC-BY 4.0（**绝不**接受 GPL / 商业版权 / 来源不明）
> 关联：`docs/dev-plan-full.md` §5.1 BGM 清单 / §5.2 SFX 清单 / §2.6 音频设计
> 作者：Tab 4（D1-4 调研）
> 日期：2026-06-06

---

## ⚠️ 沙箱工具说明（Tab 1 必读）

D1-4 调研时本 tab 的 `WebSearch` 全部 `400 invalid params`、`WebFetch` 被 stage-2 classifier 拦截
（`opengameart.org` / `incompetech.com` / `soundimage.org` / `example.com` 全部 "Unable to verify"）。
**这意味着本文档里所有 URL 没有在线"点过"，仅来自 Tab 4 预训练知识中的稳定站点结构 + 知名 CC0 艺术家页面**。

Tab 1 在 D2-D5 下载前 **必须** 对每个 URL 做一次 `curl -I` 或浏览器打开校验：

1. URL 200 OK（不是 404 / 301-to-homepage）
2. 落地页明确写 `CC0` / `Public Domain` / `CC-BY 4.0`（不接受 "Free for non-commercial"）
3. 落地页有可下载的 `.mp3` / `.ogg` / `.wav` 链接

为降低 404 风险，本表里 BGM 候选优先列 **艺术家/合集落地页** 而非单曲页（艺术家页几乎不会改）；
SFX 候选优先列 **freesound 标签搜索 URL**（query string 永远活，只要站还在）。

---

## BGM 候选

> 目标：序章 2 首 + Ch.1 2 首（共 4 首），每槽位至少 2 个候选让 Tab 1 选。
> 风格基线：90s 复古合成器 + 钢琴 + 日本民谣采样（dev-plan §2.6）。

| # | 标题 / 合集 | 来源站 | 作者 | 许可证 | URL | 时长 | 情绪 | 适用槽位 | 备注 |
|---|------------|--------|------|--------|-----|------|------|---------|------|
| B1 | "Floating Cities" | incompetech | Kevin MacLeod | CC-BY 4.0 | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3 | ~3:00 | 漂浮 / 异世界 / 合成器垫 | **prologue_anomaly** | Kevin 的氛围合成器代表作之一，符合"异世界入口"调子；署名一行写在 README 即可 |
| B2 | "Long Note Four" | incompetech | Kevin MacLeod | CC-BY 4.0 | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Four.mp3 | ~2:30 | 缓慢 / 不安 / 单音重复 | **prologue_anomaly** 备选 | 极简单音合成器，紧张感铺底；可循环 |
| B3 | "Wonders of an Unknown Sea" | incompetech | Kevin MacLeod | CC-BY 4.0 | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wonders%20of%20an%20Unknown%20Sea.mp3 | ~3:30 | 神秘 / 静谧 / 大空间 | **prologue_anomaly** 备选 | 比 Floating Cities 更暗，钟铃元素较少 |
| B4 | "Brittle Rille" | incompetech | Kevin MacLeod | CC-BY 4.0 | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Brittle%20Rille.mp3 | ~2:30 | 钢琴 / 童谣式 / 安静 | **prologue_rin_theme** | 钢琴主旋律 + 简单伴奏，引导者出场可用；偏轻快，要配合对话静音 |
| B5 | "Constance" | incompetech | Kevin MacLeod | CC-BY 4.0 | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Constance.mp3 | ~2:00 | 钢琴 / 忧郁 / 沉思 | **prologue_rin_theme** 备选 | 比 Brittle Rille 暗，更接近"少女谜语" |
| B6 | OpenGameArt - "Calm Forest" (search) | OpenGameArt | 多作者 | CC0 / CC-BY | https://opengameart.org/art-search-advanced?keys=calm+forest&field_art_type_tid%5B%5D=12 | 多种 | 民谣 / 森林 / 蝉 | **village_dusk** | 标签搜索页，Tab 1 在结果里挑 OGG 长度 2:30-3:30 的 CC0 优先 |
| B7 | OpenGameArt - "Japanese" 标签搜索 | OpenGameArt | 多作者 | CC0 / CC-BY | https://opengameart.org/art-search-advanced?keys=japanese&field_art_type_tid%5B%5D=12&sort_by=count&sort_order=DESC | 多种 | 日本风 / 民谣 / 三味线 / 尺八 | **village_dusk** | OGA 常年有 yd / Brandon Morris / HorrorPen 几位贡献者放日式氛围曲 |
| B8 | "Mountain Shrine" 风格搜索 | FreeMusicArchive | 多作者 | CC-BY 优先 | https://freemusicarchive.org/search?adv=1&quicksearch=shrine+japanese | 多种 | 神社 / 钟 / 民俗 | **village_dusk** 备选 | FMA 的 Asian Folk 分类常有 2-4 分钟的环境性民谣 |
| B9 | OpenGameArt - "Chase" 标签 | OpenGameArt | 多作者 | CC0 / CC-BY | https://opengameart.org/art-search-advanced?keys=chase&field_art_type_tid%5B%5D=12 | 多种 | 追逐 / 鼓 / 弦 | **village_chase** | OGA "chase / pursuit / battle" 标签有几十首；Tab 1 挑 1:30-2:30 的 |
| B10 | "Tense" / "Suspense" 搜索 | OpenGameArt | 多作者 | CC0 / CC-BY | https://opengameart.org/art-search-advanced?keys=suspense&field_art_type_tid%5B%5D=12 | 多种 | 紧张 / 悬念 / 弦乐顿挫 | **village_chase** 备选 | 比 chase 更慢节奏，适合"被追但没看到敌人"的桥段 |
| B11 | Eric Matyas "Asian" 合集 | soundimage.org | Eric Matyas | CC-BY 4.0 | https://soundimage.org/world-music/ | 多种 | 亚洲风 / 日本 / 民谣 | **village_dusk / village_chase** 通用池 | Eric 站上 "World - Asian/Oriental" 分类有十几首明确日式曲；CC-BY 署名要求严格但宽松商用 |

### BGM 选用建议（给 Tab 1）

- **首选 incompetech (Kevin MacLeod)**：URL 模式稳定，已用了 15+ 年；署名一行写 README 就行
- **OpenGameArt 标签页**：搜索 URL 永久有效，结果列表按下载量排序，前 5 个基本都是常用 CC0 资源
- **避坑**：FreeMusicArchive 改版多次，老链接经常死，下载前先在搜索框重新搜
- **村庄黄昏 + 蝉** 这种"民谣 + 环境音"组合在纯音乐里少见，可以考虑：**纯民谣 BGM + 单独叠 cicada SFX 循环**（见 SFX 表 S3）

---

## SFX 候选

> 目标：序章 8 个 (5 环境 + 3 交互) + Ch.1 3 个主题音效 = 11 个
> 主站：freesound.org（CC0 比例最高）
> 命名规则：标题前缀对应 dev-plan §5.2 的资源 key

| # | 标题 / 关键词 | 来源站 | 作者类型 | 许可证 | URL（标签搜索为主） | 时长 | 类型 | 资源 key | 备注 |
|---|--------------|--------|---------|--------|-----|------|------|---------|------|
| S1 | wind outdoor loop | freesound | 多作者 | CC0 | https://freesound.org/search/?q=wind+ambient&f=license:%22Creative+Commons+0%22 | 8-30s | 环境 | `wind` | InspectorJ / Mafon2 常年贡献 CC0 风声；选 outdoor 不带"machine"的 |
| S2 | rain steady loop | freesound | 多作者 | CC0 | https://freesound.org/search/?q=rain+loop&f=license:%22Creative+Commons+0%22 | 10-60s | 环境 | `rain` | 序章雨天可选；Ch.1 暮色也能用 |
| S3 | cicada Japan summer | freesound | 多作者 | CC0 | https://freesound.org/search/?q=cicada&f=license:%22Creative+Commons+0%22 | 5-30s | 环境 | `cicada` | **核心音色**——日本夏日蝉鸣（特别是 higurashi 蜩）是平成怀旧关键；优先选录于日本的 |
| S4 | wind chime ceramic | freesound | 多作者 | CC0 | https://freesound.org/search/?q=wind+chime&f=license:%22Creative+Commons+0%22 | 2-8s | 环境 | `wind_chime` | rin_theme 的视觉锚点；陶/玻璃风铃单击 + 风吹两版都要 |
| S5 | clock tick wooden | freesound | 多作者 | CC0 | https://freesound.org/search/?q=clock+tick&f=license:%22Creative+Commons+0%22 | 1-5s | 环境 | `clock_tick` | 序章"末班车前"焦虑感；选 wooden / mechanical，不要 digital |
| S6 | door open wooden creak | freesound | 多作者 | CC0 | https://freesound.org/search/?q=door+wooden+open&f=license:%22Creative+Commons+0%22 | 1-3s | 交互 | `door_open` | 序章进入旧建筑；slow creak 比 fast slam 合适 |
| S7 | footstep wood / grass | freesound | 多作者 | CC0 | https://freesound.org/search/?q=footstep+wood&f=license:%22Creative+Commons+0%22 | 0.3-0.8s | 交互 | `footstep` | 至少 4 个变体随机播放避免机械感；木板 + 草地 + 石板各 1 套 |
| S8 | page turn paper | freesound | 多作者 | CC0 | https://freesound.org/search/?q=page+turn&f=license:%22Creative+Commons+0%22 | 0.5-1.5s | 交互 / UI | `page_turn` | 序章"旧报纸"道具 + 对话翻页通用；薄纸 vs 厚纸两版 |
| S9 | deer hoof step grass | freesound | 多作者 | CC0 | https://freesound.org/search/?q=hoof+step&f=license:%22Creative+Commons+0%22 | 0.5-1s | Ch.1 主题 | `deer_step` | 直接搜 "deer step" 命中率低；用 "hoof" 替代，再用 EQ 高切降低硬度 |
| S10 | match strike / lantern light | freesound | 多作者 | CC0 | https://freesound.org/search/?q=match+strike&f=license:%22Creative+Commons+0%22 | 0.8-2s | Ch.1 主题 | `lantern_light` | "灯笼点亮"= match 划燃 + 火苗 whoosh，2 层叠加 |
| S11 | bone wood pickup | freesound | 多作者 | CC0 | https://freesound.org/search/?q=bone&f=license:%22Creative+Commons+0%22 | 0.5-1.5s | Ch.1 主题 | `bone_collect` | "鹿骨收集"，CC0 bone 库存少；备选用 "wood clack" + 一点 "ceramic chip" 拼 |
| S12 | InspectorJ 主页 | freesound | Inspector J | CC-BY 4.0（少量 CC0） | https://freesound.org/people/InspectorJ/sounds/ | 多种 | 全类 | 通用池 | freesound 头部 CC-BY 贡献者，wind/rain/footstep/door 都有高质量录音 |

### SFX 选用建议（给 Tab 1）

- **freesound 过滤 CC0 的硬办法**：在搜索 URL 末尾加 `&f=license:%22Creative+Commons+0%22`（本表已加）
- **避坑**：freesound 的 "Creative Commons Sampling+" 不是 CC，**不要选**；只接受 `Creative Commons 0` 或 `Attribution 4.0`
- **下载格式**：游戏内统一用 `.ogg`（体积小，Electron 原生支持），freesound 提供 OGG 转换下载
- **音量归一化**：下载后用 `ffmpeg -af loudnorm=I=-23:LRA=7:TP=-2` 统一响度，避免 BGM 盖过对话

---

## [PLACEHOLDER] 项

> 找不到合适 CC0 源 / 风格非常独特 / 网络受限无法验证，sprint 时建议用 AI 生成占位，
> 在代码里标 `// AUDIO-PLACEHOLDER: <key> reason: <...>` 等替换。

- **[PLACEHOLDER-AUDIO] `prologue_anomaly` 精确版**：列出的 Kevin MacLeod 三首都是"通用神秘合成器"，**没有钟声元素**；
  钟声需要单独从 freesound 找 "temple bell" SFX 叠加，或者由 Tab 1 接受"无钟"妥协。
- **[PLACEHOLDER-AUDIO] `village_dusk` 精确版**：能找到日式民谣，但**带蝉的纯音乐**几乎不存在；
  建议方案 = 纯民谣 BGM（B7/B8）+ 单独 `cicada` SFX 长循环（S3）叠加，引擎里两通道独立播放。
- **[PLACEHOLDER-AUDIO] `village_chase`**：dev-plan 标"可选"，sprint-week1 可先 skip，
  没追逐音乐就用 SFX `chase_pulse`（心跳/呼吸/脚步加速）撑紧张感。
- **[PLACEHOLDER-AUDIO] `bone_collect`**：CC0 库里直接的"骨头碰撞"录音稀缺，
  最稳的合成 = "干燥木头 clack" + "陶瓷碎裂" + 一点 reverb，Tab 1 用 Audacity 叠 30 秒能搞定。
- **[PLACEHOLDER-AUDIO] `yokai_growl`**（dev-plan §5.2 高潮音）：本次 D1-4 没找；
  Ch.1 高潮事件需要时，建议用 AI 生成（Suno / Mubert）后裁切到 1-2 秒。

---

## 总结

- **找到 BGM 候选**：11 个条目，覆盖 4 个目标槽位
  - `prologue_anomaly`：B1 / B2 / B3 共 3 个候选
  - `prologue_rin_theme`：B4 / B5 共 2 个候选
  - `village_dusk`：B6 / B7 / B8 + B11 共 4 个候选池
  - `village_chase`：B9 / B10 + B11 共 3 个候选池
- **找到 SFX 候选**：12 个条目（11 个槽位 + InspectorJ 通用池），覆盖全部目标 SFX
- **标 PLACEHOLDER**：5 项（anomaly 钟声 / dusk 蝉叠加方案 / chase 可跳过 / bone_collect 合成方案 / yokai_growl 留 Ch.1 用）

### 关键发现（给 orchestrator）

1. **沙箱工具受限**：`WebSearch` 全部 `API Error 400`，`WebFetch` 被 stage-2 classifier 拦截
   （opengameart / incompetech / soundimage / example.com 全部 "Unable to verify"）。
   本报告 URL 来自 Tab 4 预训练 + 站点稳定的搜索 query string，**未在线验证**。
   建议给 Tab 4 加 `WebFetch(opengameart.org)` / `WebFetch(freesound.org)` 白名单后重跑一次，
   或 D2 由 Tab 1 用 `curl -I` 批量校验本表所有 URL。
2. **关键音色组合**：序章 `prologue_anomaly` 的"合成器+钟"组合在单曲里少见，
   建议接受 **纯合成器 BGM (Kevin MacLeod) + 独立 `temple_bell` SFX 间歇触发** 的方案，
   引擎层两通道独立——这也契合 CLAUDE.md "突发音效 > 循环 BGM" 原则。
3. **Ch.1 `village_dusk`** 同理：纯民谣 BGM + `cicada` SFX 长循环叠加，效果反而比一首带蝉的曲子更可控（蝉音量能单独调）。
4. **许可证混合**：incompetech 全部 CC-BY 4.0（要写 README 署名），OpenGameArt / freesound 标签搜索能筛 CC0，
   建议 sprint-week1 接受 **CC-BY + CC0 混合**，统一写一份 `assets/audio/CREDITS.md` 列所有署名。
5. **`village_chase` 可降级**：dev-plan 已标"可选"，若 Tab 1 时间紧张可跳过 BGM，纯用 SFX 撑紧张感。

### 建议（给 Tab 1，D2 下载前先做）

1. 拿本表所有 URL 跑 `pwsh: $urls | %{ try { iwr -Method Head $_ -TimeoutSec 10 | Out-Null; "OK $_" } catch { "FAIL $_" } }` 一遍
2. 死链的填回本表 PLACEHOLDER 列，或换站重搜
3. BGM 先下 Kevin MacLeod 4 首（CC-BY，URL 最稳）作底，再补 OpenGameArt 1-2 首日式作 Ch.1
4. SFX 先下环境 5 件（wind/rain/cicada/wind_chime/clock_tick），再补交互 3 件，Ch.1 主题 3 件最后
5. 全部转 OGG（`ffmpeg -i in.mp3 -c:a libvorbis -q:a 5 out.ogg`），统一 loudnorm 到 -23 LUFS
6. 写 `assets/audio/CREDITS.md`，每首一行：`<file> — <author> — <license> — <source URL>`

