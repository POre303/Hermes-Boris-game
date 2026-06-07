/**
 * Renderer-side save / load menu UI.
 *
 * A 5x2 grid of save slots. The host state (e.g. main-menu, menu-pause)
 * creates a `SaveMenuController`, feeds it the list of slots, and calls
 * `update()` / `render()` each frame. On `onSelect` / `onCancel` the
 * host dispatches the actual `window.save.write/read` call.
 *
 * The controller is intentionally headless: it doesn't open a new state
 * or call `window.save` directly. That keeps the unit test fast (no IPC
 * mocks) and lets the host wire the "what happens when the user picks
 * slot 3" decision.
 *
 * Hidden autosave slots (slot-0 + autosave-1/2/3) are exposed via a
 * separate `setAutosaves(...)` call so the user can load from a recent
 * scene autosave even in the load menu.
 *
 * Autosave toast: `flashToast('已自动存档', 2000)` overlays a centered
 * message for `ms` milliseconds, fading out in the last 400ms.
 */

import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { SaveSlotSummary } from '../../../shared/save-api';
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './screenshot';

export type SaveMenuMode = 'save' | 'load';

export interface SaveMenuState {
  readonly mode: SaveMenuMode;
  readonly slots: readonly SaveSlotSummary[];
  readonly autosaves: readonly SaveSlotSummary[];
  /** Currently highlighted slot index in the visible grid (0..9). */
  readonly selected: number;
  /** True if the host is showing the "confirm overwrite?" dialog. */
  readonly confirmOverwrite: boolean;
  /** True if the host is showing the "confirm load?" dialog. */
  readonly confirmLoad: boolean;
}

const GRID_COLS = 5;
const GRID_ROWS = 2;
const SLOT_COUNT = GRID_COLS * GRID_ROWS; // 10
const SLOT_PADDING = 8;
const HEADER_HEIGHT = 32;
const FOOTER_HEIGHT = 24;
const TOAST_DURATION_MS = 2000;
const TOAST_FADE_MS = 400;

const PALETTE_BG = '#101018';
const PALETTE_PANEL = '#1c1c28';
const PALETTE_BORDER = '#3a3a4a';
const PALETTE_BORDER_HIGHLIGHT = '#d4a04a';
const PALETTE_TEXT = '#fcfcfc';
const PALETTE_TEXT_DIM = '#888';
const PALETTE_EMPTY = '#2a2a3a';

export type SaveMenuCallback = (action: SaveMenuAction) => void;

export type SaveMenuAction =
  | { type: 'select'; slot: number }
  | { type: 'cancel' }
  | { type: 'confirm-overwrite'; slot: number }
  | { type: 'confirm-load'; slot: number };

/** Render context the controller needs from the host. */
export interface SaveMenuRenderContext {
  readonly ctx2d: CanvasRenderingContext2D;
  readonly palette: readonly string[];
  readonly isDown: (code: string) => boolean;
  readonly consume: (code: string) => boolean;
  readonly nowMs: number;
}

export class SaveMenuController {
  private mode: SaveMenuMode = 'save';
  private slots: readonly SaveSlotSummary[] = [];
  private autosaves: readonly SaveSlotSummary[] = [];
  private selected = 0;
  private confirmOverwrite = false;
  private confirmLoad = false;
  private toast: { text: string; startedAt: number; durationMs: number } | null = null;
  private readonly callback: SaveMenuCallback;

  constructor(callback: SaveMenuCallback) {
    this.callback = callback;
  }

  setMode(mode: SaveMenuMode): void {
    this.mode = mode;
    this.confirmOverwrite = false;
    this.confirmLoad = false;
    this.selected = 0;
  }

  setSlots(slots: readonly SaveSlotSummary[]): void {
    this.slots = slots;
  }

  setAutosaves(autosaves: readonly SaveSlotSummary[]): void {
    this.autosaves = autosaves;
  }

  /** Show a transient toast (used for "已自动存档" feedback). */
  flashToast(text: string, durationMs: number = TOAST_DURATION_MS): void {
    this.toast = { text, startedAt: performance.now(), durationMs };
  }

  getState(): SaveMenuState {
    return {
      mode: this.mode,
      slots: this.slots,
      autosaves: this.autosaves,
      selected: this.selected,
      confirmOverwrite: this.confirmOverwrite,
      confirmLoad: this.confirmLoad,
    };
  }

