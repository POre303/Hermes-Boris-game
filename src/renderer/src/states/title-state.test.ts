import { describe, it, expect } from 'vitest';
import { TitleState } from './title-state';
import { makeCtx, clearCalls } from '../core/__mocks__/canvas';

describe('TitleState', () => {
  it('has id "title"', () => {
    expect(new TitleState().id).toBe('title');
  });

  it('enter() fills the canvas with palette[0] (black)', () => {
    const ctx = makeCtx();
    new TitleState().enter(ctx);
    const fillRect = ctx.calls.find((c) => c.method === 'fillRect');
    expect(fillRect).toBeDefined();
    const fillStyleSet = ctx.calls.find((c) => c.method === 'fillStyle');
    expect(fillStyleSet?.args[0]).toBe(ctx.palette[0]);
  });

  it('render() draws text including "Hermes & Boris" and the subtitle', () => {
    const ctx = makeCtx();
    const s = new TitleState();
    s.enter(ctx);
    clearCalls(ctx.calls);
    s.render(ctx);
    const fillTextCalls = ctx.calls.filter((c) => c.method === 'fillText');
    const texts = fillTextCalls.map((c) => String(c.args[0]));
    expect(texts.some((t) => t.includes('Hermes & Boris'))).toBe(true);
    expect(texts.some((t) => t.toLowerCase().includes('pixel visual novel'))).toBe(true);
  });

  it('exit() returns null when no key consumed', () => {
    const ctx = makeCtx();
    const s = new TitleState();
    s.enter(ctx);
    s.update(ctx, 16);
    expect(s.exit(ctx)).toBe(null);
  });

  it('exit() returns "main-menu" after Space is consumed', () => {
    const ctx = makeCtx();
    const s = new TitleState();
    s.enter(ctx);
    s.update(ctx, 16);
    ctx.input.__press('Space');
    expect(s.exit(ctx)).toBe('main-menu');
  });

  it('exit() returns "main-menu" after Enter is consumed', () => {
    const ctx = makeCtx();
    const s = new TitleState();
    s.enter(ctx);
    s.update(ctx, 16);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe('main-menu');
  });

  it('exit() returns null on unrelated keys (ArrowUp etc.)', () => {
    const ctx = makeCtx();
    const s = new TitleState();
    s.enter(ctx);
    s.update(ctx, 16);
    ctx.input.__press('ArrowUp');
    expect(s.exit(ctx)).toBe(null);
  });
});
