/**
 * Public puzzle system surface. The dialog state imports only this file
 * (and the bootstrap registers the puzzles once at app boot).
 */
export {
  registerPuzzle,
  getPuzzle,
  trySolve,
  puzzleCount,
  __resetRegistry,
} from './registry';
export { registerSprintPuzzles } from './bootstrap';
export type {
  Puzzle,
  PuzzleLevel,
  PuzzleType,
  PuzzleInput,
  SolveResult,
  SceneTransition,
  ColorSequenceSolution,
  CollectItemsSolution,
  SequenceOrderSolution,
} from './types';
export { l1Puzzle, l2Puzzle } from './types';
export {
  getActivePuzzleId,
  setActivePuzzleId,
  isPuzzleSolved,
  markPuzzleSolved,
  primeL2Inventory,
  handleActivePuzzleInput,
  renderActivePuzzle,
} from './ui/puzzleOverlay';
