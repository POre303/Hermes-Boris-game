import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import { QUIT_SENTINEL, type GameState, type NextState, type StateContext } from '../core/state';

const STORE_MENU_INDEX = 'menuIndex';
const MENU_ITEMS = ['New Game', 'Continue', 'Quit'] as const;

/** Main menu — 3 options: New Game / Continue / Quit. */
export class MainMenuState implements GameState {
  readonly id = 'main-menu' as const;

  enter(ctx: StateContext): void {
    ctx.store.set(STORE_MENU_INDEX, 0);
    const bg = ctx.palette[0] ?? '#000000';
    ctx.ctx2d.fillStyle = bg;
    ctx.ctx2d.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
  }

  update(ctx: StateContext, _dtMs: number): void {
    const i = (ctx.store.get(STORE_MENU_INDEX) as number | undefined) ?? 0;
    let next = i;
    if (ctx.input.consume('ArrowDown')) {
      next = (i + 1) % MENU_ITEMS.length;
    } else if (ctx.input.consume('ArrowUp')) {
      next = (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
    }
    ctx.store.set(STORE_MENU_INDEX, next);
  }

  render(ctx: StateContext): void {
    const i = (ctx.store.get(STORE_MENU_INDEX) as number | undefined) ?? 0;
    const fg = ctx.palette[1] ?? '#ffffff';
    const dim = ctx.palette[3] ?? '#7c7c7c';
    const sel = ctx.palette[4] ?? '#f83800';

    ctx.ctx2d.textAlign = 'center';
    ctx.ctx2d.textBaseline = 'middle';

    ctx.ctx2d.fillStyle = fg;
    ctx.ctx2d.font = 'bold 14px monospace';
    ctx.ctx2d.fillText('HERMES & BORIS', INTERNAL_WIDTH / 2, 50);

    for (let idx = 0; idx < MENU_ITEMS.length; idx++) {
      const y = 110 + idx * 30;
      const isSelected = idx === i;
      if (isSelected) {
        // Inverse-color bar behind selected item.
        ctx.ctx2d.fillStyle = sel;
        ctx.ctx2d.fillRect(120, y - 12, 240, 24);
        ctx.ctx2d.fillStyle = ctx.palette[0] ?? '#000000';
      } else {
        ctx.ctx2d.fillStyle = dim;
      }
      ctx.ctx2d.font = '12px monospace';
      ctx.ctx2d.fillText(MENU_ITEMS[idx] ?? '', INTERNAL_WIDTH / 2, y);
    }

    ctx.ctx2d.fillStyle = dim;
    ctx.ctx2d.font = '8px monospace';
    ctx.ctx2d.fillText('↑/↓: select    Enter: confirm', INTERNAL_WIDTH / 2, INTERNAL_HEIGHT - 12);
  }

  exit(ctx: StateContext): NextState {
    if (!ctx.input.consume('Enter') && !ctx.input.consume('Space')) {
      return null;
    }
    const i = (ctx.store.get(STORE_MENU_INDEX) as number | undefined) ?? 0;
    switch (i) {
      case 0:
        ctx.store.set('continueMode', false);
        return 'game';
      case 1:
        ctx.store.set('continueMode', true);
        return 'game';
      case 2:
        return QUIT_SENTINEL;
      default:
        return null;
    }
  }
}
