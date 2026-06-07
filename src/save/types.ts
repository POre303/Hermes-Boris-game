/**
 * Save-system shared types.
 *
 * Defined once here so both the main process (storage, autosave, migrate)
 * and the renderer (save-ui, autosave-trigger) speak the same shape.
 *
 * Schema lives at version 1. The `migrate.ts` module is the only thing
 * allowed to upgrade or downgrade `SaveSlot` between versions — runtime
 * code should always treat `SaveSlot` as the post-migration shape.
 *
 * The thumbnail is a *relative path* to a separate PNG file, not a base64
 * blob. See `screenshot.ts` for why (slot.json must stay < 50KB so the
 * save-list scan can stream files cheaply on Electron cold start).
 */

/** User-visible manual save slots. Exactly 10 — the UI is a 5x2 grid. */
export type SaveSlotId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Chapter key the save was taken in. */
export type ChapterKey = 'prologue' | 1 | 2 | 3 | 'epilogue' | 'ending';

/** Palette the renderer should switch to when loading this save. */
export type PaletteKey = 'tokyo_heisei' | 'train_night' | 'theatre_warm';

/** Input payload the renderer hands to the save API. */
export interface SaveDataInput {
  chapter: ChapterKey;
  scene: string;
  palette: PaletteKey;
  inventory: readonly string[];
  flags: Readonly<Record<string, boolean>>;
  solvedPuzzles: readonly string[];
  /** base64 PNG without the `data:image/png;base64,` prefix. */
  thumbnailBase64?: string;
}

/** On-disk save record (post-migration). */
export interface SaveSlot {
  id: SaveSlotId;
  chapter: ChapterKey;
  scene: string;
  palette: PaletteKey;
  inventory: string[];
  flags: Record<string, boolean>;
  solvedPuzzles: string[];
  savedAt: number;
  /** Relative path under `userData/`, e.g. `screenshots/slot-1-1718...png`. */
  thumbnail: string;
  schemaVersion: 1;
}

/** Lightweight summary used by the save-list UI (no screenshot bytes). */
export interface SaveSlotSummary {
  id: SaveSlotId | 'autosave-1' | 'autosave-2' | 'autosave-3';
  chapter: ChapterKey;
  scene: string;
  savedAt: number;
  hasThumbnail: boolean;
  /** True for the hidden slot-0 chapter-start autosave. UI hides these. */
  isAutosave: boolean;
}

/** Autosave trigger kinds. */
export type AutosaveKind = 'chapter' | 'scene';

/** Special "slot" id for the chapter-start hidden autosave. */
export const AUTOSAVE_CHAPTER_SLOT: SaveSlotId = 0;

/** Counter file schema. Persisted to `saves/autosave-counter.json`. */
export interface AutosaveCounterFile {
  counter: 1 | 2 | 3;
}

/** All errors thrown by the save module carry this tag for the UI to inspect. */
export type SaveErrorCode =
  | 'invalid-slot'
  | 'parse-failed'
  | 'write-failed'
  | 'rename-failed'
  | 'read-failed'
  | 'thumbnail-failed';

export class SaveError extends Error {
  override readonly name = 'SaveError';
  readonly code: SaveErrorCode;
  constructor(code: SaveErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** The 3 rotating scene-autosave slot ids. (Distinct from `SaveSlotId`,
 *  which is the 10 user-facing manual save slots including the hidden
 *  chapter-start slot-0.) */
export type AutosaveRotationId = 1 | 2 | 3;