  update(rc: SaveMenuRenderContext): void {
    if (this.confirmOverwrite || this.confirmLoad) {
      if (rc.consume('Enter') || rc.consume('Space')) {
        if (this.confirmOverwrite) {
          this.confirmOverwrite = false;
          const slot = this.selected;
          this.callback({ type: 'confirm-overwrite', slot });
        } else if (this.confirmLoad) {
          this.confirmLoad = false;
          const slot = this.selected;
          this.callback({ type: 'confirm-load', slot });
        }
      } else if (rc.consume('Escape')) {
        this.confirmOverwrite = false;
        this.confirmLoad = false;
      }
      return;
    }

    if (rc.consume('Escape')) {
      this.callback({ type: 'cancel' });
      return;
    }
    if (rc.consume('ArrowLeft') && this.selected % GRID_COLS > 0) {
      this.selected -= 1;
    }
    if (rc.consume('ArrowRight') && this.selected % GRID_COLS < GRID_COLS - 1) {
      this.selected += 1;
    }
    if (rc.consume('ArrowUp') && this.selected >= GRID_COLS) {
      this.selected -= GRID_COLS;
    }
    if (rc.consume('ArrowDown') && this.selected < SLOT_COUNT - GRID_COLS) {
      this.selected += GRID_COLS;
    }
    if (rc.consume('Enter') || rc.consume('Space')) {
      this.callback({ type: 'select', slot: this.selected });
    }
  }

  render(rc: SaveMenuRenderContext): void {
    const { ctx2d: c } = rc;
    c.fillStyle = PALETTE_BG;
    c.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

    // Header
    c.fillStyle = PALETTE_TEXT;
    c.font = '12px monospace';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(this.mode === 'save' ? '> 存档' : '> 读档', SLOT_PADDING, SLOT_PADDING);

    // Grid
    const gridX = SLOT_PADDING;
    const gridY = HEADER_HEIGHT;
    const availableW = INTERNAL_WIDTH - SLOT_PADDING * 2;
    const availableH = INTERNAL_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - SLOT_PADDING;
    const cellW = Math.floor(availableW / GRID_COLS) - SLOT_PADDING;
    const cellH = Math.floor(availableH / GRID_ROWS) - SLOT_PADDING;

    for (let i = 0; i < SLOT_COUNT; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = gridX + col * (cellW + SLOT_PADDING);
      const y = gridY + row * (cellH + SLOT_PADDING);
      const summary = this.slots[i];
      this.renderCell(rc, x, y, cellW, cellH, i, summary);
    }

    // Autosave strip (above footer)
    this.renderAutosaveStrip(rc, gridX, gridY + (cellH + SLOT_PADDING) * GRID_ROWS, availableW);

    // Footer
    c.fillStyle = PALETTE_TEXT_DIM;
    c.font = '8px monospace';
    c.fillText(
      '方向键移动 / Enter 选择 / Esc 取消',
      SLOT_PADDING,
      INTERNAL_HEIGHT - FOOTER_HEIGHT + 4,
    );

    // Toast
    this.renderToast(rc);

    // Confirm dialog overlay
    if (this.confirmOverwrite) {
      this.renderConfirmDialog(rc, `覆盖 slot-${this.selected} ?`);
    } else if (this.confirmLoad) {
      this.renderConfirmDialog(rc, `读档 slot-${this.selected} ?`);
    }
  }

  /** Trigger the "are you sure?" dialog for a save. Called by host after select. */
  requestOverwriteConfirm(): void {
    this.confirmOverwrite = true;
  }

  /** Trigger the "are you sure?" dialog for a load. Called by host after select. */
  requestLoadConfirm(): void {
    this.confirmLoad = true;
  }

