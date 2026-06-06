import type { GameState, NextState, StateContext } from '../core/state';

/** Main menu — skeleton (commit 3). Logic filled in commit 4. */
export class MainMenuState implements GameState {
  readonly id = 'main-menu' as const;

  enter(_ctx: StateContext): void {
    // TODO(commit-4): init menuIndex = 0 in store.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // TODO(commit-4): arrow keys move selection; Enter triggers transition.
  }

  render(_ctx: StateContext): void {
    // TODO(commit-4): draw 3 options (New Game / Continue / Quit) with highlight.
  }

  exit(_ctx: StateContext): NextState {
    return null;
  }
}
