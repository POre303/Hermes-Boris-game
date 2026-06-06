import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';

const STORE_BLINK = 'titleBlinkMs';
const BLINK_PERIOD_MS = 500;

/**
 * Title screen. Renders "Hermes & Boris" with a blinking "Press SPACE to start" prompt.
 * Text uses monospace font; bitmap pixel font is a future enhancement (TODO).
 */
export class TitleState implements GameState {
  readonly id = 'title' as const;

  enter(ctx: StateContext): void {
    ctx.store.set(STORE_BLINK, 0);
    const bg = ctx.palette[0] ?? '#000000';
    ctx.ctx2d.fillStyle = bg;
    ctx.ctx2d.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  }

  update(ctx: StateContext, dtMs: number): void {
    const prev = (ctx.store.get(STORE_BLINK) as number | undefined) ?? 0;
    ctx.store.set(STORE_BLINK, (prev + dtMs) % (BLINK_PERIOD_MS * 2));
  }

  render(ctx: StateContext): void {
    const blinkMs = (ctx.store.get(STORE_BLINK) as number | undefined) ?? 0;
    const visible = blinkMs < BLINK_PERIOD_MS;
    const fg = ctx.palette[1] ?? '#ffffff';
    const dim = ctx.palette[3] ?? '#7c7c7c';

    ctx.ctx2d.textAlign = 'center';
    ctx.ctx2d.textBaseline = 'middle';

    ctx.ctx2d.fillStyle = fg;
    ctx.ctx2d.font = 'bold 20px monospace';
    ctx.ctx2d.fillText('Hermes & Boris', INTERNAL_WIDTH / 2, 80);

    ctx.ctx2d.fillStyle = dim;
    ctx.ctx2d.font = '10px monospace';
    ctx.ctx2d.fillText('— A Pixel Visual Novel —', INTERNAL_WIDTH / 2, 110);

    if (visible) {
      ctx.ctx2d.fillStyle = fg;
      ctx.ctx2d.font = '12px monospace';
      ctx.ctx2d.fillText('Press SPACE to start', INTERNAL_WIDTH / 2, 200);
    }

    // Footer hint.
    ctx.ctx2d.fillStyle = dim;
    ctx.ctx2d.font = '8px monospace';
    ctx.ctx2d.fillText('© 2026 Vues', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT - 8);
  }

  exit(ctx: StateContext): NextState {
    if (ctx.input.consume('Space') || ctx.input.consume('Enter')) {
      return 'main-menu';
    }
    return null;
  }
}
