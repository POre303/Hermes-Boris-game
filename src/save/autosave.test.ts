/**
 * Autosave tests — chapter-start hidden slot + scene rotation + counter persistence.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { promises as fs } from 'node:fs';
import { autosaveLabel, nextRotation, readCounter, resetCounter, writeAutosave } from './autosave';
import { autosaveCounterPath, listAutosaves, readSlot, setBaseDirGetter } from './storage';
import type { SaveDataInput } from './types';

let baseDir = '';
const createdDirs: string[] = [];

beforeEach(async () => {
  baseDir = await mkdtemp(join(tmpdir(), 'hermes-boris-autosave-test-'));
  createdDirs.push(baseDir);
  // Point the storage module at our temp dir (used by listAutosaves).
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

const snap = (over: Partial<SaveDataInput> = {}): SaveDataInput => ({
  chapter: 1,
  scene: 'forest-entrance',
  palette: 'tokyo_heisei',
  inventory: [],
  flags: {},
  solvedPuzzles: [],
  ...over,
});

describe('nextRotation (pure)', () => {
  it('cycles 1 → 2 → 3 → 1', () => {
    expect(nextRotation(1)).toBe(2);
    expect(nextRotation(2)).toBe(3);
    expect(nextRotation(3)).toBe(1);
  });
});

describe('writeAutosave (chapter)', () => {
  it('always writes to slot-0 regardless of counter', async () => {
    await fs.mkdir(dirname(autosaveCounterPath(baseDir)), { recursive: true });
    await writeFile(autosaveCounterPath(baseDir), JSON.stringify({ counter: 3 }), 'utf8');
    const { id, record } = await writeAutosave('chapter', snap(), baseDir);
    expect(id).toBe(0);
    expect(record.chapter).toBe(1);
    const slot0 = await readSlot(0);
    expect(slot0?.scene).toBe('forest-entrance');
  });
});

describe('writeAutosave (scene) — rotation', () => {
  it('first call writes to autosave-1 and counter becomes 2', async () => {
    const { id } = await writeAutosave('scene', snap(), baseDir);
    expect(id).toBe(1);
    expect(autosaveLabel(id)).toBe('autosave-1');
    expect(await readCounter(baseDir)).toBe(2);
  });

  it('second call writes to autosave-2, third to autosave-3, fourth back to 1', async () => {
    const r1 = await writeAutosave('scene', snap(), baseDir);
    const r2 = await writeAutosave('scene', snap(), baseDir);
    const r3 = await writeAutosave('scene', snap(), baseDir);
    const r4 = await writeAutosave('scene', snap(), baseDir);
    expect([r1.id, r2.id, r3.id, r4.id]).toEqual([1, 2, 3, 1]);
  });

  it('counter survives a "process restart" (file is persisted)', async () => {
    await writeAutosave('scene', snap(), baseDir);
    await writeAutosave('scene', snap(), baseDir);
    // Simulate restart: drop the in-memory state, keep the on-disk file.
    expect(await readCounter(baseDir)).toBe(3);
    // Third call from a "fresh process" should still go to autosave-3.
    const r = await writeAutosave('scene', snap(), baseDir);
    expect(r.id).toBe(3);
    // Now counter is 1 again (the next-after-3 in 1→2→3→1).
    expect(await readCounter(baseDir)).toBe(1);
  });

  it('missing or corrupt counter file falls back to 1', async () => {
    // No file at all.
    expect(await readCounter(baseDir)).toBe(1);
    // Corrupt file.
    await fs.mkdir(dirname(autosaveCounterPath(baseDir)), { recursive: true });
    await writeFile(autosaveCounterPath(baseDir), 'garbage', 'utf8');
    expect(await readCounter(baseDir)).toBe(1);
    // Out-of-range value.
    await writeFile(autosaveCounterPath(baseDir), JSON.stringify({ counter: 9 }), 'utf8');
    expect(await readCounter(baseDir)).toBe(1);
  });

  it('resetCounter deletes the persisted file', async () => {
    await writeAutosave('scene', snap(), baseDir);
    expect(await readCounter(baseDir)).toBe(2);
    await resetCounter(baseDir);
    expect(await readCounter(baseDir)).toBe(1);
  });
});

describe('listAutosaves', () => {
  it('returns both hidden slot-0 and rotating autosaves', async () => {
    await writeAutosave('chapter', snap({ scene: 'ch' }), baseDir);
    await writeAutosave('scene', snap({ scene: 'sc1' }), baseDir);
    await writeAutosave('scene', snap({ scene: 'sc2' }), baseDir);
    const list = await listAutosaves();
    const byId = new Map(list.map((s) => [String(s.id), s]));
    expect(byId.get('0')?.scene).toBe('ch');
    expect(byId.get('autosave-1')?.scene).toBe('sc1');
    expect(byId.get('autosave-2')?.scene).toBe('sc2');
  });

  it('all entries are flagged isAutosave=true', async () => {
    await writeAutosave('chapter', snap(), baseDir);
    await writeAutosave('scene', snap(), baseDir);
    const list = await listAutosaves();
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      expect(s.isAutosave).toBe(true);
    }
  });
});
