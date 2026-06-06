import { describe, it, expect } from 'vitest';
import { GameOverState } from './game-over-state';
import { makeCtx } from '../core/__mocks__/canvas';

describe('GameOverState', () => {
  it('has id "game-over"', () => {
    expect(new GameOverState().id).toBe('game-over');
  });

  it('enter() initializes gameOverTimer to 0', () => {
    const ctx = makeCtx();
    new GameOverState().enter(ctx);
    expect(ctx.store.get('gameOverTimer')).toBe(0);
  });

  it('update() ticks the timer', () => {
    const ctx = makeCtx();
    const s = new GameOverState();
    s.enter(ctx);
    s.update(ctx, 16);
    s.update(ctx, 16);
    expect(ctx.store.get('gameOverTimer')).toBe(32);
  });

  it('render() draws "GAME OVER" text', () => {
    const ctx = makeCtx();
    const s = new GameOverState();
    s.enter(ctx);
    s.render(ctx);
    const texts = ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
    expect(texts).toContain('GAME OVER');
  });

  it('exit() returns "main-menu" on Space', () => {
    const ctx = makeCtx();
    const s = new GameOverState();
    s.enter(ctx);
    ctx.input.__press('Space');
    expect(s.exit(ctx)).toBe('main-menu');
  });

  it('exit() returns "main-menu" on Enter', () => {
    const ctx = makeCtx();
    const s = new GameOverState();
    s.enter(ctx);
    ctx.input.__press('Enter');
    expect(s.exit(ctx)).toBe('main-menu');
  });

  it('exit() returns "title" on Escape', () => {
    const ctx = makeCtx();
    const s = new GameOverState();
    s.enter(ctx);
    ctx.input.__press('Escape');
    expect(s.exit(ctx)).toBe('title');
  });
});
