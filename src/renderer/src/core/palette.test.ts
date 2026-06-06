import { describe, it, expect } from 'vitest';
import {
  CHAPTER_PALETTES,
  DEFAULT_PALETTE,
  DEFAULT_PALETTE_NAMES,
  PALETTE,
  PALETTE_NAMES,
  TOKYO_HEISEI_PALETTE,
  TOKYO_HEISEI_PALETTE_NAMES,
  getAvailableChapterPalettes,
  getChapterPaletteHex,
} from './palette';

describe('palette (default)', () => {
  it('DEFAULT_PALETTE is a frozen 16-color array (NES-style fallback)', () => {
    expect(DEFAULT_PALETTE).toHaveLength(16);
    expect(Object.isFrozen(DEFAULT_PALETTE)).toBe(true);
  });

  it('index 0 is background black, index 1 is text white (per palette.json contract)', () => {
    expect(DEFAULT_PALETTE[0]).toBe('#000000');
    expect(DEFAULT_PALETTE[1]).toBe('#fcfcfc');
  });

  it('DEFAULT_PALETTE_NAMES aligns 1:1 with DEFAULT_PALETTE', () => {
    expect(DEFAULT_PALETTE_NAMES).toHaveLength(DEFAULT_PALETTE.length);
  });

  it('PALETTE / PALETTE_NAMES are backward-compat aliases for DEFAULT_*', () => {
    expect(PALETTE).toBe(DEFAULT_PALETTE);
    expect(PALETTE_NAMES).toBe(DEFAULT_PALETTE_NAMES);
  });
});

describe('palette (tokyo_heisei)', () => {
  // Spec from docs/dev-plan-full.md section 2.5 + the task brief.
  const expectedTokyoHeiseiHexes = [
    '#2d1b3d', // deep-purple (暗紫)
    '#8b2942', // wine-red   (酒红)
    '#d4c5a0', // wafu-cream (和风米)
    '#4a5a7a', // dusk-blue  (暮蓝)
    '#d4a04a', // candle-yellow (烛黄)
    '#0a0a14', // ink-black  (黑)
  ];

  it('TOKYO_HEISEI_PALETTE is a frozen 6-color array', () => {
    expect(TOKYO_HEISEI_PALETTE).toHaveLength(6);
    expect(Object.isFrozen(TOKYO_HEISEI_PALETTE)).toBe(true);
  });

  it('TOKYO_HEISEI_PALETTE hexes match the 6-color spec exactly', () => {
    expect(TOKYO_HEISEI_PALETTE).toEqual(expectedTokyoHeiseiHexes);
  });

  it('TOKYO_HEISEI_PALETTE_NAMES has 6 entries aligned with the hexes', () => {
    expect(TOKYO_HEISEI_PALETTE_NAMES).toHaveLength(6);
  });

  it('CHAPTER_PALETTES is frozen and exposes tokyo_heisei + 2 nulls', () => {
    expect(Object.isFrozen(CHAPTER_PALETTES)).toBe(true);
    expect(CHAPTER_PALETTES.tokyo_heisei).toEqual(expectedTokyoHeiseiHexes);
    expect(CHAPTER_PALETTES.train_night).toBeNull();
    expect(CHAPTER_PALETTES.theatre_warm).toBeNull();
  });
});

describe('getChapterPaletteHex', () => {
  it('returns tokyo_heisei colors for "tokyo_heisei"', () => {
    expect(getChapterPaletteHex('tokyo_heisei')).toEqual([
      '#2d1b3d',
      '#8b2942',
      '#d4c5a0',
      '#4a5a7a',
      '#d4a04a',
      '#0a0a14',
    ]);
  });

  it('falls back to DEFAULT_PALETTE for "train_night" (Phase 2, currently null)', () => {
    expect(getChapterPaletteHex('train_night')).toBe(DEFAULT_PALETTE);
  });

  it('falls back to DEFAULT_PALETTE for "theatre_warm" (Phase 3, currently null)', () => {
    expect(getChapterPaletteHex('theatre_warm')).toBe(DEFAULT_PALETTE);
  });

  it('falls back to DEFAULT_PALETTE for an unknown key', () => {
    expect(getChapterPaletteHex('atlantis_2099')).toBe(DEFAULT_PALETTE);
  });

  it('falls back to DEFAULT_PALETTE for null', () => {
    expect(getChapterPaletteHex(null)).toBe(DEFAULT_PALETTE);
  });

  it('falls back to DEFAULT_PALETTE for undefined', () => {
    expect(getChapterPaletteHex(undefined)).toBe(DEFAULT_PALETTE);
  });

  it('returned chapter array is frozen so callers cannot mutate it', () => {
    const colors = getChapterPaletteHex('tokyo_heisei');
    expect(Object.isFrozen(colors)).toBe(true);
  });
});

describe('getAvailableChapterPalettes', () => {
  it('lists only chapters that have a non-null palette (currently tokyo_heisei only)', () => {
    expect(getAvailableChapterPalettes()).toEqual(['tokyo_heisei']);
  });
});
