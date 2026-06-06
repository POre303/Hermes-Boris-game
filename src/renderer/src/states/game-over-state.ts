import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';

const STORE_GAMEOVER_TIMER = 'gameOverTimer';
const BLINK_PERIOD_MS = 500;

/** Game-over screen with a blinking "return to menu" prompt. */
export class GameOverState implements GameState {
  readonly id = 'game-over' as const;

  enter(ctx: StateContext): void {
    ctx.store.set(STORE_GAMEOVER_TIMER, 0);
  }

  update(ctx: StateContext, dtMs: number): void {
    const prev = (ctx.store.get(STORE_GAMEOVER_TIMER) as number | undefined) ?? 0;
    ctx.store.set(STORE_GAMEOVER_TIMER, (prev + dtMs) % (BLINK_PERIOD_MS * 2));
  }

  render(ctx: StateContext): void {
    const blinkMs = (ctx.store.get(STORE_GAMEOVER_TIMER) as number | undefined) ?? 0;
    const visible = blinkMs < BLINK_PERIOD_MS;

    const c = ctx.ctx2d;
    const bg = ctx.palette[0] ?? '#000000';
    const darkRed = ctx.palette[5] ?? '#a40020';
    const fg = ctx.palette[1] ?? '#ffffff';
    const dim = ctx.palette[3] ?? '#7c7c7c';

    c.fillStyle = bg;
    c.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    c.textAlign = 'center';
    c.textBaseline = 'middle';

    c.fillStyle = darkRed;
    c.font = 'bold 28px monospace';
    c.fillText('GAME OVER', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 30);

    if (visible) {
      c.fillStyle = fg;
      c.font = '12px monospace';
      c.fillText('Press SPACE to return to menu', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 20);
    }

    c.fillStyle = dim;
    c.font = '8px monospace';
    c.fillText('ESC: back to title', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT - 12);
  }

  exit(ctx: StateContext): NextState {
    if (ctx.input.consume('Space') || ctx.input.consume('Enter')) {
      return 'main-menu';
    }
    if (ctx.input.consume('Escape')) {
      return 'title';
    }
    return null;
  }
}
