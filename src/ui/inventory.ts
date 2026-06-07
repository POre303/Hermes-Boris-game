import { INTERNAL_WIDTH } from '../shared/constants';

/**
 * Generic 5×2 inventory grid renderer.
 *
 * Renders 10 cells of 32×32 px each, in a single row at the bottom-right of
 * the 480×270 canvas. Cells are 1px-outlined and show a short item label
 * centered (1-2 chars in 8px monospace — full word would overflow at 32px).
 *
 * Empty cells are dimmed; occupied cells use the accent color as the border.
 * For sprint-week1 the "icon" is just the first 1-2 characters of the item id
 * (no sprite assets yet). The full sprite system is D3+ (see CLAUDE.md
 * "16-bit 像素"约束).
 */
export const INVENTORY_COLS = 5;
export const INVENTORY_ROWS = 2;
export const INVENTORY_CELL_PX = 32;
export const INVENTORY_CELL_GAP = 2;
const INVENTORY_PADDING = 4;

export const drawInventoryGrid = (
  ctx2d: CanvasRenderingContext2D,
  palette: readonly string[],
  items: readonly string[],
): void => {
  const bg = palette[0] ?? '#000000';
  const fg = palette[1] ?? '#ffffff';
  const dim = palette[3] ?? '#7c7c7c';
  const accent = palette[4] ?? '#f83800';

  const gridW = INVENTORY_COLS * (INVENTORY_CELL_PX + INVENTORY_CELL_GAP) - INVENTORY_CELL_GAP;
  const gridH = INVENTORY_ROWS * (INVENTORY_CELL_PX + INVENTORY_CELL_GAP) - INVENTORY_CELL_GAP;
  const originX = INTERNAL_WIDTH - INVENTORY_PADDING - gridW;
  const originY = INVENTORY_PADDING;

  for (let row = 0; row < INVENTORY_ROWS; row++) {
    for (let col = 0; col < INVENTORY_COLS; col++) {
      const idx = row * INVENTORY_COLS + col;
      const x = originX + col * (INVENTORY_CELL_PX + INVENTORY_CELL_GAP);
      const y = originY + row * (INVENTORY_CELL_PX + INVENTORY_CELL_GAP);

      ctx2d.fillStyle = bg;
      ctx2d.fillRect(x, y, INVENTORY_CELL_PX, INVENTORY_CELL_PX);
      ctx2d.strokeStyle = idx < items.length ? accent : dim;
      ctx2d.lineWidth = 1;
      ctx2d.strokeRect(x + 0.5, y + 0.5, INVENTORY_CELL_PX - 1, INVENTORY_CELL_PX - 1);

      if (idx < items.length) {
        const itemId = items[idx] ?? '';
        const label = itemId.length <= 2 ? itemId : itemId.slice(0, 2);
        ctx2d.fillStyle = fg;
        ctx2d.font = '8px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(label, x + INVENTORY_CELL_PX / 2, y + INVENTORY_CELL_PX / 2);
      }
    }
  }
};
