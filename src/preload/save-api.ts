/**
 * Preload bridge for the save system.
 *
 * Wraps the main process's `save:*` IPC channels as a typed `SaveApi`
 * and exposes it on `window.save` via contextBridge. Errors from the
 * main side arrive as `RpcResult<{ok:false,...}>`; we throw on the
 * preload side so the renderer's promise chain gets a real rejection.
 *
 * This module is imported by `src/preload/index.ts` for its side effect
 * (exposing the API on import).
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { SaveApi } from '../shared/save-api';
import type { AutosaveResult } from '../shared/save-api';
import type { SaveDataInput, SaveSlot, SaveSlotId, SaveSlotSummary } from '../save/types';

/** Generic wrapper: invoke the channel, unwrap the RpcResult, throw on error. */
const invoke = <R>(channel: string, ...args: unknown[]): Promise<R> =>
  ipcRenderer.invoke(channel, ...args).then((raw) => {
    const r = raw as { ok: boolean; value?: R; code?: string; message?: string };
    if (!r.ok) {
      throw new Error(`[save] ${channel} failed: ${r.code ?? 'unknown'} ${r.message ?? ''}`.trim());
    }
    return r.value as R;
  });

/** Build the `SaveApi` object that gets exposed on `window.save`. */
const buildSaveApi = (): SaveApi => ({
  write: (slot: SaveSlotId, data: SaveDataInput): Promise<SaveSlotSummary> =>
    invoke<SaveSlotSummary>('save:write', slot, data),
  read: (slot: SaveSlotId): Promise<SaveSlot | null> => invoke<SaveSlot | null>('save:read', slot),
  list: (): Promise<SaveSlotSummary[]> => invoke<SaveSlotSummary[]>('save:list'),
  delete: (slot: SaveSlotId): Promise<void> => invoke<void>('save:delete', slot),
  autosave: (kind, data): Promise<AutosaveResult> =>
    invoke<AutosaveResult>('save:autosave', kind, data),
  listAutosaves: (): Promise<SaveSlotSummary[]> => invoke<SaveSlotSummary[]>('save:list-autosaves'),
  readScreenshot: (rel: string): Promise<string | null> =>
    invoke<string | null>('save:read-screenshot', rel),
});

contextBridge.exposeInMainWorld('save', buildSaveApi());
