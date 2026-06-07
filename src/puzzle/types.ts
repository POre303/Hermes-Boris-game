/**
 * Puzzle system types — see `docs/dev-plan-full.md` §3.4.
 *
 * Sprint-week1 ships L1 (color sequence) + L2 (collect items) solvers.
 * L3 (sequence order) is intentionally not implemented in this milestone.
 *
 * Path: src/puzzle/ is a sibling of src/renderer/, src/shared/.
 * Importing from `src/renderer/src/states/*.ts` needs `../../../../puzzle/...`.
 */

export type PuzzleLevel = 1 | 2 | 3;
export type PuzzleType = 'L1' | 'L2' | 'L3';

/** A description of where the puzzle solves to, used by the scene driver. */
export interface SceneTransition {
  /** Target scene id within the current chapter. */
  readonly nextScene: string;
  /** Optional human-readable caption shown on transition. */
  readonly caption?: string;
}

/**
 * L1 = observation-only (color sequence, text order). No inventory needed.
 * L2 = collection — requires the player to have picked up `required` item ids.
 * L3 = ordered sequence (e.g. film frames). Not implemented in sprint-week1.
 */
export type Solution<L extends PuzzleLevel> = L extends 1
  ? ColorSequenceSolution
  : L extends 2
    ? CollectItemsSolution
    : SequenceOrderSolution;

export interface ColorSequenceSolution {
  readonly kind: 'color_sequence';
  /** Expected ordered list of palette color keys (e.g. "red", "white", "blue", "yellow"). */
  readonly sequence: readonly string[];
}

export interface CollectItemsSolution {
  readonly kind: 'collect_items';
  /** Item ids the player must have collected. Order-agnostic; duplicates are not expected. */
  readonly required: readonly string[];
}

export interface SequenceOrderSolution {
  readonly kind: 'sequence_order';
  /** Expected ordering of opaque tokens. */
  readonly order: readonly string[];
}

/** Per-level input shape fed into `trySolve`. */
export type PuzzleInput<L extends PuzzleLevel> = L extends 1
  ? { readonly sequence: readonly string[] }
  : L extends 2
    ? { readonly inventory: readonly string[] }
    : { readonly order: readonly string[] };

/** A registered puzzle definition. Lives in the registry. */
export interface Puzzle<L extends PuzzleLevel = PuzzleLevel> {
  readonly id: string;
  /** Chapter this puzzle belongs to. Use 0 to mean "prologue" in sprint scripts. */
  readonly chapter: 0 | 1 | 2 | 3;
  readonly type: PuzzleType;
  /** One-sentence in-game hint shown to the player. */
  readonly hint: string;
  readonly solution: Solution<L>;
  /** Optional hook fired on successful solve. May transition the scene. */
  readonly onSolve?: () => SceneTransition | null;
}

/** Result returned by `trySolve`. */
export type SolveResult =
  | { readonly ok: true; readonly nextScene: SceneTransition | null }
  | { readonly ok: false; readonly reason: 'wrong' | 'incomplete' | 'invalid-state' };

/** Convenience constructor for L1 puzzles. */
export const l1Puzzle = (p: Omit<Puzzle<1>, 'type'>): Puzzle<1> => ({ ...p, type: 'L1' });

/** Convenience constructor for L2 puzzles. */
export const l2Puzzle = (p: Omit<Puzzle<2>, 'type'>): Puzzle<2> => ({ ...p, type: 'L2' });
