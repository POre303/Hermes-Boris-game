import { describe, it, expect, beforeEach } from 'vitest';
import { BgmPlayer, DEFAULT_BGM_FADE_MS } from '../bgm';
import { makeLoader, makeMockAudioContext, makeMockGain } from './audio-mock';

const TRACK = 'bgm/prologue_anomaly';

describe('BgmPlayer', () => {
  let ctx = makeMockAudioContext();
  let bgmGain = makeMockGain();
  let loader = makeLoader([{ id: TRACK, kind: 'bgm' }], new Map([[TRACK, { __buf: 1 }]]));
  let player: BgmPlayer;

  beforeEach(() => {
    ctx = makeMockAudioContext();
    bgmGain = makeMockGain();
    loader = makeLoader([{ id: TRACK, kind: 'bgm' }], new Map([[TRACK, { __buf: 1 }]]));
    player = new BgmPlayer({
      loader,
      nodes: { ctx, bgmGain },
    });
  });

  it('starts in a not-playing state', () => {
    expect(player.isPlaying()).toBe(false);
    expect(player.currentTrackId()).toBe(null);
  });

  it('crossfade() decodes the buffer, starts a source, and ramps bgmGain', async () => {
    await player.crossfade(TRACK);
    // A BufferSource was created and started.
    expect(ctx.bufferSources).toHaveLength(1);
    const src = ctx.bufferSources[0];
    expect(src?.startedAt).not.toBe(null);
    // The decoded buffer is what `decodeAudioData` resolved with — our test
    // mock returns `{ __decoded: true }` regardless of input.
    expect(src?.buffer).toEqual({ __decoded: true });
    // BGM is looped by default.
    expect(src?.loop).toBe(true);
    // BgmGain recorded both a setValueAtTime and a linearRampToValueAtTime.
    expect(bgmGain.gain.calls.some((c) => c.method === 'setValueAtTime')).toBe(true);
    expect(bgmGain.gain.linearRamps.length).toBeGreaterThanOrEqual(1);
    // The peak of the ramp is 1 (the BGM rides at unity, master applies volume).
    const lastRamp = bgmGain.gain.linearRamps[bgmGain.gain.linearRamps.length - 1];
    expect(lastRamp?.value).toBe(1);
    // BGM is now playing.
    expect(player.isPlaying()).toBe(true);
    expect(player.currentTrackId()).toBe(TRACK);
  });

  it('crossfade() defaults to 2s duration (1000ms fade-out + 1000ms fade-in)', async () => {
    await player.crossfade(TRACK);
    // First crossfade has no old track, so the dip-to-zero is skipped and we
    // just ramp from 0 -> 1 over the fadeIn half (1s) starting at currentTime.
    const lastRamp = bgmGain.gain.linearRamps[bgmGain.gain.linearRamps.length - 1];
    expect(lastRamp).toBeDefined();
    if (!lastRamp) return;
    expect(lastRamp.time - ctx.currentTime).toBeCloseTo(DEFAULT_BGM_FADE_MS / 2000, 5);
  });

  it('subsequent crossfade() ramps down the old source, starts a new one, and ramps up', async () => {
    // Fresh context for clean buffer source accounting.
    const ctx2 = makeMockAudioContext();
    const bgmGain2 = makeMockGain();
    const secondTrack = 'bgm/village_dusk';
    const loader2 = makeLoader(
      [
        { id: TRACK, kind: 'bgm' },
        { id: secondTrack, kind: 'bgm' },
      ],
      new Map([
        [TRACK, { __buf: 1 }],
        [secondTrack, { __buf: 2 }],
      ]),
    );
    const player2 = new BgmPlayer({ loader: loader2, nodes: { ctx: ctx2, bgmGain: bgmGain2 } });

    await player2.crossfade(TRACK, 1000);
    // Reset the gain's call log so we can see the second-pass calls cleanly.
    bgmGain2.gain.calls.length = 0;
    bgmGain2.gain.linearRamps.length = 0;
    bgmGain2.gain.setValues.length = 0;

    await player2.crossfade(secondTrack, 1000);

    // Two sources total — first from the initial crossfade, second from the swap.
    expect(ctx2.bufferSources).toHaveLength(2);
    // The first source received a stop() with a future time.
    const old = ctx2.bufferSources[0];
    expect(old?.stoppedAt).not.toBe(null);
    // The second source is the new current.
    const next = ctx2.bufferSources[1];
    expect(next?.buffer).toEqual({ __decoded: true });
    // We recorded a setValueAtTime (preserve current value) + linearRamp to 0 + linearRamp to 1.
    const methods = bgmGain2.gain.calls.map((c) => c.method);
    expect(methods).toContain('setValueAtTime');
    expect(methods.filter((m) => m === 'linearRampToValueAtTime').length).toBeGreaterThanOrEqual(2);
  });

  it('stop() fades the current BGM and forgets the current id', async () => {
    await player.crossfade(TRACK, 500);
    expect(player.isPlaying()).toBe(true);
    player.stop(200);
    expect(player.isPlaying()).toBe(false);
    expect(player.currentTrackId()).toBe(null);
    // The source received a stop() call.
    const src = ctx.bufferSources[0];
    expect(src?.stoppedAt).not.toBe(null);
  });

  it('crossfade() throws on negative duration', async () => {
    await expect(player.crossfade(TRACK, -1)).rejects.toThrow();
  });

  it('crossfade() throws if the track id is not in the index', async () => {
    await expect(player.crossfade('bgm/does_not_exist')).rejects.toThrow(/unknown track/);
  });
});
