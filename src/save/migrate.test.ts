/**
 * Schema migration tests.
 */

import { describe, expect, it } from 'vitest';
import { migrate } from './migrate';
import { SaveError } from './types';

const validV1 = {
  id: 1,
  chapter: 'prologue' as const,
  scene: 'intro',
  palette: 'tokyo_heisei' as const,
  inventory: ['key'],
  flags: { met: true },
  solvedPuzzles: ['p1'],
  savedAt: 1000,
  thumbnail: 'screenshots/slot-1-1000.png',
  schemaVersion: 1,
};

describe('migrate', () => {
  it('passes through a valid v1 record', () => {
    const out = migrate(validV1);
    expect(out).toEqual(validV1);
  });

  it('promotes a v0 record (no schemaVersion) to v1', () => {
    const v0 = { ...validV1 };
    (v0 as { schemaVersion?: number }).schemaVersion = undefined;
    const out = migrate(v0);
    expect(out.schemaVersion).toBe(1);
    expect(out.chapter).toBe('prologue');
  });

  it('rejects a record with a future schemaVersion', () => {
    const future = { ...validV1, schemaVersion: 999 };
    expect(() => migrate(future)).toThrow(SaveError);
  });

  it('rejects a record with an invalid chapter', () => {
    const bad = { ...validV1, chapter: 'atlantis' };
    expect(() => migrate(bad)).toThrow(SaveError);
  });

  it('rejects a record with a non-string inventory', () => {
    const bad = { ...validV1, inventory: [1, 2, 3] };
    expect(() => migrate(bad)).toThrow(SaveError);
  });

  it('rejects a record with a non-boolean flag', () => {
    const bad = { ...validV1, flags: { a: 1 } };
    expect(() => migrate(bad)).toThrow(SaveError);
  });

  it('rejects a non-object input', () => {
    expect(() => migrate(null)).toThrow(SaveError);
    expect(() => migrate('string')).toThrow(SaveError);
    expect(() => migrate(42)).toThrow(SaveError);
  });
});
