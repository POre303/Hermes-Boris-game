/**
 * Shared types for the save system — used by main, preload, and renderer.
 *
 * Kept in its own file (not appended to api.ts) so this D2-3 worktree has
 * zero diff against `src/shared/api.ts`. The orchestrator's squash merge
 * for D2-2 (AudioApi) is unaffected.
 *
 * Three layers:
 *   - `SaveIpcApi`:  the *function shapes* the main process exposes over IPC
 *                    (preload imports and wraps them via ipcRenderer.invoke)
 *   - `RpcResult`:   the tagged-union envelope every method returns — the
 *                    renderer always reads `.ok` first, then `.value`/`.code`
 *   - `SaveApi`:     the *public* surface exposed to renderer code as
 *                    `window.save.*` (preload builds it from SaveIpcApi by
 *                    unwrapping RpcResult, throwing on error)
 *
 * SaveDataInput, SaveSlot, SaveSlotSummary are re-exported from save/types
 * so the renderer can import everything it needs from a single file
 * (avoids adding `src/save/**` to the web tsconfig — storage.ts uses node:fs
 * and would fail the web typecheck).
 */

import type { SaveDataInput, SaveSlot, SaveSlotSummary } from '../save/types';

export type { SaveDataInput, SaveSlot, SaveSlotSummary };

/** Tagged-union result. Every IPC method returns this. */
export type RpcResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

/** Result of an autosave write — useful for the "已自动存档到 autosave-2" toast. */
export interface AutosaveResult {
  /** Slot id that was written: 0 (chapter), 1, 2, or 3 (scene rotation). */
  id: 0 | 1 | 2 | 3;
  /** Human-readable label like "autosave-2" or "slot-0 (chapter autosave)". */
  label: string;
}

/** Method shapes the main process implements under ipcMain.handle. */
export interface SaveIpcApi {
  write(slot: number, data: SaveDataInput): Promise<RpcResult<SaveSlotSummary>>;
  read(slot: number): Promise<RpcResult<SaveSlot | null>>;
  list(): Promise<RpcResult<SaveSlotSummary[]>>;
  delete(slot: number): Promise<RpcResult<void>>;
  autosave(kind: 'chapter' | 'scene', data: SaveDataInput): Promise<RpcResult<AutosaveResult>>;
  listAutosaves(): Promise<RpcResult<SaveSlotSummary[]>>;
  readScreenshot(rel: string): Promise<RpcResult<string | null>>;
}

/** The public surface the renderer uses. Methods throw on error. */
export interface SaveApi {
  /** Write a manual save to slot 0..9. */
  write(slot: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, data: SaveDataInput): Promise<SaveSlotSummary>;
  /** Read a manual save. Returns null if slot is empty. */
  read(slot: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): Promise<SaveSlot | null>;
  /** List all manual save slots 1..9 (slot 0 is hidden autosave). */
  list(): Promise<SaveSlotSummary[]>;
  /** Delete a manual save slot. Idempotent. */
  delete(slot: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): Promise<void>;
  /** Force an autosave (chapter start or scene change). */
  autosave(kind: 'chapter' | 'scene', data: SaveDataInput): Promise<AutosaveResult>;
  /** List autosaves: hidden slot-0 + rotating autosave-1/2/3. */
  listAutosaves(): Promise<SaveSlotSummary[]>;
  /** Read a screenshot PNG as base64 (no data: prefix). Returns null if missing. */
  readScreenshot(rel: string): Promise<string | null>;
}

declare global {
  interface Window {
    readonly save: SaveApi;
  }
}
