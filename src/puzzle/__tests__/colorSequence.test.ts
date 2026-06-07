import { describe, it, expect } from 'vitest';
import { solveColorSequence } from '../solvers/colorSequence';
import type { ColorSequenceSolution } from '../types';

const SOLUTION: ColorSequenceSolution = {
  kind: 'color_sequence',
  sequence: ['red', 'white', 'red', 'blue'],
};

describe('solveColorSequence', () => {
  it('returns ok=true when user sequence matches exactly', () => {
    const result = solveColorSequence(SOLUTION, ['red', 'white', 'red', 'blue']);
    expect(result.ok).toBe(true);
  });

  it('returns ok=false wrong when one middle entry is off', () => {
    const result = solveColorSequence(SOLUTION, ['red', 'white', 'blue', 'red']);
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('returns ok=false wrong when first entry is off', () => {
    const result = solveColorSequence(SOLUTION, ['white', 'white', 'red', 'blue']);
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('returns ok=false incomplete when fewer entries than expected', () => {
    const result = solveColorSequence(SOLUTION, ['red', 'white', 'red']);
    expect(result).toEqual({ ok: false, reason: 'incomplete' });
  });

  it('returns ok=false incomplete for an empty user sequence', () => {
    const result = solveColorSequence(SOLUTION, []);
    expect(result).toEqual({ ok: false, reason: 'incomplete' });
  });

  it('returns ok=false wrong when an entry is an unknown token', () => {
    const result = solveColorSequence(SOLUTION, ['red', 'white', 'red', 'blue', 'cyan']);
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('returns ok=true when solution is empty and input is empty', () => {
    const empty: ColorSequenceSolution = { kind: 'color_sequence', sequence: [] };
    expect(solveColorSequence(empty, []).ok).toBe(true);
  });
});
