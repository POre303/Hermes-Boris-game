/**
 * Storage layer tests — main-side fs IO.
 *
 * Each test uses an isolated temp dir under `os.tmpdir()` so the real
 * `userData/saves/` is never touched. The base dir is injected via
 * `setBaseDirGetter` which the storage module exposes for exactly this
 * reason.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import {
  listManualSlots,
  readSlot,
  setBaseDirGetter,
  slotFilePath,
  writeSlot,
  deleteSlot,
} from './storage';
import { SaveError, type SaveDataInput, type SaveSlot } from './types';

let baseDir = '';
const createdDirs: string[] = [];

beforeEach(async () => {
  baseDir = await mkdtemp(join(tmpdir(), 'hermes-boris-save-test-'));
  createdDirs.push(baseDir);
  setBaseDirGetter(() => baseDir);
});

afterEach(async () => {
  for (const d of createdDirs.splice(0)) {
    try {
      await rm(d, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

const fixtureInput = (over: Partial<SaveDataInput> = {}): SaveDataInput => ({
  chapter: 'prologue',
  scene: 'intro-1',
  palette: 'tokyo_heisei',
  inventory: ['note', 'key'],
  flags: { met_rumiko: true },
  solvedPuzzles: ['p1'],
  ...over,
});

describe('storage.writeSlot + readSlot', () => {
  it('write → read roundtrips the same data', async () => {
    const input = fixtureInput();
    const written = await writeSlot(1, input);
    expect(written.id).toBe(1);
    expect(written.schemaVersion).toBe(1);
    expect(written.chapter).toBe('prologue');
    expect(written.scene).toBe('intro-1');
    expect(written.inventory).toEqual(['note', 'key']);
    expect(written.flags).toEqual({ met_rumiko: true });
    expect(written.solvedPuzzles).toEqual(['p1']);
    expect(written.savedAt).toBeGreaterThan(0);

    const read = await readSlot(1);
    expect(read).toEqual(written);
  });

  it('read returns null for a slot that was never written', async () => {
    const read = await readSlot(5);
    expect(read).toBeNull();
  });

  it('rejects an out-of-range slot id', async () => {
    // @ts-expect-error — intentionally passing an invalid id
    await expect(writeSlot(10, fixtureInput())).rejects.toBeInstanceOf(SaveError);
    // @ts-expect-error
    await expect(readSlot(-1)).rejects.toBeInstanceOf(SaveError);
  });

  it('writes slot.json as pretty-printed JSON', async () => {
    await writeSlot(2, fixtureInput());
    const raw = await readFile(slotFilePath(2), 'utf8');
    expect(raw).toContain('\n  '); // indented, not minified
    expect(raw).toContain('"schemaVersion": 1');
  });

  it('persists the thumbnail to a separate PNG file and stores the relative path', async () => {
    // 1x1 transparent PNG, base64. Real game would pass a 240x135.
    const onePxPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';
    const written = await writeSlot(3, fixtureInput({ thumbnailBase64: onePxPng }));
    expect(written.thumbnail).toMatch(/^screenshots\/slot-3-\d+\.png$/);
    const pngAbsPath = join(baseDir, written.thumbnail);
    const pngBytes = await readFile(pngAbsPath);
    // PNG magic header is 89 50 4E 47 0D 0A 1A 0A
    expect(pngBytes.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it('overwriting a slot replaces the old JSON atomically', async () => {
    await writeSlot(4, fixtureInput({ scene: 'a' }));
    const before = await readSlot(4);
    await writeSlot(4, fixtureInput({ scene: 'b' }));
    const after = await readSlot(4);
    expect(before?.scene).toBe('a');
    expect(after?.scene).toBe('b');
  });

  it('atomic write: rename failure does not pollute the target', async () => {
    // Pre-create a valid target file so we can detect any pollution.
    const target = slotFilePath(7);
    await fs.mkdir(join(baseDir, 'saves'), { recursive: true });
    const original = JSON.stringify({
      id: 7,
      chapter: 'prologue',
      scene: 'ORIGINAL',
      schemaVersion: 1,
    });
    await writeFile(target, original, 'utf8');

    // Spy on fs.rename and make it fail.
    const renameSpy = vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('EACCES: synthetic'));
    try {
      await expect(writeSlot(7, fixtureInput({ scene: 'NEW' }))).rejects.toThrow(/Failed to write/);
    } finally {
      renameSpy.mockRestore();
    }
    // Target file should be untouched.
    const after = await readFile(target, 'utf8');
    expect(after).toBe(original);
  });
});

describe('storage.listManualSlots', () => {
  it('returns an empty list when no slots are saved', async () => {
    const list = await listManualSlots();
    expect(list).toEqual([]);
  });

  it('skips slot-0 (hidden chapter autosave)', async () => {
    await writeSlot(0, fixtureInput());
    const list = await listManualSlots();
    expect(list).toEqual([]);
  });

  it('lists slots 1..9 and excludes missing ones', async () => {
    await writeSlot(2, fixtureInput({ scene: 'two' }));
    await writeSlot(5, fixtureInput({ scene: 'five' }));
    const list = await listManualSlots();
    expect(list).toHaveLength(2);
    const ids = list.map((s) => s.id).sort();
    expect(ids).toEqual([2, 5]);
  });

  it('corrupt slot.json does not block other slots', async () => {
    await writeSlot(2, fixtureInput({ scene: 'two' }));
    // Write garbage to slot-3
    const bad = slotFilePath(3);
    await fs.mkdir(join(baseDir, 'saves'), { recursive: true });
    await writeFile(bad, '{not valid json', 'utf8');
    const list = await listManualSlots();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(2);
  });
});

describe('storage.deleteSlot', () => {
  it('removes an existing slot', async () => {
    await writeSlot(8, fixtureInput());
    expect(await readSlot(8)).not.toBeNull();
    await deleteSlot(8);
    expect(await readSlot(8)).toBeNull();
  });

  it('is idempotent (missing slot does not throw)', async () => {
    await expect(deleteSlot(8)).resolves.toBeUndefined();
  });
});
