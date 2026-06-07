/**
 * Autosave rotation logic for the save system.
 *
 * Two kinds of autosave:
 *   - chapter: on chapter start, force-write to slot-0 (hidden). Single slot,
 *     always overwritten, no rotation. Players don't see it in the manual
 *     list — the UI hides slot-0.
 *   - scene: on scene change, write to `autosave-1.json` / `-2` / `-3` in
 *     round-robin order (1 → 2 → 3 → 1). The counter is persisted to
 *     `autosave-counter.json` so a crash mid-rotation doesn't reset to 1
 *     and clobber the player's most recent backup.
 *
 * The counter is loaded lazily (one fs read per process) and re-saved
 * after every successful write. If the counter file is missing or corrupt,
 * we fall back to 1 — a wrong start is preferable to a crash.
 *
 * All file IO goes through `storage.ts` — this module owns the *rotation
 * policy*, not the bytes.
 */

import { promises as fs } from 'node:fs';
import {
  AUTOSAVE_CHAPTER_SLOT,
  type AutosaveCounterFile,
  type AutosaveKind,
  type AutosaveRotationId,
  type SaveDataInput,
  type SaveSlot,
  SaveError,
} from './types';
import {
  AUTOSAVE_ROTATION_IDS,
  atomicWriteJson,
  autosaveCounterPath,
  autosaveFilePath,
  buildSaveRecord,
  ensureDir,
  writeThumbnailFile,
} from './storage';

/** Read the persisted counter. Missing/corrupt → 1. */
export const readCounter = async (base: string): Promise<AutosaveRotationId> => {
  const path = autosaveCounterPath(base);
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'counter' in parsed) {
      const c = (parsed as AutosaveCounterFile).counter;
      if (c === 1 || c === 2 || c === 3) return c;
    }
  } catch {
    // missing or unparseable — fall through
  }
  return 1;
};

/** Advance the counter 1 → 2 → 3 → 1. Pure. */
export const nextRotation = (current: AutosaveRotationId): AutosaveRotationId => {
  const idx = AUTOSAVE_ROTATION_IDS.indexOf(current);
  const next = AUTOSAVE_ROTATION_IDS[(idx + 1) % AUTOSAVE_ROTATION_IDS.length];
  return next ?? 1;
};

/**
 * Write an autosave of the given kind.
 *   kind=chapter: writes to slot-0 (always).
 *   kind=scene:   writes to autosave-1/2/3 in round-robin, persists the
 *                 advanced counter after a successful write.
 *
 * Returns the slot id that was written so the caller can show
 * "已自动存档到 autosave-2" feedback.
 */
export const writeAutosave = async (
  kind: AutosaveKind,
  data: SaveDataInput,
  base: string,
): Promise<{ id: 0 | AutosaveRotationId; record: SaveSlot }> => {
  if (kind === 'chapter') {
    const record = await writeToChapterSlot(data, base);
    return { id: 0, record };
  }
  // scene — rotating. The counter is the NEXT slot to write. After a
  // successful write, persist the slot-after-next so a crash leaves us
  // pointing past the slot we just filled (and won't clobber it on retry).
  const current = await readCounter(base);
  const record = await writeToAutosaveSlot(current, data, base);
  const advanced = nextRotation(current);
  await persistCounter(base, advanced);
  return { id: current, record };
};

/** Write to the hidden chapter-start slot (slot-0). */
const writeToChapterSlot = async (data: SaveDataInput, base: string): Promise<SaveSlot> => {
  const target = `${base}/saves/slot-${AUTOSAVE_CHAPTER_SLOT}.json`;
  return writeToPath(target, 0 as const, data, base, `slot-${AUTOSAVE_CHAPTER_SLOT}`);
};

/** Write to a rotating autosave slot (autosave-1/2/3). */
const writeToAutosaveSlot = async (
  id: AutosaveRotationId,
  data: SaveDataInput,
  base: string,
): Promise<SaveSlot> => {
  const target = autosaveFilePath(id, base);
  // The slot id field in the record is meaningless for autosaves (we use
  // 0 as a placeholder); the filename is the source of truth.
  return writeToPath(target, 0 as const, data, base, `autosave-${id}`);
};

/** Generic atomic write: thumbnail (if any) + JSON record. */
const writeToPath = async (
  target: string,
  slot: 0 | AutosaveRotationId,
  data: SaveDataInput,
  base: string,
  label: string,
): Promise<SaveSlot> => {
  await ensureDir(target);
  const savedAt = Date.now();
  const thumbnail = data.thumbnailBase64
    ? await writeThumbnailFile(label, savedAt, data.thumbnailBase64, base)
    : '';
  const record = buildSaveRecord(slot, data, savedAt, thumbnail);
  await atomicWriteJson(target, JSON.stringify(record, null, 2));
  return record;
};

/** Persist the next counter value. Atomic write. */
const persistCounter = async (base: string, counter: AutosaveRotationId): Promise<void> => {
  const path = autosaveCounterPath(base);
  const payload: AutosaveCounterFile = { counter };
  try {
    await atomicWriteJson(path, JSON.stringify(payload));
  } catch (e) {
    throw new SaveError(
      'write-failed',
      `Failed to persist autosave counter: ${(e as Error).message}`,
    );
  }
};

/** Test-only: reset counter to 1 by deleting the file. */
export const resetCounter = async (base: string): Promise<void> => {
  try {
    await fs.unlink(autosaveCounterPath(base));
  } catch {
    // missing is fine
  }
};

/** Convenience for the UI: get the human label for an autosave result. */
export const autosaveLabel = (id: number): string => {
  if (id === 0) return 'slot-0 (chapter autosave)';
  if (id === 1 || id === 2 || id === 3) return `autosave-${id}`;
  return `slot-${id}`;
};
