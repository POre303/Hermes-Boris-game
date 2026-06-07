import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GameStateSnapshot, RecoveryState } from '../shared/types';

/**
 * Crash-recovery persistence layer.
 *
 * The on-disk format is a single JSON file written atomically (write to a
 * temp file, then rename). A crash mid-write therefore can never leave a
 * half-file at the target path. The file path is supplied by the caller;
 * production wires it to `<userData>/crash-recovery.json` from the main
 * entry point. Keeping the file-path resolution out of this module lets
 * the unit tests run in happy-dom without an electron runtime present.
 *
 * See `src/main/ipc.ts` for the IPC binding and the main-process crash
 * handlers that consume this; see `src/renderer/src/boot-guard.ts` for
 * the renderer-side flow that decides when to read or clear the file.
 */

export interface CrashRecovery {
  write(snapshot: GameStateSnapshot): Promise<void>;
  read(): Promise<RecoveryState | null>;
  clear(): Promise<void>;
}

export interface CrashRecoveryOptions {
  /** Target file path. Required. */
  filePath: string;
}

const tempPathFor = (filePath: string): string => {
  const dir = dirname(filePath);
  const rand = randomBytes(6).toString('hex');
  return join(dir, `.crash-recovery.${rand}.tmp`);
};

/**
 * Atomic write: temp file + rename. `rename` on the same filesystem is
 * atomic on POSIX; on Windows the same-volume rename is atomic from the
 * perspective of any reader (the target either doesn't exist or is fully
 * renamed). The temp file lives in the same directory as the target, so
 * cross-volume rename cannot happen here.
 */
const writeJsonAtomic = async (filePath: string, payload: string): Promise<void> => {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = tempPathFor(filePath);
  try {
    await fs.writeFile(tmp, payload, 'utf8');
    await fs.rename(tmp, filePath);
  } catch (err) {
    // Best-effort cleanup; the original error is what the caller cares about.
    try {
      await fs.unlink(tmp);
    } catch {
      // temp file may not exist if writeFile failed before creating it
    }
    throw err;
  }
};

const readJsonFile = async (filePath: string): Promise<RecoveryState | null> => {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(text) as unknown;
    if (parsed == null || typeof parsed !== 'object') return null;
    return parsed as RecoveryState;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
};

export const createCrashRecovery = (options: CrashRecoveryOptions): CrashRecovery => {
  if (!options.filePath) {
    throw new Error('createCrashRecovery: options.filePath is required');
  }
  const { filePath } = options;

  return {
    async write(snapshot) {
      // Read existing state (best-effort: a corrupt file is treated as "no
      // existing state", so the next crashCount starts fresh from 0).
      let current: RecoveryState | null = null;
      try {
        current = await readJsonFile(filePath);
      } catch {
        current = null;
      }
      const next: RecoveryState = {
        lastSafeState: snapshot,
        lastTransitionAt: Date.now(),
        crashCount: current ? current.crashCount + 1 : 0,
      };
      await writeJsonAtomic(filePath, JSON.stringify(next));
    },

    async read() {
      return readJsonFile(filePath);
    },

    async clear() {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw err;
      }
    },
  };
};
