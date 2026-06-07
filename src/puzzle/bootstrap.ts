import { registerPuzzle } from './registry';
import { l1Puzzle, l2Puzzle } from './types';

/**
 * Hydrate the puzzle registry with the four sprint-week1 puzzles.
 *
 * TODO (D3+): once the YAML loader lands, replace these literals with
 * `puzzles.forEach(registerPuzzle)` after parsing `scripts/yaml/chapter-*.yaml`.
 * The data shape stays the same; only the source moves from "hardcoded
 * constants" to "parsed YAML". See `docs/dev-plan-full.md` §3.3.
 *
 * All four puzzles are scoped to the tokyo_heisei palette (序章 + Ch.1).
 * Three are L1 (color sequence variants) and one is L2 (item collection).
 */
export const registerSprintPuzzles = (): void => {
  // ── L1: lantern color (序章灯笼) ────────────────────────────────
  // Hermes 站在林边小屋门前，灯笼依次是「红 → 白 → 红 → 蓝」。
  registerPuzzle(
    l1Puzzle({
      id: 'prologue_p1_lantern_color',
      chapter: 0,
      hint: '灯笼的颜色在告诉你顺序。从左到右依次点亮。',
      solution: {
        kind: 'color_sequence',
        sequence: ['red', 'white', 'red', 'blue'],
      },
    }),
  );

  // ── L1: postcard order (序章明信片) ──────────────────────────────
  // 桌上散落三张明信片，按日期顺序排好（按城市名的笔划）。
  registerPuzzle(
    l1Puzzle({
      id: 'prologue_p2_postcard_order',
      chapter: 0,
      hint: '三张明信片按邮戳日期排列。仔细看边角的数字。',
      solution: {
        kind: 'color_sequence',
        sequence: ['tokyo', 'nagoya', 'osaka'],
      },
    }),
  );

  // ── L1: signal wire (序章信号灯) ────────────────────────────────
  // 调车场的老信号灯：红 → 黄 → 绿 → 黄 是正确解锁序列。
  registerPuzzle(
    l1Puzzle({
      id: 'prologue_p3_signal_wire',
      chapter: 0,
      hint: '老信号灯的闪烁顺序。回想 Boris 提到的列车时刻。',
      solution: {
        kind: 'color_sequence',
        sequence: ['red', 'yellow', 'green', 'yellow'],
      },
    }),
  );

  // ── L2: antler collection (Ch.1 鹿骨收集) ──────────────────────
  // 村庄各处散落鹿骨碎块。必须集齐三块：antler_a / antler_b / antler_c。
  registerPuzzle(
    l2Puzzle({
      id: 'ch1_p1_antler_collect',
      chapter: 1,
      hint: '鹿雕的骨架散落各处。集齐三块才能复原。',
      solution: {
        kind: 'collect_items',
        required: ['antler_a', 'antler_b', 'antler_c'],
      },
    }),
  );
};
