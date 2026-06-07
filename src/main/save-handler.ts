/**
 * Main-process IPC handler for the save system.
 *
 * Wires the save module functions into electron's ipcMain.handle under the
 * `save:*` channel namespace. The preload script (src/preload/save-api.ts)
 * exposes these to the renderer as `window.save.*`.
 *
 * The base directory is fixed once at app boot — Electron's userData path
 * doesn't change for the lifetime of the process.
 */

import { app, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { promises as fs } from 'node:fs';
import {
  autosaveLabel,
  deleteSlot,
  listAutosaves,
  listManualSlots,
  readSlot,
  SaveError,
  setBaseDirGetter,
  type SaveDataInput,
  type SaveSlot,
  type SaveSlotId,
  type SaveSlotSummary,
  writeAutosave,
  writeSlot,
} from '../save';
import { screenshotAbsPath } from '../save/storage';
import type { RpcResult, SaveIpcApi } from '../shared/save-api';

const isSaveSlotId = (n: unknown): n is SaveSlotId =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 9;

const isAutosaveKind = (n: unknown): n is 'chapter' | 'scene' => n === 'chapter' || n === 'scene';

const handleError = (e: unknown): RpcResult<never> => {
  if (e instanceof SaveError) {
    return { ok: false, code: e.code, message: e.message };
  }
  const msg = e instanceof Error ? e.message : String(e);
  return { ok: false, code: 'unknown', message: msg };
};

const ok = <T>(value: T): RpcResult<T> => ({ ok: true, value });

/** Build the SaveSlotSummary for a returned record. */
const summaryFor = (record: SaveSlot, isAutosave: boolean): SaveSlotSummary => ({
  id: record.id,
  chapter: record.chapter,
  scene: record.scene,
  savedAt: record.savedAt,
  hasThumbnail: !!record.thumbnail,
  isAutosave,
});

/**
 * Register all save:* IPC channels and inject the userData base dir.
 * Call this once at app boot, before any window is created (so the
 * renderer can call window.save.* as soon as the page loads).
 */
export const registerSaveIpc = (): void => {
  // Inject userData path so the save module can resolve save/screenshot dirs.
  setBaseDirGetter(() => app.getPath('userData'));

  const api: SaveIpcApi = {
    write: async (slot, data) => {
      if (!isSaveSlotId(slot))
        return handleError(new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`));
      try {
        const record = await writeSlot(slot, data);
        return ok(summaryFor(record, false));
      } catch (e) {
        return handleError(e);
      }
    },
    read: async (slot) => {
      if (!isSaveSlotId(slot))
        return handleError(new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`));
      try {
        const slot2 = await readSlot(slot);
        return ok(slot2);
      } catch (e) {
        return handleError(e);
      }
    },
    list: async () => {
      try {
        return ok(await listManualSlots());
      } catch (e) {
        return handleError(e);
      }
    },
    delete: async (slot) => {
      if (!isSaveSlotId(slot))
        return handleError(new SaveError('invalid-slot', `Slot must be 0..9, got ${slot}`));
      try {
        await deleteSlot(slot);
        return ok(undefined);
      } catch (e) {
        return handleError(e);
      }
    },
    autosave: async (kind, data) => {
      if (!isAutosaveKind(kind)) {
        return handleError(
          new SaveError(
            'invalid-slot',
            `Autosave kind must be 'chapter' or 'scene', got ${String(kind)}`,
          ),
        );
      }
      try {
        const base = app.getPath('userData');
        const { id } = await writeAutosave(kind, data, base);
        return ok({ id, label: autosaveLabel(id) });
      } catch (e) {
        return handleError(e);
      }
    },
    listAutosaves: async () => {
      try {
        return ok(await listAutosaves());
      } catch (e) {
        return handleError(e);
      }
    },
    readScreenshot: async (rel) => {
      if (typeof rel !== 'string' || rel.length === 0) {
        return handleError(new SaveError('thumbnail-failed', 'Screenshot path required'));
      }
      try {
        const abs = screenshotAbsPath(rel);
        const buf = await fs.readFile(abs);
        return ok(buf.toString('base64'));
      } catch (e) {
        const code = (e as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') return ok(null);
        return handleError(e);
      }
    },
  };

  registerSaveChannels(api);
};

/** Register each method of `api` as an `ipcMain.handle` call. */
const registerSaveChannels = (api: SaveIpcApi): void => {
  const channels: ReadonlyArray<readonly [string, (...args: unknown[]) => Promise<unknown>]> = [
    ['save:write', (slot, data) => api.write(slot as number, data as SaveDataInput)],
    ['save:read', (slot) => api.read(slot as number)],
    ['save:list', () => api.list()],
    ['save:delete', (slot) => api.delete(slot as number)],
    [
      'save:autosave',
      (kind, data) => api.autosave(kind as 'chapter' | 'scene', data as SaveDataInput),
    ],
    ['save:list-autosaves', () => api.listAutosaves()],
    ['save:read-screenshot', (rel) => api.readScreenshot(rel as string)],
  ];
  for (const [channel, handler] of channels) {
    ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: unknown[]) =>
      handler(...args),
    );
  }
};
