import type { GameState, NextState, StateContext } from '../core/state';

/** In-game scene — skeleton (commit 3). Logic filled in commit 4. */
export class GameStateImpl implements GameState {
  readonly id = 'game' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): init gameClock, prepare scene.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): tick clock; trigger dialog at scripted beats.
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): draw sky strip, ground rect, player sprite placeholder.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
