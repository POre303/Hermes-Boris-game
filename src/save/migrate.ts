/**
 * Save-slot schema migration.
 *
 * Each on-disk save record carries a `schemaVersion` field. Newer code
 * reads older records and runs them through `migrate()` to produce the
 * current shape.
 *
 * Currently the schema is at version 1 — no migrations are needed. The
 * framework is here so that when v2 lands (e.g. adding a `playTime` field
 * to track total playtime), old saves get upgraded transparently on read.
 *
 * v0 → v1: introduce schemaVersion field (default 1 for v1 saves).
 * v1 → v2: TODO — when adding `playTime: number`, fill missing with 0.
 */

import { type ChapterKey, type PaletteKey, type SaveSlot, SaveError } from './types';

interface UnknownShape {
  schemaVersion?: unknown;
  chapter?: unknown;
  scene?: unknown;
  palette?: unknown;
  inventory?: unknown;
  flags?: unknown;
  solvedPuzzles?: unknown;
  savedAt?: unknown;
  thumbnail?: unknown;
  id?: unknown;
}

const VALID_CHAPTERS: readonly ChapterKey[] = ['prologue', 1, 2, 3, 'epilogue', 'ending'];
const VALID_PALETTES: readonly PaletteKey[] = ['tokyo_heisei', 'train_night', 'theatre_warm'];

const isChapter = (x: unknown): x is ChapterKey => {
  if (x === 'prologue' || x === 'epilogue' || x === 'ending') return true;
  return x === 1 || x === 2 || x === 3;
};

const isPalette = (x: unknown): x is PaletteKey =>
  typeof x === 'string' && (VALID_PALETTES as readonly string[]).includes(x);

/**
 * Migrate an arbitrary parsed JSON blob to the current SaveSlot shape.
 * Throws SaveError on bad input (so callers can decide: skip / surface / etc.).
 */
export const migrate = (raw: unknown): SaveSlot => {
  if (!raw || typeof raw !== 'object') {
    throw new SaveError('parse-failed', 'Save record is not an object');
  }
  const obj = raw as UnknownShape;
  // v0 → v1: any old record without schemaVersion is treated as v0 and gets
  // promoted to v1 (we just stamp the field; no shape changes).
  // v1 → v2: TODO when v2 lands.
  const v = obj.schemaVersion;
  if (v === undefined || v === null) {
    // v0 → v1 (no-op on the shape itself; we just accept it as v1)
  } else if (v === 1) {
    // current
  } else if (typeof v === 'number' && v > 1) {
    // Future version — refuse rather than silently mis-read.
    throw new SaveError(
      'parse-failed',
      `Save record is from a newer schema (v${v}); update the game`,
    );
  } else {
    throw new SaveError('parse-failed', `Save record has invalid schemaVersion: ${String(v)}`);
  }

  if (typeof obj.scene !== 'string') {
    throw new SaveError('parse-failed', 'Save record missing string scene');
  }
  if (!isChapter(obj.chapter)) {
    throw new SaveError('parse-failed', `Save record has invalid chapter: ${String(obj.chapter)}`);
  }
  if (!isPalette(obj.palette)) {
    throw new SaveError('parse-failed', `Save record has invalid palette: ${String(obj.palette)}`);
  }
  if (!Array.isArray(obj.inventory) || !obj.inventory.every((x) => typeof x === 'string')) {
    throw new SaveError('parse-failed', 'Save record has invalid inventory');
  }
  if (!obj.flags || typeof obj.flags !== 'object' || Array.isArray(obj.flags)) {
    throw new SaveError('parse-failed', 'Save record has invalid flags');
  }
  const flags: Record<string, boolean> = {};
  for (const [k, v2] of Object.entries(obj.flags as Record<string, unknown>)) {
    if (typeof v2 !== 'boolean') {
      throw new SaveError('parse-failed', `Save record flag ${k} is not boolean`);
    }
    flags[k] = v2;
  }
  if (!Array.isArray(obj.solvedPuzzles) || !obj.solvedPuzzles.every((x) => typeof x === 'string')) {
    throw new SaveError('parse-failed', 'Save record has invalid solvedPuzzles');
  }
  if (typeof obj.savedAt !== 'number' || !Number.isFinite(obj.savedAt)) {
    throw new SaveError('parse-failed', 'Save record has invalid savedAt');
  }
  if (typeof obj.thumbnail !== 'string') {
    throw new SaveError('parse-failed', 'Save record missing thumbnail path');
  }

  // id field — accept any 0..9 from the record, but default to 0 if missing.
  let id: SaveSlot['id'] = 0;
  if (typeof obj.id === 'number' && obj.id >= 0 && obj.id <= 9) {
    id = obj.id as SaveSlot['id'];
  }

  return {
    id,
    chapter: obj.chapter,
    scene: obj.scene,
    palette: obj.palette,
    inventory: obj.inventory as string[],
    flags,
    solvedPuzzles: obj.solvedPuzzles as string[],
    savedAt: obj.savedAt,
    thumbnail: obj.thumbnail,
    schemaVersion: 1,
  };
};
