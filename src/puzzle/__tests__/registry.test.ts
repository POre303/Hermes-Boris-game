import { describe, it, expect, beforeEach } from 'vitest';
import { registerPuzzle, getPuzzle, trySolve, puzzleCount, __resetRegistry } from '../registry';
import { registerSprintPuzzles } from '../bootstrap';
import { l1Puzzle } from '../types';

describe('puzzle registry', () => {
  beforeEach(() => {
    __resetRegistry();
  });

  it('registerSprintPuzzles hydrates exactly 4 sprint puzzles', () => {
    registerSprintPuzzles();
    expect(puzzleCount()).toBe(4);
  });

  it('trySolve returns invalid-state for unknown id', () => {
    registerSprintPuzzles();
    const result = trySolve('not_a_puzzle', { sequence: [] });
    expect(result).toEqual({ ok: false, reason: 'invalid-state' });
  });

  it('trySolve dispatches L1 to colorSequence and succeeds on the lantern puzzle', () => {
    registerSprintPuzzles();
    const result = trySolve('prologue_p1_lantern_color', {
      sequence: ['red', 'white', 'red', 'blue'],
    });
    expect(result.ok).toBe(true);
  });

  it('trySolve dispatches L2 to collectItems and succeeds on the antler puzzle', () => {
    registerSprintPuzzles();
    const result = trySolve('ch1_p1_antler_collect', {
      inventory: ['antler_a', 'antler_b', 'antler_c'],
    });
    expect(result.ok).toBe(true);
  });

  it('trySolve reports wrong for a wrong L1 attempt', () => {
    registerSprintPuzzles();
    const result = trySolve('prologue_p1_lantern_color', {
      sequence: ['red', 'red', 'red', 'red'],
    });
    expect(result).toEqual({ ok: false, reason: 'wrong' });
  });

  it('registerPuzzle throws on duplicate id (fails fast on misconfigured YAML)', () => {
    registerPuzzle(
      l1Puzzle({
        id: 'dup',
        chapter: 0,
        hint: 'a',
        solution: { kind: 'color_sequence', sequence: ['red'] },
      }),
    );
    expect(() =>
      registerPuzzle(
        l1Puzzle({
          id: 'dup',
          chapter: 0,
          hint: 'b',
          solution: { kind: 'color_sequence', sequence: ['blue'] },
        }),
      ),
    ).toThrow(/already registered/);
  });

  it('getPuzzle returns the registered definition and undefined otherwise', () => {
    registerSprintPuzzles();
    expect(getPuzzle('prologue_p2_postcard_order')?.type).toBe('L1');
    expect(getPuzzle('nonexistent')).toBeUndefined();
  });
});
