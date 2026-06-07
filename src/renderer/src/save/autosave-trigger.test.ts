/**
 * AutosaveTrigger tests — uses a fake saveApi to capture calls.
 */

import { describe, expect, it, vi } from 'vitest';
import { AutosaveTrigger, buildSnapshot } from './autosave-trigger';
import type { AutosaveResult, SaveDataInput } from '../../../shared/save-api';

const fixture = (): SaveDataInput =>
  buildSnapshot({
    chapter: 1,
    scene: 'forest',
    palette: 'tokyo_heisei',
    inventory: ['note'],
    flags: { met: true },
  });

const ok = (id: 0 | 1 | 2 | 3, label: string): AutosaveResult => ({ id, label });

describe('AutosaveTrigger', () => {
  it('chapter start fires autosave("chapter", ...)', async () => {
    const autosave = vi.fn().mockResolvedValue(ok(0, 'slot-0'));
    const toast = vi.fn();
    const t = new AutosaveTrigger({ saveApi: { autosave }, onToast: toast });
    t.notifyChapterStarted(fixture());
    // Wait a microtask for the promise to resolve.
    await Promise.resolve();
    await Promise.resolve();
    expect(autosave).toHaveBeenCalledWith('chapter', expect.objectContaining({ scene: 'forest' }));
    expect(toast).toHaveBeenCalledWith('已自动存档 → slot-0');
  });

  it('scene change fires autosave("scene", ...)', async () => {
    const autosave = vi.fn().mockResolvedValue(ok(2, 'autosave-2'));
    const toast = vi.fn();
    const t = new AutosaveTrigger({ saveApi: { autosave }, onToast: toast });
    t.notifySceneChanged(fixture());
    await Promise.resolve();
    await Promise.resolve();
    expect(autosave).toHaveBeenCalledWith('scene', expect.any(Object));
    expect(toast).toHaveBeenCalledWith('已自动存档 → autosave-2');
  });

  it('error is logged not thrown', async () => {
    const autosave = vi.fn().mockRejectedValue(new Error('IPC offline'));
    const onError = vi.fn();
    const toast = vi.fn();
    const t = new AutosaveTrigger({ saveApi: { autosave }, onError, onToast: toast });
    t.notifyChapterStarted(fixture());
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/chapter autosave failed/));
    expect(toast).not.toHaveBeenCalled();
  });

  it('buildSnapshot fills in defaults', () => {
    const s = buildSnapshot({ chapter: 1, scene: 'x', palette: 'tokyo_heisei' });
    expect(s.inventory).toEqual([]);
    expect(s.flags).toEqual({});
    expect(s.solvedPuzzles).toEqual([]);
  });
});
