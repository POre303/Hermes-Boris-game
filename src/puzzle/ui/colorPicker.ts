import type { StateContext } from '../../renderer/src/core/state';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../shared/constants';
import { getPuzzle } from '../registry';

/**
 * 4-color picker overlay for L1 puzzles. Shown on top of the dialog state
 * when a line's text contains a `[puzzle:xxx]` marker.
 *
 * Visual layout (centered in the canvas, just above the dialog box):
 *   ┌────────────────────────────────────────┐
 *   │  [red] [white] [blue] [yellow]         │  ← 4 swatches to pick from
 *   │                                        │
 *   │  > R > R > _ > _                       │  ← current sequence slots
 *   │                                        │
 *   │  Hint: 灯笼的颜色在告诉你顺序。         │
 *   │  1-4: pick   BKSP: undo   ENTER: ok    │  ← key hints
 *   └────────────────────────────────────────┘
 *
 * Input handling: keys 1-4 append a color (in tokyo_heisei palette terms:
 * "red" = wine-red, "white" = wafu-cream, "blue" = dusk-blue,
 * "yellow" = candle-yellow). Backspace removes the last entry. Enter
 * attempts the solve via `trySolve`.
 *
 * Storage: the player's working sequence is kept in `ctx.store` under the
 * key `puzzleInput_<puzzleId>`, so it survives across frames.
 */

const STORE_PREFIX = 'puzzleInput_';
const SWATCH_PX = 40;
const SWATCH_GAP = 8;
const SLOT_PX = 24;
const SLOT_GAP = 4;

const COLOR_KEYS = ['red', 'white', 'blue', 'yellow'] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

/** Tokyo-heisei mapping: token → palette hex. Wine-red / wafu-cream / etc. */
const COLOR_HEX: Record<ColorKey, string> = {
  red: '#8b2942',
  white: '#d4c5a0',
  blue: '#4a5a7a',
  yellow: '#d4a04a',
};

const inputStoreKey = (puzzleId: string): string => `${STORE_PREFIX}${puzzleId}`;

/** Read the player's working input sequence for a color-picker puzzle.
 *  Returns an empty array when the slot is unset or the stored value is
 *  not a string array. */
export const readColorPickerInput = (ctx: StateContext, puzzleId: string): string[] => {
  const raw = ctx.store.get(inputStoreKey(puzzleId));
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
};

/** Result of the last solve attempt against this puzzle, used to drive
 *  short-lived "wrong / need N more" feedback.  Read by `renderColorPicker`. */
export interface ColorPickerLastResult {
  readonly reason: 'wrong' | 'incomplete' | 'ok' | 'invalid-state';
  readonly at: number;
}
const resultStoreKey = (puzzleId: string): string => `puzzleResult_${puzzleId}`;
export const readColorPickerResult = (
  ctx: StateContext,
  puzzleId: string,
): ColorPickerLastResult | undefined => {
  const raw = ctx.store.get(resultStoreKey(puzzleId));
  if (
    raw != null &&
    typeof raw === 'object' &&
    'reason' in raw &&
    'at' in raw &&
    typeof (raw as { at: unknown }).at === 'number'
  ) {
    const r = raw as { reason: unknown; at: number };
    if (
      r.reason === 'wrong' ||
      r.reason === 'incomplete' ||
      r.reason === 'ok' ||
      r.reason === 'invalid-state'
    ) {
      return { reason: r.reason, at: r.at };
    }
  }
  return undefined;
};
export const writeColorPickerResult = (
  ctx: StateContext,
  puzzleId: string,
  result: ColorPickerLastResult,
): void => {
  ctx.store.set(resultStoreKey(puzzleId), result);
};
export const clearColorPickerResult = (ctx: StateContext, puzzleId: string): void => {
  ctx.store.delete(resultStoreKey(puzzleId));
};

/** Cap how long the "wrong / incomplete" feedback lingers on screen. */
const RESULT_FEEDBACK_MS = 1500;

/** Returns true while a recent wrong/incomplete result is still on screen
 *  and should be rendered as feedback text. */
export const isResultFeedbackActive = (ctx: StateContext, puzzleId: string): boolean => {
  const r = readColorPickerResult(ctx, puzzleId);
  if (!r) return false;
  if (r.reason === 'ok') return false;
  return Date.now() - r.at < RESULT_FEEDBACK_MS;
};

const writeColorPickerInput = (
  ctx: StateContext,
  puzzleId: string,
  seq: readonly string[],
): void => {
  ctx.store.set(inputStoreKey(puzzleId), [...seq]);
};

/** Drop the player's working input. Exported so the puzzle overlay can
 *  reset the slot row when a wrong solve attempt comes back from the
 *  solver. */
export const resetColorPickerInput = (ctx: StateContext, puzzleId: string): void => {
  ctx.store.delete(inputStoreKey(puzzleId));
};

/** Pull the expected sequence length for an L1 puzzle from the registry.
 *  Falls back to 4 if the registry can't find the id (defensive — picker
 *  should never be invoked against an unknown puzzle). */
const expectedLengthFor = (puzzleId: string): number => {
  const p = getPuzzle(puzzleId);
  if (p && p.type === 'L1') {
    const sol = p.solution as { kind: 'color_sequence'; sequence: readonly string[] };
    return sol.sequence.length;
  }
  return 4;
};

