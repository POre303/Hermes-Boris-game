import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';

/**
 * Pause overlay. The previous state's frame is NOT preserved (this is a peer
 * state, not a stack overlay), so the pause screen is drawn on a clean black
 * background. The "pause" affordance is the lack of game input.
 */
export class MenuPauseState implements GameState {
  readonly id = 'menu-pause' as const;

  enter(_ctx: StateContext): void {
    // No setup needed.
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // No animation in this milestone.
  }

  render(ctx: StateContext): void {
    const bg = ctx.palette[0] ?? '#000000';
    const fg = ctx.palette[1] ?? '#ffffff';
    const dim = ctx.palette[3] ?? '#7c7c7c';

    const c = ctx.ctx2d;
    c.fillStyle = bg;
    c.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    c.textAlign = 'center';
    c.textBaseline = 'middle';

    c.fillStyle = fg;
    c.font = 'bold 24px monospace';
    c.fillText('PAUSED', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 20);

    c.fillStyle = dim;
    c.font = '10px monospace';
    c.fillText('ESC / SPACE / ENTER to resume', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 20);
  }

  exit(ctx: StateContext): NextState {
    if (
      ctx.input.consume('Escape') ||
      ctx.input.consume('Space') ||
      ctx.input.consume('Enter')
    ) {
      return 'game';
    }
    return null;
  }
}
