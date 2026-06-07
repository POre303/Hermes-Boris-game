import { describe, it, expect, beforeEach } from 'vitest';
import { BgmPlayer } from '../bgm';
import { SfxPlayer } from '../sfx';
import { SCENE_AUDIO, playSceneEnter } from '../scene';
import { makeLoader, makeMockAudioContext, makeMockGain } from './audio-mock';

const waitFor = async (cond: () => boolean, timeoutMs = 500): Promise<void> => {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor: condition never met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 1));
  }
};

const setup = () => {
  const ctx = makeMockAudioContext();
  const bgmGain = makeMockGain();
  const sfxBus = makeMockGain();
  const tracks = [
    { id: 'bgm/prologue_anomaly', kind: 'bgm' as const },
    { id: 'bgm/prologue_rin_theme', kind: 'bgm' as const },
    { id: 'bgm/village_dusk', kind: 'bgm' as const },
    { id: 'sfx/sfx_wind_chime', kind: 'sfx' as const },
    { id: 'sfx/sfx_cicada', kind: 'sfx' as const },
  ];
  const buffers = new Map(tracks.map((t) => [t.id, { __buf: t.id }]));
  const loader = makeLoader(tracks, buffers);
  const bgm = new BgmPlayer({ loader, nodes: { ctx, bgmGain } });
  const sfx = new SfxPlayer({ loader, nodes: { ctx, sfxBus } });
  return { ctx, bgm, sfx, loader };
};

describe('SCENE_AUDIO', () => {
  it('has entries for the three D2-2 scene placeholders', () => {
    expect(SCENE_AUDIO.prologue_anomaly).toBeDefined();
    expect(SCENE_AUDIO.prologue_rin?.bgm).toBe('bgm/prologue_rin_theme');
    expect(SCENE_AUDIO.ch1_village_dusk?.bgm).toBe('bgm/village_dusk');
  });
});

describe('playSceneEnter', () => {
  let deps = setup();

  beforeEach(() => {
    deps = setup();
  });

  it('is a no-op for unknown scene keys', async () => {
    const { bgm, sfx } = deps;
    await playSceneEnter('nope', bgm, sfx);
    expect(bgm.isPlaying()).toBe(false);
    expect(sfx.activeCount()).toBe(0);
  });

  it('plays the BGM and the sfx_on_enter for a known scene', async () => {
    const { bgm, sfx } = deps;
    await playSceneEnter('prologue_anomaly', bgm, sfx);
    expect(bgm.isPlaying()).toBe(true);
    expect(bgm.currentTrackId()).toBe('bgm/prologue_anomaly');
    // SFX is async; wait for it to register.
    await waitFor(() => sfx.activeCount() >= 1);
    expect(sfx.activeCount()).toBeGreaterThanOrEqual(1);
  });

  it('fires every sfx_on_enter entry in order', async () => {
    const { bgm, sfx } = deps;
    await playSceneEnter('ch1_village_dusk', bgm, sfx);
    await waitFor(() => sfx.activeCount() === 1);
    // sfx_cicada is the only sfx_on_enter for ch1_village_dusk.
    expect(sfx.activeCount()).toBe(1);
    expect(bgm.currentTrackId()).toBe('bgm/village_dusk');
  });
});
