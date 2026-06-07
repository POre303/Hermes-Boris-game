import demoScriptJson from '../../../../assets/text/demo-script.json';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';
import {
  getActivePuzzleId,
  handleActivePuzzleInput,
  isPuzzleSolved,
  primeL2Inventory,
  registerSprintPuzzles,
  renderActivePuzzle,
  setActivePuzzleId,
} from '../../../puzzle';

type ScriptLine = { speaker: string; text: string; puzzle?: string };

const SCRIPT: readonly ScriptLine[] = demoScriptJson as ScriptLine[];

const STORE_LINE_INDEX = 'dialogLineIndex';
const DIALOG_BOX_X = 0;
const DIALOG_BOX_Y = 195;
const DIALOG_BOX_W = INTERNAL_WIDTH;
const DIALOG_BOX_H = INTERNAL_HEIGHT - DIALOG_BOX_Y;
const PUZZLE_MARKER_RE = /\[puzzle:([a-z0-9_]+)\]/i;

// One-time hydration of the puzzle registry. Safe to call multiple times —
// the registry itself is module-level state, so the bootstrap function is
// effectively idempotent only if puzzles are not re-registered under the
// same id. We use a module-level flag to avoid double-registration on
// hot-reload during dev.
let bootstrapped = false;
const ensureBootstrapped = (): void => {
  if (bootstrapped) return;
  registerSprintPuzzles();
  bootstrapped = true;
};

/** Dialog overlay — bottom-of-screen box with speaker + text, with optional
 *  puzzle overlay (L1 color picker or L2 inventory) triggered by markers. */
export class DialogState implements GameState {
  readonly id = 'dialog' as const;

  private lastRenderedIndex = -1;

  enter(ctx: StateContext): void {
    ensureBootstrapped();
    ctx.store.set(STORE_LINE_INDEX, 0);
    this.lastRenderedIndex = -1;
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // Type-out animation deferred to a future commit; we show the full line.
  }

  render(ctx: StateContext): void {
    const i = (ctx.store.get(STORE_LINE_INDEX) as number | undefined) ?? 0;
    if (i !== this.lastRenderedIndex) {
      this.lastRenderedIndex = i;
      this.activatePuzzleForLine(ctx, i);
    }
    const line = SCRIPT[i] ?? { speaker: '', text: '' };

    const c = ctx.ctx2d;
    const bg = ctx.palette[0] ?? '#000000';
    const fg = ctx.palette[1] ?? '#ffffff';
    const dim = ctx.palette[3] ?? '#7c7c7c';
    const name = ctx.palette[4] ?? '#f83800';

    // Dim the scene behind the dialog box.
    c.fillStyle = bg;
    c.fillRect(0, 0, INTERNAL_WIDTH, DIALOG_BOX_Y);

    // Dialog box.
    c.fillStyle = bg;
    c.fillRect(DIALOG_BOX_X, DIALOG_BOX_Y, DIALOG_BOX_W, DIALOG_BOX_H);
    c.strokeStyle = fg;
    c.lineWidth = 1;
    c.strokeRect(DIALOG_BOX_X + 0.5, DIALOG_BOX_Y + 0.5, DIALOG_BOX_W - 1, DIALOG_BOX_H - 1);

    c.textBaseline = 'top';
    c.textAlign = 'left';

    // Speaker name (12px = 1:1 with font source, pixel-perfect).
    c.fillStyle = name;
    c.font = 'bold 12px "fusion-pixel", monospace';
    c.fillText(line.speaker, 8, DIALOG_BOX_Y + 4);

    // Text body. Word-wrap on whitespace; Chinese chars count as 1 word each
    // and break anywhere. 12px CJK = ~12px wide, 36 chars ≈ 432px, fits in
    // 480px canvas with 8px padding either side.
    c.fillStyle = fg;
    c.font = '12px "fusion-pixel", monospace';
    const lines = wrapText(stripPuzzleMarker(line.text), 36);
    let y = DIALOG_BOX_Y + 22;
    for (const ln of lines) {
      c.fillText(ln, 8, y);
      y += 14;
    }

    // Advance prompt (8px for compact UI text).
    c.fillStyle = dim;
    c.textAlign = 'right';
    c.font = '8px "fusion-pixel", monospace';
    const advance = getActivePuzzleId(ctx) ? '(solve the puzzle ↑)' : '(SPACE/ENTER)';
    c.fillText(
      `▶ (${i + 1}/${SCRIPT.length}) ${advance}`,
      INTERNAL_WIDTH - 8,
      INTERNAL_HEIGHT - 10,
    );

    // Puzzle overlay (L1 picker or L2 inventory) drawn on top of the scene
    // area (above the dialog box) when active.
    renderActivePuzzle(ctx);
  }

  exit(ctx: StateContext): NextState {
    ensureBootstrapped();

    // If a puzzle is active, route input to it. Don't advance dialog.
    if (getActivePuzzleId(ctx)) {
      const solvedThisFrame = handleActivePuzzleInput(ctx);
      if (solvedThisFrame) {
        // Puzzle cleared; keep current line index so the player can read
        // the post-solve line, then press Space/Enter to advance.
      }
      return null;
    }

    if (!ctx.input.consume('Space') && !ctx.input.consume('Enter')) {
      return null;
    }
    const i = (ctx.store.get(STORE_LINE_INDEX) as number | undefined) ?? 0;
    if (i + 1 >= SCRIPT.length) {
      return 'game';
    }
    ctx.store.set(STORE_LINE_INDEX, i + 1);
    return null;
  }

  /** If the line at `idx` declares a puzzle, set it active. No-op when the
   *  puzzle is already solved. */
  private activatePuzzleForLine(ctx: StateContext, idx: number): void {
    const line = SCRIPT[idx];
    if (!line) return;
    const id = line.puzzle ?? extractPuzzleMarker(line.text);
    if (!id) return;
    if (isPuzzleSolved(ctx, id)) return;
    primeL2Inventory(ctx, id);
    setActivePuzzleId(ctx, id);
  }
}

/** Wrap a string into lines that fit within `maxChars` columns. */
const wrapText = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];
  const lines: string[] = [];
  let buf = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
    if (buf.length >= maxChars) {
      lines.push(buf);
      buf = '';
    }
  }
  if (buf.length > 0) lines.push(buf);
  return lines;
};

/** Pull the [puzzle:id] marker out of a dialog line. */
const extractPuzzleMarker = (text: string): string | undefined => {
  const m = text.match(PUZZLE_MARKER_RE);
  return m?.[1];
};

/** Remove the [puzzle:id] marker from a dialog line for display. */
const stripPuzzleMarker = (text: string): string => text.replace(PUZZLE_MARKER_RE, '').trim();
