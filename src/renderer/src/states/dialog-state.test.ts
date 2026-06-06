import { describe, it, expect } from 'vitest';
import demoScript from '../../../../assets/text/demo-script.json';
import { DialogState } from './dialog-state';
import { makeCtx, clearCalls } from '../core/__mocks__/canvas';

const SCRIPT_LENGTH = (demoScript as unknown[]).length;

describe('DialogState', () => {
  it('has id "dialog"', () => {
    expect(new DialogState().id).toBe('dialog');
  });

  it('enter() initializes dialogLineIndex to 0', () => {
    const ctx = makeCtx();
    new DialogState().enter(ctx);
    expect(ctx.store.get('dialogLineIndex')).toBe(0);
  });

  it('render() draws a strokeRect (the dialog box border)', () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    ctx.calls.length = 0;
    s.render(ctx);
    const strokes = ctx.calls.filter((c) => c.method === 'strokeRect');
    expect(strokes.length).toBeGreaterThanOrEqual(1);
  });

  it('render() draws the speaker name and text on line 0', () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    clearCalls(ctx.calls);
    s.render(ctx);
    const texts = ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
    const first = (demoScript as { speaker: string; text: string }[])[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(texts).toContain(first.speaker);
    // The text is wrapped, so at least part of it should appear.
    expect(texts.some((t) => t.length > 0 && first.text.startsWith(t.slice(0, 5)))).toBe(true);
  });

  it('Space advances to the next line (lineIndex increments)', () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    ctx.input.__press('Space');
    s.exit(ctx);
    expect(ctx.store.get('dialogLineIndex')).toBe(1);
  });

  it('Enter also advances to the next line', () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    ctx.input.__press('Enter');
    s.exit(ctx);
    expect(ctx.store.get('dialogLineIndex')).toBe(1);
  });

  it('exit() returns null between lines (not the last one)', () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    ctx.input.__press('Space');
    expect(s.exit(ctx)).toBe(null);
  });

  it(`exit() returns "game" after the last of ${SCRIPT_LENGTH} lines`, () => {
    const ctx = makeCtx();
    const s = new DialogState();
    s.enter(ctx);
    let result: string | null = null;
    for (let i = 0; i < SCRIPT_LENGTH; i++) {
      ctx.input.__press('Space');
      result = s.exit(ctx);
    }
    expect(result).toBe('game');
  });
});
