import type { CollectItemsSolution, SolveResult } from '../types';

/**
 * L2 solver: validate that the player's inventory contains exactly the
 * `required` set (set equality — no more, no less, order-agnostic).
 *
 * Returns `incomplete` when the inventory is missing one or more required
 * items (player must go collect more). Returns `wrong` when the inventory
 * contains items not in the required set (over-collected, e.g. picked up
 * the wrong thing). Returns `ok: true` on exact set match.
 *
 * Duplicates in either side are folded via Set semantics — required is
 * a set spec, and a player carrying the same item id twice still counts
 * as "has it".
 */
export const solveCollectItems = (
  solution: CollectItemsSolution,
  userInput: readonly string[],
): SolveResult => {
  const required = new Set(solution.required);
  const have = new Set(userInput);

  if (have.size < required.size) {
    return { ok: false, reason: 'incomplete' };
  }

  for (const id of have) {
    if (!required.has(id)) {
      return { ok: false, reason: 'wrong' };
    }
  }

  for (const id of required) {
    if (!have.has(id)) {
      return { ok: false, reason: 'incomplete' };
    }
  }

  return { ok: true, nextScene: null };
};
