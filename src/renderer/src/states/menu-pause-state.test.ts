import { describe, it, expect } from 'vitest';
import { MenuPauseState } from './menu-pause-state';
import { makeCtx } from '../core/__mocks__/canvas';

describe('MenuPauseState', () => {
  it('has id "menu-pause"', () => {
    expect(new MenuPauseState().id).toBe('menu-pause');
  });

  it('render() draws "PAUSED" text', () => {
    const ctx = makeCtx();
    const s = new MenuPauseState();
    s.enter(ctx);
    s.render(ctx);
    const texts = ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
    expect(texts).toContain('PAUSED');
  });

  it('exit() returns "game" on Escape', () => {
    const ctx = makeCtx();
    const s = new MenuPauseState();
    s.enter(ctx);
    ctx.input.__press('Escape');
    expect(s.exit(ctx)).toBe('game');
  });

  it('exit() returns "game" on Space', () => {
    const ctx = makeCtx();
    const s = new MenuPauseState();
    s.enter(ctx);
    ctx.input.__press('Space');
    expect(s.exit(ctx)).toBe('game');
  });

  it('exit() returns "game" on Enter', () => {
    const ctx = makeCtx();
    const s = new MenuPauseState();
    s.enter(ctx);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe('game');
  });

  it('exit() returns null when no key consumed', () => {
    const ctx = makeCtx();
    const s = new MenuPauseState();
    s.enter(ctx);
    expect(s.exit(ctx)).toBe(null);
  });
});
