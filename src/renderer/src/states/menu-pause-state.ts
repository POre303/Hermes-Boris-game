import type { GameState, NextState, StateContext } from '../core/state';

/** Pause overlay — skeleton (commit 3). Logic filled in commit 4. */
export class MenuPauseState implements GameState {
  readonly id = 'menu-pause' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): no-op (game state is preserved in machine).
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): no-op.
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): semi-transparent black overlay + "PAUSED" + resume hint.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
