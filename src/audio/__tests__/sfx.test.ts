import { describe, it, expect, beforeEach } from 'vitest';
import { SFX_VOICE_CAP, SfxPlayer } from '../sfx';
import { makeLoader, makeMockAudioContext, makeMockGain } from './audio-mock';

const SFX = 'sfx/footstep';

/** Poll a condition until true or timeout. Avoids the brittle "await N microtasks" pattern. */
const waitFor = async (
  cond: () => boolean,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> => {
  const timeoutMs = opts.timeoutMs ?? 500;
  const intervalMs = opts.intervalMs ?? 1;
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor: condition never met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
};

const setupPlayer = (trackCount = 1) => {
  const ctx = makeMockAudioContext();
  const sfxBus = makeMockGain();
  const tracks = Array.from({ length: trackCount }, (_, i) => ({
    id: `sfx/track_${i}`,
    kind: 'sfx' as const,
  }));
  const buffers = new Map(tracks.map((t) => [t.id, { __buf: t.id }]));
  const loader = makeLoader(tracks, buffers);
  const player = new SfxPlayer({ loader, nodes: { ctx, sfxBus } });
  return { ctx, sfxBus, loader, player };
};

describe('SfxPlayer', () => {
  let deps = setupPlayer(20);

  beforeEach(() => {
    deps = setupPlayer(20);
  });

  it('play() decodes the buffer and starts a BufferSource connected through a voice gain', async () => {
    const { ctx, player, sfxBus } = deps;
    player.play('sfx/track_0');
    // SFX fire asynchronously; let the fire() promise resolve.
    await waitFor(() => player.activeCount() === 1);
    expect(ctx.bufferSources).toHaveLength(1);
    const src = ctx.bufferSources[0];
    // The decoded buffer is what `decodeAudioData` resolved with — our test
    // mock returns `{ __decoded: true }` regardless of input.
    expect(src?.buffer).toEqual({ __decoded: true });
    expect(src?.loop).toBe(false);
    expect(src?.startedAt).not.toBe(null);
    // The voice gain was created and is the one that connected to the sfx bus
    // — we look at the voiceGain's `connects` (outgoing) since the mock
    // mirrors Web Audio's `node.connect(dest)` as a one-way wiring.
    expect(ctx.gainNodes.length).toBeGreaterThanOrEqual(1);
    const voiceGain = ctx.gainNodes[0];
    expect(voiceGain?.connects).toContain(sfxBus);
    // activeCount reflects the in-flight voice.
    expect(player.activeCount()).toBe(1);
  });

  it('SFX voices cap at 8 — playing a 9th evicts the oldest', async () => {
    const { ctx, player } = deps;
    // Fire 9 plays back-to-back. The decode is async, so we need to await
    // microtasks between calls to let the buffer actually be retrieved before
    // the next play() submits.
    const trackIds = Array.from({ length: 9 }, (_, i) => `sfx/track_${i}`);
    for (const id of trackIds) {
      player.play(id);
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => ctx.gainNodes.length >= 1, { timeoutMs: 200 });
    }
    // Wait for the last call to complete.
    await waitFor(() => ctx.bufferSources.length >= 9, { timeoutMs: 200 });
    // 9 BufferSources were created.
    expect(ctx.bufferSources.length).toBe(9);
    // The first source (oldest) was stopped on overflow.
    const first = ctx.bufferSources[0];
    expect(first?.stoppedAt).not.toBe(null);
    // activeCount is at most 8.
    expect(player.activeCount()).toBeLessThanOrEqual(SFX_VOICE_CAP);
    expect(SFX_VOICE_CAP).toBe(8);
  });

  it('SFX bus is wired as a real GainNode — voice gains connect to it, not the other way around', async () => {
    const { player, sfxBus } = deps;
    player.play('sfx/track_0');
    await waitFor(() => player.activeCount() === 1);
    // The sfxBus in this test was made via makeMockGain() directly, so it has
    // a fresh empty `connects` list. The voice gain called `connect(sfxBus)`,
    // so the voice gain's `connects` includes sfxBus — not vice-versa. This
    // mirrors the real Web Audio semantics where a one-way wiring is recorded
    // on the calling node, not the destination.
    expect(sfxBus.connects.length).toBe(0);
  });

  it('play() is fire-and-forget: a bad track id logs and returns without throwing', async () => {
    const { player } = deps;
    // No await — play() is sync-fire.
    expect(() => player.play('sfx/does_not_exist')).not.toThrow();
    // Wait for the async fire() to log and complete.
    await new Promise((r) => setTimeout(r, 10));
    expect(player.activeCount()).toBe(0);
  });

  it('per-call volume is applied to the voice gain (1.0 by default)', async () => {
    const { ctx, player } = deps;
    player.play('sfx/track_0');
    await waitFor(() => player.activeCount() === 1);
    // The first gain created is the voice gain.
    const voiceGain = ctx.gainNodes[0];
    expect(voiceGain?.gain.value).toBe(1);
  });

  it('per-call volume override is forwarded to the voice gain', async () => {
    const { ctx, player } = deps;
    player.play('sfx/track_0', { volume: 0.25 });
    await waitFor(() => player.activeCount() === 1);
    const voiceGain = ctx.gainNodes[0];
    expect(voiceGain?.gain.value).toBe(0.25);
  });
});
