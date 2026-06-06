import { describe, it, expect } from 'vitest';
import { GameStateImpl as GameState } from './game-state';
import { makeCtx, clearCalls } from '../core/__mocks__/canvas';

describe('GameState', () => {
  it('has id "game"', () => {
    expect(new GameState().id).toBe('game');
  });

  it('enter() initializes gameClock to 0', () => {
    const ctx = makeCtx();
    new GameState().enter(ctx);
    expect(ctx.store.get('gameClock')).toBe(0);
  });

  it('update() increments the clock', () => {
    const ctx = makeCtx();
    const s = new GameState();
    s.enter(ctx);
    s.update(ctx, 16);
    s.update(ctx, 16);
    s.update(ctx, 16);
    expect(ctx.store.get('gameClock')).toBe(3);
  });

  it('render() draws the player sprite at fixed position (240, 200) with size 8', () => {
    const ctx = makeCtx();
    const s = new GameState();
    s.enter(ctx);
    clearCalls(ctx.calls);
    s.render(ctx);
    const fillRects = ctx.calls.filter((c) => c.method === 'fillRect').map((c) => c.args);
    // Player sprite: 8x8 at (240, 200)
    const player = fillRects.find(
      (a) => Array.isArray(a) && a[0] === 240 && a[1] === 200 && a[2] === 8 && a[3] === 8,
    );
    expect(player).toBeDefined();
  });

  it('exit() returns "menu-pause" when Escape is consumed', () => {
    const ctx = makeCtx();
    const s = new GameState();
    s.enter(ctx);
    ctx.input.__press('Escape');
    expect(s.exit(ctx)).toBe('menu-pause');
  });

  it('exit() returns null before 30 frames have ticked', () => {
    const ctx = makeCtx();
    const s = new GameState();
    s.enter(ctx);
    for (let i = 0; i < 29; i++) s.update(ctx, 16);
    expect(s.exit(ctx)).toBe(null);
  });

  it('exit() returns "dialog" after 30+ frames have ticked', () => {
    const ctx = makeCtx();
    const s = new GameState();
    s.enter(ctx);
    for (let i = 0; i < 30; i++) s.update(ctx, 16);
    expect(s.exit(ctx)).toBe('dialog');
  });
});
