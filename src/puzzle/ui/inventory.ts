import type { StateContext } from '../../renderer/src/core/state';
import { drawInventoryGrid } from '../../ui/inventory';

/**
 * L2 puzzle overlay: a 5×2 inventory grid with an "examine each item, then
 * confirm" flow. The player can page through cells and read short flavor
 * text per item; pressing Enter submits the current inventory.
 *
 * Sprint-week1 ships the inventory as **pre-collected**: the chapter
 * script hands the player a fixed set of items and the puzzle validates
 * that the right set is in hand. The full "pick up an item from a scene
 * hot-spot" interaction lands in D3+ along with the scene hot-spot system.
 */

const STORE_INVENTORY = 'puzzleL2Inventory';
const STORE_SELECTION = 'puzzleL2Selection';

export const readL2Inventory = (ctx: StateContext): string[] => {
  const raw = ctx.store.get(STORE_INVENTORY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
};

export const writeL2Inventory = (ctx: StateContext, items: readonly string[]): void => {
  ctx.store.set(STORE_INVENTORY, [...items]);
};

export const readL2Selection = (ctx: StateContext): number => {
  const raw = ctx.store.get(STORE_SELECTION);
  return typeof raw === 'number' ? raw : 0;
};

const writeL2Selection = (ctx: StateContext, idx: number): void => {
  ctx.store.set(STORE_SELECTION, idx);
};

export const handleL2InventoryInput = (
  ctx: StateContext,
): { selected: number; items: string[] } => {
  const items = readL2Inventory(ctx);
  const selected = readL2Selection(ctx);

  if (ctx.input.consume('ArrowRight')) {
    writeL2Selection(ctx, Math.min(items.length - 1, selected + 1));
  } else if (ctx.input.consume('ArrowLeft')) {
    writeL2Selection(ctx, Math.max(0, selected - 1));
  }

  return { selected: readL2Selection(ctx), items };
};

export const renderL2Inventory = (ctx: StateContext, hint: string, expectedCount: number): void => {
  const c = ctx.ctx2d;
  const bg = ctx.palette[0] ?? '#000000';
  const fg = ctx.palette[1] ?? '#ffffff';
  const dim = ctx.palette[3] ?? '#7c7c7c';
  const accent = ctx.palette[4] ?? '#f83800';

  const items = readL2Inventory(ctx);
  const selected = readL2Selection(ctx);

  // Dim background.
  c.fillStyle = bg;
  c.fillRect(0, 0, 480, 195);

  // Title + hint.
  c.fillStyle = fg;
  c.font = 'bold 12px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillText('收集品', 240, 8);

  c.fillStyle = dim;
  c.font = '8px monospace';
  c.fillText(`${items.length}/${expectedCount}  ENTER: confirm   ←/→: select`, 240, 26);

  c.fillStyle = accent;
  c.font = '10px monospace';
  c.fillText(hint, 240, 44);

  // Reuse the generic 5×2 grid renderer.
  drawInventoryGrid(c, ctx.palette, items);

  // Highlight the selected cell.
  if (selected >= 0 && selected < items.length) {
    const col = selected % 5;
    const row = Math.floor(selected / 5);
    const originX = 480 - 4 - 5 * (32 + 2) + 2;
    const originY = 4 + 2;
    const x = originX + col * (32 + 2) - 2;
    const y = originY + row * (32 + 2) - 2;
    c.strokeStyle = accent;
    c.lineWidth = 2;
    c.strokeRect(x - 0.5, y - 0.5, 32 + 3, 32 + 3);
  }
};
