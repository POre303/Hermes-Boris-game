import { app, ipcMain } from 'electron';
import { join } from 'node:path';
import type { GameStateSnapshot, RecoveryState } from '../shared/types';
import { createCrashRecovery, type CrashRecovery } from './crash-recovery';

/**
 * Registers the three recovery IPC channels that the preload's
 * `recovery-api.ts` invokes. Returns the underlying `CrashRecovery` instance
 * so callers (e.g. the main entry point's crash handlers) can write recovery
 * from outside the IPC surface.
 */
export const registerRecoveryIpc = (): CrashRecovery => {
  // `app.getPath('userData')` is only valid after the app is ready on some
  // platforms, so resolve the file path here, lazily, inside the factory.
  const recovery = createCrashRecovery({
    filePath: join(app.getPath('userData'), 'crash-recovery.json'),
  });

  ipcMain.handle('recovery:write', async (_event, snapshot: GameStateSnapshot): Promise<void> => {
    await recovery.write(snapshot);
  });

  ipcMain.handle('recovery:read', async (): Promise<RecoveryState | null> => {
    return recovery.read();
  });

  ipcMain.handle('recovery:clear', async (): Promise<void> => {
    await recovery.clear();
  });

  return recovery;
};

/**
 * Install process-level crash handlers that snapshot the last-known good
 * state before the process dies. Electron's default behaviour is to let the
 * process crash; we deliberately do NOT call `process.exit()` ourselves —
 * letting the process die naturally means the `crash-recovery.json` we just
 * wrote is the only state a future boot can find.
 *
 * Handlers are installed synchronously at module load (rather than inside
 * `app.whenReady`) because `uncaughtException` can fire before `ready` and
 * we want at least one chance to flush the recovery file.
 */
export const installMainCrashHandlers = (recovery: CrashRecovery): void => {
  const writeAndRethrow = (origin: string, err: unknown): void => {
    try {
      // We don't have a real state machine snapshot at this point — write
      // an empty best-effort marker so the file is non-empty and the
      // renderer can still see a recovery prompt on next launch.
      void recovery.write({
        currentStateId: 'crashed',
        storeEntries: [],
      });
      console.error(`[main] ${origin}:`, err);
    } catch (writeErr) {
      // Don't let the crash handler itself crash; just log.
      console.error(`[main] ${origin} (and recovery write failed):`, err, writeErr);
    }
  };

  process.on('uncaughtException', (err) => {
    writeAndRethrow('uncaughtException', err);
  });
  process.on('unhandledRejection', (reason) => {
    writeAndRethrow('unhandledRejection', reason);
  });

  // Best-effort: clear recovery on graceful exit so a normal quit doesn't
  // look like a crash to the next launch.
  app.on('before-quit', () => {
    void recovery.clear();
  });
};
