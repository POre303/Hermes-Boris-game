import type { Puzzle, PuzzleInput, SolveResult } from './types';
import { solveColorSequence } from './solvers/colorSequence';
import { solveCollectItems } from './solvers/collectItems';

/**
 * Discriminated union of all possible puzzle inputs. The solver dispatches
 * based on the registered puzzle's `type`, not on the input shape.
 */
export type AnyPuzzleInput =
  | { readonly sequence: readonly string[] }
  | PuzzleInput<2>
  | PuzzleInput<3>;

/**
 * In-memory registry mapping puzzle id → Puzzle. Sprint-week1 hydrates this
 * from `bootstrap.ts` (hardcoded). Once YAML scripts land (D3+), the
 * bootstrap will read the YAML loader and call `registerPuzzle` for each
 * entry — the storage shape stays the same.
 */
const REGISTRY = new Map<string, Puzzle>();

/** Register a puzzle. Throws on duplicate id so misconfigured YAML fails fast. */
export const registerPuzzle = (p: Puzzle): void => {
  if (REGISTRY.has(p.id)) {
    throw new Error(`Puzzle id already registered: ${p.id}`);
  }
  REGISTRY.set(p.id, p);
};

/** Lookup by id. Returns undefined when not registered. */
export const getPuzzle = (id: string): Puzzle | undefined => REGISTRY.get(id);

/** Number of puzzles currently registered. Useful for tests. */
export const puzzleCount = (): number => REGISTRY.size;

/** Reset the registry. Test-only — never call from runtime code. */
export const __resetRegistry = (): void => {
  REGISTRY.clear();
};

/**
 * Dispatch a solve attempt to the right solver based on the puzzle's level.
 * Returns `{ ok: false, reason: 'invalid-state' }` if the id is unknown.
 */
export const trySolve = (id: string, input: AnyPuzzleInput): SolveResult => {
  const p = REGISTRY.get(id);
  if (!p) {
    return { ok: false, reason: 'invalid-state' };
  }
  switch (p.type) {
    case 'L1': {
      const seq = 'sequence' in input ? input.sequence : [];
      return solveColorSequence(
        p.solution as { kind: 'color_sequence'; sequence: readonly string[] },
        seq,
      );
    }
    case 'L2': {
      const inv = 'inventory' in input ? input.inventory : [];
      return solveCollectItems(
        p.solution as { kind: 'collect_items'; required: readonly string[] },
        inv,
      );
    }
    case 'L3':
      // L3 is intentionally not implemented in sprint-week1. Refuse loudly.
      return { ok: false, reason: 'invalid-state' };
  }
};
