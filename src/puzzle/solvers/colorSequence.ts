import type { ColorSequenceSolution, SolveResult } from '../types';

/**
 * L1 solver: validate a user-supplied color sequence against the puzzle's
 * expected sequence. The two arrays must have the same length AND identical
 * entries in the same order. No partial credit, no fuzzy match — observation
 * puzzles are about getting it exactly right.
 *
 * Returns `incomplete` when the user has not selected enough colors yet
 * (so the UI knows to keep the picker open). Returns `wrong` on a mismatch
 * (so the UI can re-prompt). Returns `ok: true` on a full match.
 *
 * Out-of-range / unknown color tokens are treated as `wrong` (not an
 * invalid-state exception) because the UI only ever produces known tokens.
 */
export const solveColorSequence = (
  solution: ColorSequenceSolution,
  userInput: readonly string[],
): SolveResult => {
  if (userInput.length < solution.sequence.length) {
    return { ok: false, reason: 'incomplete' };
  }
  for (let i = 0; i < solution.sequence.length; i++) {
    if (userInput[i] !== solution.sequence[i]) {
      return { ok: false, reason: 'wrong' };
    }
  }
  if (userInput.length > solution.sequence.length) {
    return { ok: false, reason: 'wrong' };
  }
  return { ok: true, nextScene: null };
};
