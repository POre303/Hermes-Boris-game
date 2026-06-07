import { describe, it, expect, beforeEach } from 'vitest';
import { MasterController, type StorageLike } from '../master';
import { makeMockParam } from './audio-mock';

const memStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
};

describe('MasterController', () => {
  let gain = makeMockParam();
  let now = 0;
  let storage = memStorage();

  beforeEach(() => {
    gain = makeMockParam();
    now = 0;
    storage = memStorage();
  });

  const make = (): MasterController =>
    new MasterController({
      masterGain: gain,
      currentTime: () => now,
      storage,
    });

  it('starts at the default 0.7 volume and writes the persisted value to the gain', () => {
    const m = make();
    expect(m.getStoredVolume()).toBe(0.7);
    expect(m.getVolume()).toBe(0.7);
    expect(gain.value).toBe(0.7);
  });

  it('reads a stored volume from storage on construction', () => {
    storage.setItem('hermes-boris.audio.master-volume', '0.42');
    const m = make();
    expect(m.getStoredVolume()).toBe(0.42);
    expect(gain.value).toBe(0.42);
  });

  it('setVolume() clamps to [0, 1] and ramps the gain', () => {
    const m = make();
    gain.calls.length = 0;
    gain.linearRamps.length = 0;
    m.setVolume(0.3);
    expect(m.getStoredVolume()).toBe(0.3);
    expect(gain.linearRamps.length).toBe(1);
    const ramp = gain.linearRamps[0];
    expect(ramp?.value).toBe(0.3);
    expect(storage.getItem('hermes-boris.audio.master-volume')).toBe('0.3');
  });

  it('setVolume(2.0) is clamped to 1.0', () => {
    const m = make();
    m.setVolume(2);
    expect(m.getStoredVolume()).toBe(1);
  });

  it('setVolume(-1) is clamped to 0', () => {
    const m = make();
    m.setVolume(-1);
    expect(m.getStoredVolume()).toBe(0);
  });

  it('mute() ramps to 0 and persists the muted flag', () => {
    const m = make();
    gain.linearRamps.length = 0;
    m.mute();
    expect(m.isMuted()).toBe(true);
    expect(m.getVolume()).toBe(0);
    expect(gain.linearRamps[0]?.value).toBe(0);
    expect(storage.getItem('hermes-boris.audio.master-muted')).toBe('true');
  });

  it('unmute() restores the stored volume', () => {
    const m = make();
    m.setVolume(0.5);
    m.mute();
    gain.linearRamps.length = 0;
    m.unmute();
    expect(m.isMuted()).toBe(false);
    expect(m.getVolume()).toBe(0.5);
    expect(gain.linearRamps[0]?.value).toBe(0.5);
    expect(storage.getItem('hermes-boris.audio.master-muted')).toBe('false');
  });

  it('toggleMute() flips state', () => {
    const m = make();
    m.toggleMute();
    expect(m.isMuted()).toBe(true);
    m.toggleMute();
    expect(m.isMuted()).toBe(false);
  });

  it('setVolume() while muted updates the stored volume but not the gain', () => {
    const m = make();
    m.mute();
    gain.linearRamps.length = 0;
    m.setVolume(0.2);
    expect(m.getStoredVolume()).toBe(0.2);
    expect(m.getVolume()).toBe(0); // still muted
    expect(gain.linearRamps.length).toBe(0);
  });
});
