import { describe, it, expect } from 'vitest';
import { MainMenuState } from './main-menu-state';
import { makeCtx, clearCalls } from '../core/__mocks__/canvas';
import { QUIT_SENTINEL } from '../core/state';

describe('MainMenuState', () => {
  it('has id "main-menu"', () => {
    expect(new MainMenuState().id).toBe('main-menu');
  });

  it('enter() initializes menuIndex to 0', () => {
    const ctx = makeCtx();
    new MainMenuState().enter(ctx);
    expect(ctx.store.get('menuIndex')).toBe(0);
  });

  it('ArrowDown moves selection forward (and wraps)', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    ctx.input.__press('ArrowDown');
    s.update(ctx, 16);
    expect(ctx.store.get('menuIndex')).toBe(1);
    ctx.input.__press('ArrowDown');
    s.update(ctx, 16);
    expect(ctx.store.get('menuIndex')).toBe(2);
    ctx.input.__press('ArrowDown');
    s.update(ctx, 16);
    expect(ctx.store.get('menuIndex')).toBe(0);
  });

  it('ArrowUp moves selection backward (and wraps)', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    ctx.input.__press('ArrowUp');
    s.update(ctx, 16);
    expect(ctx.store.get('menuIndex')).toBe(2);
    ctx.input.__press('ArrowUp');
    s.update(ctx, 16);
    expect(ctx.store.get('menuIndex')).toBe(1);
  });

  it('Enter on "New Game" returns "game" and sets continueMode=false', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe('game');
    expect(ctx.store.get('continueMode')).toBe(false);
  });

  it('Enter on "Continue" returns "game" and sets continueMode=true', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    ctx.input.__press('ArrowDown'); // move to Continue
    s.update(ctx, 16);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe('game');
    expect(ctx.store.get('continueMode')).toBe(true);
  });

  it('Enter on "Quit" returns QUIT_SENTINEL', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    ctx.input.__press('ArrowDown');
    s.update(ctx, 16);
    ctx.input.__press('ArrowDown');
    s.update(ctx, 16);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe(QUIT_SENTINEL);
  });

  it('render() draws all 3 menu items', () => {
    const ctx = makeCtx();
    const s = new MainMenuState();
    s.enter(ctx);
    clearCalls(ctx.calls);
    s.render(ctx);
    const texts = ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
    expect(texts).toContain('New Game');
    expect(texts).toContain('Continue');
    expect(texts).toContain('Quit');
  });
});
