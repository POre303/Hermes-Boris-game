import defaultPaletteJson from '../../../../assets/palette.json';
import tokyoHeiseiJson from '../../../../assets/palette-tokyo-heisei.json';

/**
 * Per-chapter palette switching.
 *
 * `assets/palette.json` carries a 16-color NES-style `default` plus a
 * `by_chapter` map; each chapter entry is either an array of colors (the
 * chapter's palette) or `null` (not yet implemented → fall back to default).
 *
 * `assets/palette-tokyo-heisei.json` is the canonical standalone file for
 * the tokyo_heisei palette (序章 + Ch.1 鹿骨怪谈). The same 6 hex values are
 * mirrored into `palette.json#by_chapter.tokyo_heisei` for runtime lookup.
 *
 * Path: src/renderer/src/core/palette.ts → assets/ is 4 levels up.
 */

export type ColorEntry = { name: string; hex: string };

/** Keys must match `palette.json#by_chapter`. Keep in sync with the file. */
export type ChapterPaletteKey = 'tokyo_heisei' | 'train_night' | 'theatre_warm';

interface PaletteIndex {
  default: ColorEntry[];
  by_chapter: Partial<Record<ChapterPaletteKey, ColorEntry[] | null>>;
}

const paletteIndex = defaultPaletteJson as PaletteIndex;
const tokyoHeisei = tokyoHeiseiJson as { colors: ColorEntry[] };

/** Frozen 16-color default palette. Index 0 is background black, index 1 text white. */
export const DEFAULT_PALETTE: readonly string[] = Object.freeze(
  paletteIndex.default.map((c) => c.hex),
);

export const DEFAULT_PALETTE_NAMES: readonly string[] = Object.freeze(
  paletteIndex.default.map((c) => c.name),
);

/**
 * Frozen 6-color tokyo_heisei palette. Exposed for callers that want the
 * canonical chapter file (Aseprite import, settings UI preview, etc.) without
 * going through the by_chapter map.
 */
export const TOKYO_HEISEI_PALETTE: readonly string[] = Object.freeze(
  tokyoHeisei.colors.map((c) => c.hex),
);

export const TOKYO_HEISEI_PALETTE_NAMES: readonly string[] = Object.freeze(
  tokyoHeisei.colors.map((c) => c.name),
);

/**
 * Backward-compat aliases. The original `PALETTE` / `PALETTE_NAMES` exports
 * pointed at the 16-color default; keep that surface working so existing
 * StateContext consumers (and tests) don't need to change.
 */
export const PALETTE: readonly string[] = DEFAULT_PALETTE;
export const PALETTE_NAMES: readonly string[] = DEFAULT_PALETTE_NAMES;

/** Frozen `by_chapter` map as read from `palette.json`. */
export const CHAPTER_PALETTES: Readonly<Partial<Record<ChapterPaletteKey, readonly string[]>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(paletteIndex.by_chapter).map(([key, colors]) => [
        key,
        colors ? Object.freeze(colors.map((c) => c.hex)) : null,
      ]),
    ) as Partial<Record<ChapterPaletteKey, readonly string[]>>,
  );

/**
 * Return the hex array for a chapter palette. Falls back to DEFAULT_PALETTE
 * when the key is unknown, null/undefined, or the chapter has no entry yet
 * (e.g. `train_night` / `theatre_warm` until Phase 2-3).
 */
export function getChapterPaletteHex(key: ChapterPaletteKey | string | null | undefined): readonly string[] {
  if (key != null && typeof key === 'string') {
    const colors = CHAPTER_PALETTES[key as ChapterPaletteKey];
    if (colors) return colors;
  }
  return DEFAULT_PALETTE;
}

/** Chapter keys that currently have a non-null palette in `palette.json`. */
export function getAvailableChapterPalettes(): readonly ChapterPaletteKey[] {
  return (Object.keys(CHAPTER_PALETTES) as ChapterPaletteKey[]).filter(
    (k) => CHAPTER_PALETTES[k] != null,
  );
}
