import { contextBridge, ipcRenderer } from 'electron';
import type { GameStateSnapshot, RecoveryState } from '../shared/types';
import type { RecoveryApi } from '../shared/api';

/**
 * Preload-side surface for the crash-recovery IPC channels. Runs in the
 * preload's isolated world; the renderer only ever sees the typed methods
 * below (no `ipcRenderer`, no Node APIs).
 *
 * This file is imported by `src/preload/index.ts` for its top-level side
 * effect (`contextBridge.exposeInMainWorld`). Keeping the expose here
 * means the recovery API is wired up the moment the preload runs, in
 * parallel with the `hermesBoris` global.
 */

const recoveryApi: RecoveryApi = {
  write: (snapshot: GameStateSnapshot): Promise<void> =>
    ipcRenderer.invoke('recovery:write', snapshot),
  read: (): Promise<RecoveryState | null> => ipcRenderer.invoke('recovery:read'),
  clear: (): Promise<void> => ipcRenderer.invoke('recovery:clear'),
};

contextBridge.exposeInMainWorld('recovery', recoveryApi);
