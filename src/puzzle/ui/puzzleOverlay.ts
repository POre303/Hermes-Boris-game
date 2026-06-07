import type { StateContext } from '../../renderer/src/core/state';
import { getPuzzle, trySolve } from '../registry';
import { handleColorPickerInput, readColorPickerInput, renderColorPicker } from './colorPicker';
import {
  handleL2InventoryInput,
  readL2Inventory,
  renderL2Inventory,
  writeL2Inventory,
} from './inventory';
import type { PuzzleType } from '../types';

/**
 * High-level glue that the dialog state calls when an `activePuzzleId` is
 * in the store. Routes to colorPicker (L1) or inventory (L2) based on the
 * registered puzzle's `type`.
 *
 * Storage convention:
 *   - `activePuzzleId`  : string | undefined
 *   - `puzzleInput_<id>`: the per-puzzle working input (L1 sequence, etc.)
 *   - `puzzleL2Inventory`: the L2 inventory list
 *
 * On a successful `trySolve`, the overlay clears `activePuzzleId` and
 * the dialog state's exit() can resume normal line-by-line advancement.
 */

const STORE_ACTIVE = 'activePuzzleId';
const STORE_SOLVED = 'puzzleSolved';

export const getActivePuzzleId = (ctx: StateContext): string | undefined => {
  const v = ctx.store.get(STORE_ACTIVE);
  return typeof v === 'string' ? v : undefined;
};

export const setActivePuzzleId = (ctx: StateContext, id: string | undefined): void => {
  if (id === undefined) {
    ctx.store.delete(STORE_ACTIVE);
  } else {
    ctx.store.set(STORE_ACTIVE, id);
  }
};

export const markPuzzleSolved = (ctx: StateContext, id: string): void => {
  const raw = ctx.store.get(STORE_SOLVED);
  const set = raw instanceof Set ? raw : new Set<string>();
  set.add(id);
  ctx.store.set(STORE_SOLVED, set);
};

export const isPuzzleSolved = (ctx: StateContext, id: string): boolean => {
  const raw = ctx.store.get(STORE_SOLVED);
  return raw instanceof Set && raw.has(id);
};

/** Prime the L2 inventory for a puzzle (called by the dialog state when
 *  the puzzle marker is first seen). Sprint-week1: hardcode the pre-collected
 *  item set from the puzzle's `solution.required`. */
export const primeL2Inventory = (ctx: StateContext, puzzleId: string): void => {
  const p = getPuzzle(puzzleId);
  if (!p || p.type !== 'L2') return;
  const sol = p.solution as { kind: 'collect_items'; required: readonly string[] };
  if (sol.kind === 'collect_items') {
    writeL2Inventory(ctx, sol.required);
  }
};

/** Frame-by-frame input + state-update for the active puzzle.
 *  Returns true if a solve was achieved this frame (caller should
 *  clear `activePuzzleId` and advance the dialog). */
export const handleActivePuzzleInput = (ctx: StateContext): boolean => {
  const id = getActivePuzzleId(ctx);
  if (!id) return false;
  const p = getPuzzle(id);
  if (!p) return false;

  if (p.type === 'L1') {
    handleColorPickerInput(ctx, id);
    if (ctx.input.consume('Enter') || ctx.input.consume('Space')) {
      const sequence = readColorPickerInput(ctx, id);
      const result = trySolve(id, { sequence });
      if (result.ok) {
        markPuzzleSolved(ctx, id);
        setActivePuzzleId(ctx, undefined);
        return true;
      }
    }
  } else if (p.type === 'L2') {
    handleL2InventoryInput(ctx);
    if (ctx.input.consume('Enter') || ctx.input.consume('Space')) {
      const inventory = readL2Inventory(ctx);
      const result = trySolve(id, { inventory });
      if (result.ok) {
        markPuzzleSolved(ctx, id);
        setActivePuzzleId(ctx, undefined);
        return true;
      }
    }
  }
  return false;
};

/** Render the active puzzle overlay. No-op if no puzzle is active. */
export const renderActivePuzzle = (ctx: StateContext): void => {
  const id = getActivePuzzleId(ctx);
  if (!id) return;
  const p = getPuzzle(id);
  if (!p) return;

  if (p.type === 'L1') {
    const sol = p.solution as { kind: 'color_sequence'; sequence: readonly string[] };
    renderColorPicker(ctx, id, p.hint, sol.sequence.length);
  } else if (p.type === 'L2') {
    const sol = p.solution as { kind: 'collect_items'; required: readonly string[] };
    renderL2Inventory(ctx, p.hint, sol.required.length);
  }
};

export const __puzzleOverlayStoreKeys = {
  ACTIVE: STORE_ACTIVE,
  SOLVED: STORE_SOLVED,
} as const;

export type { PuzzleType };
