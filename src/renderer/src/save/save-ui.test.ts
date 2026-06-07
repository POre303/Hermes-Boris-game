/**
 * SaveMenuController unit tests.
 *
 * Uses a mock canvas (Proxy-based, like the existing core/__mocks__) and
 * a fake input snapshot to drive the controller without a real DOM.
 */

import { describe, expect, it, vi } from 'vitest';
import { makeMockCtx2d, makeMockInput, type MockInput } from '../core/__mocks__/canvas';
import { SaveMenuController, type SaveMenuAction, type SaveMenuRenderContext } from './save-ui';
import type { SaveSlotSummary } from '../../../shared/save-api';

const fakeInput = (): MockInput => makeMockInput();

const mkRc = (over: Partial<SaveMenuRenderContext> = {}): SaveMenuRenderContext => {
  const { ctx } = makeMockCtx2d();
  return {
    ctx2d: ctx,
    palette: ['#000000', '#ffffff'],
    isDown: () => false,
    consume: () => false,
    nowMs: 0,
    ...over,
  };
};

const summary = (id: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): SaveSlotSummary => ({
  id,
  chapter: 'prologue',
  scene: `scene-${id}`,
  savedAt: 1_700_000_000_000,
  hasThumbnail: false,
  isAutosave: false,
});

describe('SaveMenuController', () => {
  it('sel fires on Enter at slot 0', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('save');
    const rc = mkRc({
      consume: (code) => code === 'Enter',
    });
    c.update(rc);
    expect(cb).toHaveBeenCalledWith({ type: 'select', slot: 0 });
  });

  it('cancel fires on Escape', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    const rc = mkRc({ consume: (code) => code === 'Escape' });
    c.update(rc);
    expect(cb).toHaveBeenCalledWith({ type: 'cancel' });
  });

  it('arrow keys move selection along the grid', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('save');
    let right = true;
    let down = false;
    const rc = mkRc({
      consume: (code) => {
        if (code === 'ArrowRight' && right) {
          right = false;
          down = true;
          return true;
        }
        if (code === 'ArrowDown' && down) {
          down = false;
          return true;
        }
        return false;
      },
    });
    c.update(rc); // right: 0 → 1
    c.update(rc); // down: 1 → 6
    expect(c.getState().selected).toBe(6);
  });

  it('does not move past the left edge', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('save');
    const rc = mkRc({ consume: (code) => code === 'ArrowLeft' });
    c.update(rc);
    expect(c.getState().selected).toBe(0);
  });

  it('does not move past the bottom-right corner (right then down rows)', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('save');
    // Move from (0,0) all the way to (4,1)=9 via right + down pattern.
    // Each iter: 4 rights (to column 4) then 1 down (next row, col 0).
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        c.update(mkRc({ consume: (code) => code === 'ArrowRight' }));
      }
      if (row === 0) {
        c.update(mkRc({ consume: (code) => code === 'ArrowDown' }));
      }
    }
    // Now at (4,1) = index 9. Right blocked.
    c.update(mkRc({ consume: (code) => code === 'ArrowRight' }));
    expect(c.getState().selected).toBe(9);
    c.update(mkRc({ consume: (code) => code === 'ArrowDown' }));
    expect(c.getState().selected).toBe(9); // still 9 (bottom edge)
  });

  it('confirm dialog routes select to confirm-overwrite / confirm-load', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('save');
    c.requestOverwriteConfirm();
    const rc = mkRc({ consume: (code) => code === 'Enter' });
    c.update(rc);
    expect(cb).toHaveBeenCalledWith({ type: 'confirm-overwrite', slot: 0 });
  });

  it('flashToast does not throw and is reflected in state via the toast render', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.flashToast('已自动存档');
    // Render should not throw.
    const { ctx, calls } = makeMockCtx2d();
    c.render(mkRc({ ctx2d: ctx, nowMs: 0 }));
    // At least one fillText call should mention the toast text.
    const sawToast = calls.some(
      (call) => call.method === 'fillText' && call.args.some((a) => a === '已自动存档'),
    );
    expect(sawToast).toBe(true);
  });

  it('render() with empty slots draws an "empty" cell without throwing', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('load');
    c.setSlots([]);
    c.setAutosaves([]);
    const { ctx, calls } = makeMockCtx2d();
    c.render(mkRc({ ctx2d: ctx, nowMs: 0 }));
    // 10 cells, 2 strips (header + footer), 10 (空) labels — just ensure
    // there are some fillText calls.
    const textCalls = calls.filter((c2) => c2.method === 'fillText');
    expect(textCalls.length).toBeGreaterThan(5);
  });

  it('render() with a populated slot includes the chapter label', () => {
    const cb = vi.fn();
    const c = new SaveMenuController(cb);
    c.setMode('load');
    c.setSlots([summary(1)]);
    c.setAutosaves([]);
    const { ctx, calls } = makeMockCtx2d();
    c.render(mkRc({ ctx2d: ctx, nowMs: 0 }));
    const saw序章 = calls.some(
      (c2) => c2.method === 'fillText' && c2.args.some((a) => a === '序章'),
    );
    expect(saw序章).toBe(true);
  });
});
