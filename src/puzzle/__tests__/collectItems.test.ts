import { describe, it, expect } from 'vitest';
import { solveCollectItems } from '../solvers/collectItems';
import type { CollectItemsSolution } from '../types';

const SOLUTION: CollectItemsSolution = {
  kind: 'collect_items',
  required: ['antler_a', 'antler_b', 'antler_c'],
};

describe('solveCollectItems', () => {
  it('returns ok=true when inventory exactly matches the required set', () => {
    const result = solveCollectItems(SOLUTION, ['antler_a', 'antler_b', 'antler_c']);
    expect(result.ok).toBe(true);
  });

  it('returns ok=true regardless of inventory ordering (set equality)', () => {
    const result = solveCollectItems(SOLUTION, ['antler_c', 'antler_a', 'antler_b']);
    expect(result.ok).toBe(true);
  });

  it('returns ok=false incomplete when one required item is missing', () => {
    const result = solveCollectItems(SOLUTION, ['antler_a', 'antler_b']);
    expect(result).toEqual({ ok: false, reason: 'incomplete' });
  });

  it('returns ok=false incomplete for an empty inventory', () => {
    const result = solveCollectItems(SOLUTION, []);
    expect(result).toEqual({ ok: false, reason: 'incomplete' });
  });

  it('returns ok=false wrong when the inventory has an extra (non-required) item', () => {
    const result = solveCollectItems(SOLUTION, [
      'antler_a',
      'antler_b',
      'antler_c',
      'mystery_thing',
    ]);
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('returns ok=false wrong when every required item is wrong (none of them match)', () => {
    const result = solveCollectItems(SOLUTION, ['rock', 'leaf', 'feather']);
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('returns ok=true for an empty required set with empty inventory', () => {
    const empty: CollectItemsSolution = { kind: 'collect_items', required: [] };
    expect(solveCollectItems(empty, []).ok).toBe(true);
  });
});
