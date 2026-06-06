import type { GameState, NextState, StateContext } from '../core/state';

/** Dialog overlay — skeleton (commit 3). Logic filled in commit 4. */
export class DialogState implements GameState {
  readonly id = 'dialog' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): load demo script, init line index + char timer.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): type-out animation; Space/Enter advances.
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): draw dialog box + speaker + typed text.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
