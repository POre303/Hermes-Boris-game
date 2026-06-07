/**
 * Master volume + mute controller.
 *
 * Owns the single `masterGain` AudioParam. All other audio nodes (bgm, sfx)
 * route through it. Volume changes are applied via `linearRampToValueAtTime`
 * for click-free transitions. Settings persist to `localStorage` so the
 * user's choice survives an app restart.
 *
 * localStorage keys:
 *   - 'hermes-boris.audio.master-volume' (0..1 float as string)
 *   - 'hermes-boris.audio.master-muted'   ('true' / 'false')
 */

const VOLUME_KEY = 'hermes-boris.audio.master-volume';
const MUTED_KEY = 'hermes-boris.audio.master-muted';

const DEFAULT_VOLUME = 0.7;
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
/** Volume ramp duration in ms — short enough to feel snappy, long enough to
 *  hide zipper noise. */
const RAMP_MS = 30;

const clamp01 = (v: number): number => Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, v));

/** Subset of AudioParam used by master. Mirrors the relevant surface so
 *  tests can pass a hand-rolled mock. */
export interface AudioParamLike {
  value: number;
  linearRampToValueAtTime(value: number, endTime: number): void;
}

/** Storage handle. Tests inject an in-memory map; prod uses `localStorage`. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const localStorageImpl: StorageLike = {
  getItem: (k) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: (k, v) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(k, v);
    }
  },
};

/**
 * Reads a stored volume in [0, 1] from `localStorage` (or a stub), falling
 * back to a default if the value is missing or malformed.
 */
const readStoredVolume = (storage: StorageLike): number => {
  const raw = storage.getItem(VOLUME_KEY);
  if (raw == null) return DEFAULT_VOLUME;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return clamp01(parsed);
};

const readStoredMuted = (storage: StorageLike): boolean => {
  return storage.getItem(MUTED_KEY) === 'true';
};

/** Context-like shape that master needs from the AudioContext. */
export interface MasterContext {
  readonly currentTime: number;
  readonly destination: AudioParamLike['linearRampToValueAtTime'] extends () => unknown
    ? unknown
    : unknown;
  readonly masterGain: AudioParamLike;
}

export interface MasterOptions {
  /** AudioParam that the master output is wired to. Master writes to its
   *  `.value` and schedules ramps. */
  readonly masterGain: AudioParamLike;
  /** `ctx.currentTime` source — only the current time is needed for ramps. */
  readonly currentTime: () => number;
  /** Storage handle. Defaults to a localStorage-backed impl. */
  readonly storage?: StorageLike;
}

export class MasterController {
  private readonly gain: AudioParamLike;
  private readonly now: () => number;
  private readonly storage: StorageLike;
  private storedVolume: number;
  private muted: boolean;

  constructor(opts: MasterOptions) {
    this.gain = opts.masterGain;
    this.now = opts.currentTime;
    this.storage = opts.storage ?? localStorageImpl;
    this.storedVolume = readStoredVolume(this.storage);
    this.muted = readStoredMuted(this.storage);
    // Apply the persisted value to the gain param right away.
    this.applyImmediate(this.effectiveVolume());
  }

  setVolume(volume: number): void {
    const clamped = clamp01(volume);
    this.storedVolume = clamped;
    this.storage.setItem(VOLUME_KEY, String(clamped));
    // If we're muted, the user is still adjusting the "stored" level — the
    // effective gain stays 0 until they unmute. We still record the new value
    // so unmute restores the right number.
    if (this.muted) return;
    this.rampTo(clamped);
  }

  mute(): void {
    if (this.muted) return;
    this.muted = true;
    this.storage.setItem(MUTED_KEY, 'true');
    this.rampTo(0);
  }

  unmute(): void {
    if (!this.muted) return;
    this.muted = false;
    this.storage.setItem(MUTED_KEY, 'false');
    this.rampTo(this.storedVolume);
  }

  toggleMute(): void {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /** Current audible level — 0 when muted, else storedVolume. */
  getVolume(): number {
    return this.effectiveVolume();
  }

  /** The user's preferred level, regardless of mute state. */
  getStoredVolume(): number {
    return this.storedVolume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private effectiveVolume(): number {
    return this.muted ? 0 : this.storedVolume;
  }

  private rampTo(target: number): void {
    this.gain.linearRampToValueAtTime(target, this.now() + RAMP_MS / 1000);
  }

  private applyImmediate(value: number): void {
    // Set value without scheduling a ramp — used at construction time so we
    // pick up the persisted setting on the same audio frame.
    this.gain.value = value;
  }
}
