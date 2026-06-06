import type { GameState, NextState, StateContext } from '../core/state';

/** Game-over screen — skeleton (commit 3). Logic filled in commit 4. */
export class GameOverState implements GameState {
  readonly id = 'game-over' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): set up gameOverTimer in store.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): tick timer (for blink animation).
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): draw "GAME OVER" + return-to-menu prompt.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
