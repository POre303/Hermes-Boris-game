import type { GameState, NextState, StateContext } from '../core/state';

/** Title screen — skeleton (commit 3). Logic filled in commit 4. */
export class TitleState implements GameState {
  readonly id = 'title' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): clear canvas, set up blink timer.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): animate "Press Space" blink at 0.5Hz.
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): draw "Hermes & Boris" + subtitle + blinking prompt.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
