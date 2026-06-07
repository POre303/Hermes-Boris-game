/**
 * Main-process file IO for the save system.
 *
 * Layout under `<userData>/`:
 *   saves/
 *     slot-0.json .. slot-9.json     // user-visible (slot-0 is hidden autosave)
 *     autosave-1.json .. -3.json     // rotating scene autosaves
 *     autosave-counter.json          // { counter: 1|2|3 } — survives crashes
 *   screenshots/
 *     slot-N-{ts}.png                // 240x135 PNG, separate from slot.json
 *     autosave-N-{ts}.png
 *
 * Atomic write: data is written to `<path>.tmp` first, then renamed onto
 * `<path>`. rename is atomic on the same volume, so a crash mid-write can
 * never leave a half-written slot.json. The temp file is on the same volume
 * as the destination (Electron userData is on the system drive on Windows;
 * we put the tmp alongside the target for the same-volume guarantee).
 *
 * The base directory is swappable via `setBaseDirGetter` so tests can run
 * against an isolated temp dir.
 */

import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  SaveError,
  type AutosaveRotationId,
  type SaveDataInput,
  type SaveSlot,
  type SaveSlotId,
  type SaveSlotSummary,
} from './types';
import { migrate } from './migrate';

/** Subdirectory for slot JSON files (relative to baseDir). */
export const SAVES_SUBDIR = 'saves';
/** Subdirectory for screenshot PNG files (relative to baseDir). */
export const SCREENSHOTS_SUBDIR = 'screenshots';

let _baseDirGetter: () => string = () => '';
/** Inject the userData path. Called once at main-process startup. */
export const setBaseDirGetter = (fn: () => string): void => {
  _baseDirGetter = fn;
};
/** Current base directory. Empty string means storage isn't initialized. */
const getBaseDir = (): string => _baseDirGetter();

/** All valid slot ids (0..9) for manual saves. */
const ALL_SLOT_IDS: readonly SaveSlotId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Autosave rotating slot ids. */
export const AUTOSAVE_ROTATION_IDS: readonly AutosaveRotationId[] = [1, 2, 3] as const;

/** Path to a manual save's JSON file. */
export const slotFilePath = (slot: SaveSlotId, base = getBaseDir()): string =>
  join(base, SAVES_SUBDIR, `slot-${slot}.json`);

/** Path to a rotating autosave's JSON file. */
export const autosaveFilePath = (slot: AutosaveRotationId, base = getBaseDir()): string =>
  join(base, SAVES_SUBDIR, `autosave-${slot}.json`);

/** Path to the autosave counter file. */
export const autosaveCounterPath = (base = getBaseDir()): string =>
  join(base, SAVES_SUBDIR, 'autosave-counter.json');

/** Path to a screenshot PNG (returns absolute). `rel` is the value stored in slot.json. */
export const screenshotAbsPath = (rel: string, base = getBaseDir()): string => join(base, rel);

/** Make a new screenshot path. Returns { rel, abs }. */
export const makeScreenshotPath = (
  slotLabel: string,
  ts: number,
  base = getBaseDir(),
): { rel: string; abs: string } => {
  const rel = `${SCREENSHOTS_SUBDIR}/${slotLabel}-${ts}.png`;
  return { rel, abs: join(base, rel) };
};

/** Ensure the parent directory of `filePath` exists. */
export const ensureDir = async (filePath: string): Promise<void> => {
  await fs.mkdir(dirname(filePath), { recursive: true });
};

/**
 * Low-level atomic write. Writes `json` to `<filePath>.tmp`, then renames
 * onto `filePath`. Cleans up the tmp on failure. Throws SaveError on failure.
 */
export const atomicWriteJson = async (filePath: string, json: string): Promise<void> => {
  await ensureDir(filePath);
  const tmp = `${filePath}.tmp`;
  try {
    await fs.writeFile(tmp, json, 'utf8');
    await fs.rename(tmp, filePath);
  } catch (e) {
    try {
      await fs.unlink(tmp);
    } catch {
      // ignore
    }
    throw new SaveError('write-failed', `Failed to write ${filePath}: ${(e as Error).message}`);
  }
};

/** Write a base64 PNG to disk; return the relative path (under baseDir). */
export const writeThumbnailFile = async (
  slotLabel: string,
  ts: number,
  base64: string,
  base = getBaseDir(),
): Promise<string> => {
  const { rel, abs } = makeScreenshotPath(slotLabel, ts, base);
  await ensureDir(abs);
  const buf = Buffer.from(base64, 'base64');
  if (buf.length === 0) {
    throw new SaveError('thumbnail-failed', 'Empty thumbnail base64 payload');
  }
  try {
    await fs.writeFile(abs, buf);
  } catch (e) {
    throw new SaveError('thumbnail-failed', `Failed to write thumbnail: ${(e as Error).message}`);
  }
  return rel;
};

/**
 * Build a SaveSlot record from input data + an optional pre-computed thumbnail path.
 * Used by both `writeSlot` and the autosave path writer.
 */
export const buildSaveRecord = (
  slot: SaveSlotId,
  data: SaveDataInput,
  savedAt: number,
  thumbnail: string,
): SaveSlot => ({
  id: slot,
  chapter: data.chapter,
  scene: data.scene,
  palette: data.palette,
  inventory: [...data.inventory],
  flags: { ...data.flags },
  solvedPuzzles: [...data.solvedPuzzles],
  savedAt,
  thumbnail,
  schemaVersion: 1,
});