  private renderCell(
    rc: SaveMenuRenderContext,
    x: number,
    y: number,
    w: number,
    h: number,
    index: number,
    summary: SaveSlotSummary | undefined,
  ): void {
    const { ctx2d: c } = rc;
    const isSelected = index === this.selected;
    c.fillStyle = summary ? PALETTE_PANEL : PALETTE_EMPTY;
    c.fillRect(x, y, w, h);
    c.strokeStyle = isSelected ? PALETTE_BORDER_HIGHLIGHT : PALETTE_BORDER;
    c.lineWidth = isSelected ? 2 : 1;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Slot number badge
    c.fillStyle = isSelected ? PALETTE_BORDER_HIGHLIGHT : PALETTE_TEXT_DIM;
    c.font = '8px monospace';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(`#${index}`, x + 4, y + 4);

    if (summary) {
      // Thumbnail placeholder (gray block — real rendering uses an <img> if we
      // ever go HTML, but here in canvas we draw a stub). The full image is
      // fetched on demand in the host (window.save.readScreenshot).
      const thumbW = THUMBNAIL_WIDTH / 2; // half-size in the 480x270 canvas
      const thumbH = THUMBNAIL_HEIGHT / 2;
      const tx = x + 4;
      const ty = y + 18;
      c.fillStyle = '#000';
      c.fillRect(tx, ty, thumbW, thumbH);
      c.strokeStyle = PALETTE_BORDER;
      c.strokeRect(tx + 0.5, ty + 0.5, thumbW - 1, thumbH - 1);

      // Chapter / scene / time
      const textX = tx + thumbW + 6;
      c.fillStyle = PALETTE_TEXT;
      c.font = '8px monospace';
      const chapter = chapterLabel(summary.chapter);
      c.fillText(chapter, textX, ty);
      c.fillStyle = PALETTE_TEXT_DIM;
      c.fillText(summary.scene, textX, ty + 10);
      c.fillText(formatTime(summary.savedAt), textX, ty + 20);
    } else {
      c.fillStyle = PALETTE_TEXT_DIM;
      c.font = '8px monospace';
      c.fillText('(空)', x + w / 2 - 12, y + h / 2 - 4);
    }
  }

  private renderAutosaveStrip(rc: SaveMenuRenderContext, x: number, y: number, w: number): void {
    const { ctx2d: c } = rc;
    c.fillStyle = PALETTE_TEXT_DIM;
    c.font = '8px monospace';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('自动存档:', x, y);
    if (this.autosaves.length === 0) {
      c.fillText('(无)', x + 60, y);
      return;
    }
    for (let i = 0; i < Math.min(4, this.autosaves.length); i++) {
      const a = this.autosaves[i];
      if (!a) continue;
      const label = autosaveLabel(a);
      const ts = formatTime(a.savedAt);
      c.fillStyle = PALETTE_TEXT;
      c.fillText(`${label} ${chapterLabel(a.chapter)} ${ts}`, x + 60 + i * 90, y);
    }
  }

  private renderToast(rc: SaveMenuRenderContext): void {
    if (!this.toast) return;
    const elapsed = rc.nowMs - this.toast.startedAt;
    if (elapsed >= this.toast.durationMs) {
      this.toast = null;
      return;
    }
    const remaining = this.toast.durationMs - elapsed;
    const alpha = remaining < TOAST_FADE_MS ? remaining / TOAST_FADE_MS : 1;
    const { ctx2d: c } = rc;
    const text = this.toast.text;
    c.font = '10px monospace';
    // Estimate width from text length (no DOM measureText in headless tests).
    // 10px monospace → ~6px per CJK char, ~6px per ASCII char.
    const textWidth = text.length * 6;
    const w = textWidth + 24;
    const h = 24;
    const x = (INTERNAL_WIDTH - w) / 2;
    const y = INTERNAL_HEIGHT - 60;
    c.fillStyle = `rgba(28, 28, 40, ${0.8 * alpha})`;
    c.fillRect(x, y, w, h);
    c.strokeStyle = `rgba(212, 160, 74, ${alpha})`;
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.fillStyle = `rgba(252, 252, 252, ${alpha})`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x + w / 2, y + h / 2 + 1);
  }

  private renderConfirmDialog(rc: SaveMenuRenderContext, prompt: string): void {
    const { ctx2d: c } = rc;
    c.fillStyle = 'rgba(0, 0, 0, 0.6)';
    c.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    const w = 200;
    const h = 60;
    const x = (INTERNAL_WIDTH - w) / 2;
    const y = (INTERNAL_HEIGHT - h) / 2;
    c.fillStyle = PALETTE_PANEL;
    c.fillRect(x, y, w, h);
    c.strokeStyle = PALETTE_BORDER_HIGHLIGHT;
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = PALETTE_TEXT;
    c.font = '10px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(prompt, x + w / 2, y + 22);
    c.fillStyle = PALETTE_TEXT_DIM;
    c.font = '8px monospace';
    c.fillText('Enter 确认 / Esc 取消', x + w / 2, y + 44);
  }
}

const chapterLabel = (c: SaveSlotSummary['chapter']): string => {
  if (c === 'prologue') return '序章';
  if (c === 'epilogue') return '尾声';
  if (c === 'ending') return '结局';
  return `第 ${c} 章`;
};

const formatTime = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const autosaveLabel = (s: SaveSlotSummary): string => {
  if (typeof s.id === 'string') return s.id;
  return `slot-${s.id}`;
};