/** Process a single frame's input. Returns the new sequence (post-handling). */
export const handleColorPickerInput = (ctx: StateContext, puzzleId: string): string[] => {
  const seq = readColorPickerInput(ctx, puzzleId);
  const expectedLength = expectedLengthFor(puzzleId);

  // Accept both the main-row digit keys (`Digit1`-`Digit4`) and the numpad
  // equivalents (`Numpad1`-`Numpad4`) — many players on Windows reach for
  // the numpad, and the previous version only honoured `Digit*` which
  // stranded anyone typing on a tenkeyless / laptop.
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const digitCode = `Digit${i + 1}`;
    const numpadCode = `Numpad${i + 1}`;
    if (ctx.input.consume(digitCode) || ctx.input.consume(numpadCode)) {
      // Cap the sequence at the puzzle's expected length so a player
      // mashing keys cannot push the picker past N slots. Extra presses
      // are ignored silently — the UI slot row already shows all N
      // swatches filled, so the picker stays locked at N picks.
      if (seq.length < expectedLength) {
        const color = COLOR_KEYS[i];
        if (color) {
          writeColorPickerInput(ctx, puzzleId, [...seq, color]);
        }
      }
      return readColorPickerInput(ctx, puzzleId);
    }
  }

  if (ctx.input.consume('Backspace')) {
    writeColorPickerInput(ctx, puzzleId, seq.slice(0, -1));
    return readColorPickerInput(ctx, puzzleId);
  }

  if (ctx.input.consume('KeyC')) {
    // 'C' clears — escape hatch if the player picks the wrong color.
    resetColorPickerInput(ctx, puzzleId);
    return [];
  }

  return seq;
};

export const renderColorPicker = (
  ctx: StateContext,
  puzzleId: string,
  hint: string,
  expectedLength: number,
): void => {
  const c = ctx.ctx2d;
  const bg = ctx.palette[0] ?? '#000000';
  const fg = ctx.palette[1] ?? '#ffffff';
  const dim = ctx.palette[3] ?? '#7c7c7c';
  const accent = ctx.palette[4] ?? '#f83800';

  // 4 swatches in a row, centered.
  const swatchRowW = COLOR_KEYS.length * SWATCH_PX + (COLOR_KEYS.length - 1) * SWATCH_GAP;
  const swatchStartX = (INTERNAL_WIDTH - swatchRowW) / 2;
  const swatchY = 20;

  // Dim the background so the picker is clearly modal.
  c.fillStyle = bg;
  c.fillRect(0, 0, INTERNAL_WIDTH, 195);

  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.font = '10px monospace';
  c.fillStyle = dim;
  c.fillText('1-4: pick   BKSP: undo   C: clear   ENTER: confirm', INTERNAL_WIDTH / 2, 4);

  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const key = COLOR_KEYS[i];
    if (!key) continue;
    const x = swatchStartX + i * (SWATCH_PX + SWATCH_GAP);
    c.fillStyle = COLOR_HEX[key];
    c.fillRect(x, swatchY, SWATCH_PX, SWATCH_PX);
    c.strokeStyle = fg;
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, swatchY + 0.5, SWATCH_PX - 1, SWATCH_PX - 1);
    c.fillStyle = fg;
    c.font = '8px monospace';
    c.fillText(`(${i + 1}) ${key}`, x + SWATCH_PX / 2, swatchY + SWATCH_PX + 2);
  }

  // Selected sequence slots.
  const seq = readColorPickerInput(ctx, puzzleId);
  const slotRowW = expectedLength * SLOT_PX + Math.max(0, expectedLength - 1) * SLOT_GAP;
  const slotStartX = (INTERNAL_WIDTH - slotRowW) / 2;
  const slotY = 100;
  for (let i = 0; i < expectedLength; i++) {
    const x = slotStartX + i * (SLOT_PX + SLOT_GAP);
    c.strokeStyle = dim;
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, slotY + 0.5, SLOT_PX - 1, SLOT_PX - 1);
    const picked = seq[i];
    if (picked && (COLOR_KEYS as readonly string[]).includes(picked)) {
      c.fillStyle = COLOR_HEX[picked as ColorKey];
      c.fillRect(x + 2, slotY + 2, SLOT_PX - 4, SLOT_PX - 4);
    }
  }

  // Progress indicator.
  c.fillStyle = accent;
  c.font = '8px monospace';
  c.fillText(`${seq.length}/${expectedLength}`, INTERNAL_WIDTH / 2, 130);

  // Hint text.
  c.fillStyle = fg;
  c.font = '10px monospace';
  const hintLines = wrapText(hint, 60);
  let y = 150;
  for (const line of hintLines) {
    c.fillText(line, INTERNAL_WIDTH / 2, y);
    y += 12;
  }

  // Verification feedback (wrong / incomplete). When the player has
  // pressed Enter and the solver rejected their sequence, render a short
  // hint explaining why so they know what to fix. The result entry in
  // `ctx.store` carries a `Date.now()` timestamp; if the entry is older
  // than `RESULT_FEEDBACK_MS` we drop it.
  const lastResult = readColorPickerResult(ctx, puzzleId);
  if (lastResult && Date.now() - lastResult.at < RESULT_FEEDBACK_MS) {
    let msg: string | undefined;
    if (lastResult.reason === 'wrong') {
      msg = '顺序不对，再试一次。已自动清空。';
    } else if (lastResult.reason === 'incomplete') {
      msg = `还需要 ${expectedLength - seq.length} 个颜色。`;
    }
    if (msg) {
      c.fillStyle = '#ff4040';
      c.font = 'bold 10px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(msg, INTERNAL_WIDTH / 2, 178);
    }
  }

  // Touch the height reference so the unused dim import is honored.
  void INTERNAL_HEIGHT;
};

const wrapText = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];
  const lines: string[] = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (buf.length >= maxChars) {
      lines.push(buf);
      buf = '';
    }
  }
  if (buf.length > 0) lines.push(buf);
  return lines;
};
