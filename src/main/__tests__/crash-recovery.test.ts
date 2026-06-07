import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCrashRecovery } from '../crash-recovery';

/**
 * Unit tests for the crash-recovery persistence layer.
 *
 * Each test gets a fresh temp directory under `os.tmpdir()` so the suite
 * can run in parallel and never leaves a stale file behind.
 *
 * The 4 cases below cover the D2-4 spec's verification list:
 *   1. write + read roundtrip
 *   2. clear removes the file
 *   3. crashCount increments on consecutive writes
 *   4. atomic write: a mid-write failure does not corrupt the target file
 */

describe('crash-recovery', () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'hermes-boris-cr-'));
    filePath = join(dir, 'crash-recovery.json');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('write then read returns the same snapshot', async () => {
    const cr = createCrashRecovery({ filePath });
    const snapshot = {
      currentStateId: 'game',
      storeEntries: [
        ['menuIndex', '0'],
        ['gameClock', '128'],
      ] as ReadonlyArray<readonly [string, string]>,
    };

    await cr.write(snapshot);
    const read = await cr.read();

    expect(read).not.toBeNull();
    expect(read?.lastSafeState).toEqual(snapshot);
    expect(read?.crashCount).toBe(0);
    // lastTransitionAt should be a recent unix-ms timestamp.
    expect(typeof read?.lastTransitionAt).toBe('number');
    expect(Date.now() - (read?.lastTransitionAt ?? 0)).toBeLessThan(5_000);
  });

  it('clear removes the file; subsequent read returns null', async () => {
    const cr = createCrashRecovery({ filePath });
    await cr.write({ currentStateId: 'title', storeEntries: [] });

    // Sanity check: the file exists after write.
    const statBefore = await fs.stat(filePath);
    expect(statBefore.isFile()).toBe(true);

    await cr.clear();
    expect(await cr.read()).toBeNull();

    // clear on a missing file is a no-op (does not throw).
    await expect(cr.clear()).resolves.toBeUndefined();
  });

  it('crashCount increments on consecutive writes; first write is 0', async () => {
    const cr = createCrashRecovery({ filePath });
    await cr.write({ currentStateId: 'title', storeEntries: [] });
    expect((await cr.read())?.crashCount).toBe(0);

    await cr.write({ currentStateId: 'main-menu', storeEntries: [] });
    expect((await cr.read())?.crashCount).toBe(1);

    await cr.write({ currentStateId: 'game', storeEntries: [] });
    expect((await cr.read())?.crashCount).toBe(2);
  });

  it('atomic write: a writeFile failure leaves the target file unchanged', async () => {
    const cr = createCrashRecovery({ filePath });
    // First, a successful write so the target file has known content.
    await cr.write({ currentStateId: 'title', storeEntries: [] });
    const before = await cr.read();
    expect(before?.lastSafeState.currentStateId).toBe('title');

    // Force the next writeFile call (the one that writes the .tmp file)
    // to fail. The atomic-write helper must clean up the temp and re-throw
    // without touching the target.
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('disk full'));

    try {
      await expect(cr.write({ currentStateId: 'game', storeEntries: [] })).rejects.toThrow(
        'disk full',
      );
    } finally {
      writeFileSpy.mockRestore();
    }

    // The target file must still be the original, untouched snapshot.
    const after = await cr.read();
    expect(after?.lastSafeState.currentStateId).toBe('title');
    expect(after?.crashCount).toBe(0);

    // And no temp files should linger in the directory.
    const remaining = await fs.readdir(dir);
    const temps = remaining.filter((f) => f.endsWith('.tmp'));
    expect(temps).toEqual([]);
  });

  it('read returns null on a missing file (no throw)', async () => {
    const cr = createCrashRecovery({ filePath });
    expect(await cr.read()).toBeNull();
  });
});
