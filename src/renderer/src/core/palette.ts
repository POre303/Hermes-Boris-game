import paletteJson from '../../../../assets/palette.json';

/**
 * Flat, frozen array of hex colors from assets/palette.json.
 * Index 0 is always background black, index 1 always text white (per palette.json).
 */
type PaletteJson = { colors: { name: string; hex: string }[] };

export const PALETTE: readonly string[] = Object.freeze(
  (paletteJson as PaletteJson).colors.map((c) => c.hex),
);

export const PALETTE_NAMES: readonly string[] = Object.freeze(
  (paletteJson as PaletteJson).colors.map((c) => c.name),
);
