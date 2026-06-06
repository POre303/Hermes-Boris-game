import demoScriptJson from '../../../../assets/text/demo-script.json';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';

type ScriptLine = { speaker: string; text: string };

const SCRIPT: readonly ScriptLine[] = demoScriptJson as ScriptLine[];

const STORE_LINE_INDEX = 'dialogLineIndex';
const DIALOG_BOX_X = 0;
const DIALOG_BOX_Y = 195;
const DIALOG_BOX_W = INTERNAL_WIDTH;
const DIALOG_BOX_H = INTERNAL_HEIGHT - DIALOG_BOX_Y;

/** Dialog overlay — bottom-of-screen box with speaker + text. */
export class DialogState implements GameState {
  readonly id = 'dialog' as const;

  enter(ctx: StateContext): void {
    ctx.store.set(STORE_LINE_INDEX, 0);
  }

  update(_ctx: StateContext, _dtMs: number): void {
    // Type-out animation deferred to a future commit; we show the full line.
  }

  render(ctx: StateContext): void {
    const i = (ctx.store.get(STORE_LINE_INDEX) as number | undefined) ?? 0;
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
    const lines = wrapText(line.text, 36);
    let y = DIALOG_BOX_Y + 22;
    for (const ln of lines) {
      c.fillText(ln, 8, y);
      y += 14;
    }

    // Advance prompt (8px for compact UI text).
    c.fillStyle = dim;
    c.textAlign = 'right';
    c.font = '8px "fusion-pixel", monospace';
    c.fillText(`▶ (${i + 1}/${SCRIPT.length})`, INTERNAL_WIDTH - 8, INTERNAL_HEIGHT - 10);
  }

  exit(ctx: StateContext): NextState {
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