/**
 * Write `data` to `slot` atomically.
 * 1. Ensure the saves dir exists.
 * 2. If a thumbnail is provided, write it to a separate PNG file and
 *    record the relative path in the slot record.
 * 3. Write JSON to `<file>.tmp` (fsync for durability) then rename onto target.
 */
export const writeSlot = async (slot: SaveSlotId, data: SaveDataInput): Promise<SaveSlot> => {
  if (!ALL_SLOT_IDS.includes(slot)) {
    throw new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`);
  }
  const base = getBaseDir();
  if (!base) {
    throw new SaveError('write-failed', 'Storage not initialized: setBaseDirGetter not called');
  }
  const target = slotFilePath(slot, base);
  await ensureDir(target);

  const savedAt = Date.now();
  const thumbnail = data.thumbnailBase64
    ? await writeThumbnailFile(`slot-${slot}`, savedAt, data.thumbnailBase64, base)
    : '';

  const record = buildSaveRecord(slot, data, savedAt, thumbnail);
  await atomicWriteJson(target, JSON.stringify(record, null, 2));
  return record;
};

/** Read a single slot. Returns null if the file is missing (not an error). */
export const readSlot = async (slot: SaveSlotId): Promise<SaveSlot | null> => {
  if (!ALL_SLOT_IDS.includes(slot)) {
    throw new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`);
  }
  const base = getBaseDir();
  if (!base) {
    throw new SaveError('read-failed', 'Storage not initialized: setBaseDirGetter not called');
  }
  const target = slotFilePath(slot, base);
  return readJsonFile<SaveSlot>(target, `slot-${slot}`);
};

/** Read a rotating autosave slot. Returns null if missing. */
export const readAutosaveSlot = async (id: AutosaveRotationId): Promise<SaveSlot | null> => {
  const base = getBaseDir();
  if (!base) {
    throw new SaveError('read-failed', 'Storage not initialized: setBaseDirGetter not called');
  }
  const target = autosaveFilePath(id, base);
  return readJsonFile<SaveSlot>(target, `autosave-${id}`);
};

/** Read a slot-0 (chapter autosave). Returns null if missing. */
export const readChapterAutosave = async (): Promise<SaveSlot | null> => {
  const base = getBaseDir();
  if (!base) return null;
  const target = slotFilePath(0, base);
  return readJsonFile<SaveSlot>(target, 'slot-0');
};

/** Read+parse+migrate a JSON file. Returns null on ENOENT. Throws on parse-failure. */
const readJsonFile = async <T>(target: string, label: string): Promise<T | null> => {
  let raw: string;
  try {
    raw = await fs.readFile(target, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new SaveError('read-failed', `Failed to read ${label}: ${(e as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new SaveError('parse-failed', `${label} is not valid JSON: ${(e as Error).message}`);
  }
  return migrate(parsed) as T;
};

/**
 * List all manual save slots (1..9). Slot 0 is hidden; call listAutosaves() for it.
 * Corrupt or unreadable slots are skipped (not surfaced as errors) so one
 * bad save can't blank the entire save list.
 */
export const listManualSlots = async (): Promise<SaveSlotSummary[]> => {
  const base = getBaseDir();
  if (!base) return [];
  const out: SaveSlotSummary[] = [];
  for (const id of ALL_SLOT_IDS) {
    if (id === 0) continue; // hidden
    const target = slotFilePath(id, base);
    const slot = await safeRead(target);
    if (slot) {
      out.push(toSummary(id, slot.chapter, slot.scene, slot.savedAt, !!slot.thumbnail, false));
    }
  }
  return out;
};

/** List all autosave slots: hidden slot-0 + rotating autosave-1..3. */
export const listAutosaves = async (): Promise<SaveSlotSummary[]> => {
  const base = getBaseDir();
  if (!base) return [];
  const out: SaveSlotSummary[] = [];
  // slot-0 (chapter autosave, hidden)
  const slot0 = await safeRead(slotFilePath(0, base));
  if (slot0) {
    out.push(toSummary(0, slot0.chapter, slot0.scene, slot0.savedAt, !!slot0.thumbnail, true));
  }
  // rotating autosaves
  for (const id of AUTOSAVE_ROTATION_IDS) {
    const slot = await safeRead(autosaveFilePath(id, base));
    if (slot) {
      out.push(
        toSummary(
          `autosave-${id}` as SaveSlotSummary['id'],
          slot.chapter,
          slot.scene,
          slot.savedAt,
          !!slot.thumbnail,
          true,
        ),
      );
    }
  }
  return out;
};

/** Read+parse a file; swallow all errors (missing, parse, IO) and return null. */
const safeRead = async (target: string): Promise<SaveSlot | null> => {
  try {
    const raw = await fs.readFile(target, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return migrate(parsed) as SaveSlot;
  } catch {
    return null;
  }
};

const toSummary = (
  id: SaveSlotSummary['id'],
  chapter: SaveSlot['chapter'],
  scene: string,
  savedAt: number,
  hasThumbnail: boolean,
  isAutosave: boolean,
): SaveSlotSummary => ({ id, chapter, scene, savedAt, hasThumbnail, isAutosave });

/** Delete a manual slot. Idempotent — missing file is not an error. */
export const deleteSlot = async (slot: SaveSlotId): Promise<void> => {
  if (!ALL_SLOT_IDS.includes(slot)) {
    throw new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`);
  }
  const base = getBaseDir();
  if (!base) return;
  try {
    await fs.unlink(slotFilePath(slot, base));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw new SaveError('write-failed', `Failed to delete slot-${slot}: ${(e as Error).message}`);
  }
};
