/**
 * BGM player with crossfade.
 *
 * A single AudioContext supports exactly one BGM at a time. The graph is:
 *
 *   [BufferSource (current)] -> [bgmGain] -> [masterGain] -> [destination]
 *
 * On `crossfade(newId, ms)` we:
 *   1. Decode the new buffer (loader handles caching).
 *   2. Schedule a linearRamp on bgmGain that dips to 0 over `ms/2`.
 *   3. Start the new source at the dip's bottom, ramp back up over `ms/2`.
 *   4. Stop the old source at the bottom of the dip.
 *
 * All transitions are real `linearRampToValueAtTime` calls — no setTimeout
 * volume faking — so a debugger pause doesn't drift the fade.
 */

import type { AudioLoader } from './loader';
import type { BgmApi } from './types';

export type { BgmApi };

/** Subset of the Web Audio nodes the BGM player touches. Lets tests inject
 *  Proxy-based mocks without standing up a real AudioContext. */
export interface BgmNodes {
  /** AudioContext for `currentTime` and `createBufferSource`. */
  readonly ctx: BgmContextLike;
  /** Gain node we ride to do the crossfade. */
  readonly bgmGain: GainParamLike;
}

/** Minimal AudioContext surface used by bgm. */
export interface BgmContextLike {
  readonly currentTime: number;
  createBufferSource(): BufferSourceLike;
  readonly destination: unknown;
}

/** Minimal BufferSourceNode surface. */
export interface BufferSourceLike {
  buffer: unknown;
  loop: boolean;
  connect(destination: unknown): void;
  disconnect(): void;
  start(when?: number): void;
  stop(when?: number): void;
  onended: ((ev: unknown) => void) | null;
}

/** Minimal GainNode surface (we only touch .gain). */
export interface GainParamLike {
  readonly gain: AudioParamLike;
}

/** AudioParam subset we use (ramps + cancel + setValueAtTime). */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, startTime: number): void;
  linearRampToValueAtTime(value: number, endTime: number): void;
  cancelScheduledValues(startTime: number): void;
}

/** Default crossfade duration in ms when caller doesn't override. */
export const DEFAULT_BGM_FADE_MS = 2000;

export interface BgmOptions {
  readonly loader: AudioLoader;
  readonly nodes: BgmNodes;
}

export class BgmPlayer implements BgmApi {
  private readonly loader: AudioLoader;
  private readonly ctx: BgmContextLike;
  private readonly gain: AudioParamLike;
  private current: BufferSourceLike | null = null;
  private currentId: string | null = null;
  /** Pending crossfade generation counter — used to ignore late-decode results
   *  after the user has fired off a newer crossfade. */
  private generation = 0;

  constructor(opts: BgmOptions) {
    this.loader = opts.loader;
    this.ctx = opts.nodes.ctx;
    this.gain = opts.nodes.bgmGain.gain;
  }

  isPlaying(): boolean {
    return this.current !== null;
  }

  /** The id of the currently-active BGM, or null if silent. */
  currentTrackId(): string | null {
    return this.currentId;
  }

  async crossfade(trackId: string, durationMs: number = DEFAULT_BGM_FADE_MS): Promise<void> {
    if (durationMs < 0) {
      throw new Error('BgmPlayer.crossfade: durationMs must be >= 0');
    }
    // Resolve the new buffer. If decoding fails we surface the error rather
    // than silently falling back to silence — bad audio asset is a build bug.
    const buffer = await this.loader.getBuffer(trackId);
    const myGen = ++this.generation;

    const fadeOut = Math.max(0, durationMs) / 1000 / 2;
    const fadeIn = Math.max(0, durationMs) / 1000 / 2;
    const now = this.ctx.currentTime;

    const old = this.current;
    const startVolume = this.gain.value;
    const peak = this.targetVolume();

    // Cancel any pending ramp so the new schedule starts from the live value.
    this.gain.cancelScheduledValues(now);
    this.gain.setValueAtTime(startVolume, now);

    if (old && fadeOut > 0) {
      this.gain.linearRampToValueAtTime(0, now + fadeOut);
    } else if (old) {
      this.gain.setValueAtTime(0, now);
    }

    // Build + start the new source. We always create a fresh source because
    // AudioBufferSourceNode is single-use by spec.
    const next = this.ctx.createBufferSource();
    next.buffer = buffer;
    next.loop = true;
    next.connect(this.gain);
    next.start(now + (old ? 0 : 0));

    if (fadeIn > 0) {
      this.gain.linearRampToValueAtTime(peak, now + (old ? fadeOut : 0) + fadeIn);
    } else {
      this.gain.setValueAtTime(peak, now + (old ? fadeOut : 0));
    }

    if (old) {
      const stopAt = now + fadeOut;
      // Wrap in try/catch because calling .stop() with a time that's already
      // passed throws in some implementations.
      try {
        old.stop(stopAt);
      } catch {
        // Already stopped or invalid time — ignore.
      }
    }

    // Forget the old source once it actually ends. If a newer crossfade has
    // taken over in the meantime, don't clobber its bookkeeping.
    const previousSource = old;
    next.onended = (): void => {
      if (myGen !== this.generation) return;
      if (previousSource) {
        // The old one is the one that just ended indirectly via the new
        // source's onended? No — onended fires for the source it's set on.
        // We only clear the "current" pointer when THIS source ends.
      }
      // No-op here: a BGM source loops indefinitely; it only ends on stop().
    };

    this.current = next;
    this.currentId = trackId;

    if (old) {
      // Detach the old source so the GC can collect it once .stop() is done.
      try {
        old.disconnect();
      } catch {
        // ignore
      }
    }
  }

  stop(fadeOutMs = 400): void {
    if (!this.current) return;
    const now = this.ctx.currentTime;
    const fade = Math.max(0, fadeOutMs) / 1000;
    this.gain.cancelScheduledValues(now);
    this.gain.setValueAtTime(this.gain.value, now);
    this.gain.linearRampToValueAtTime(0, now + fade);
    const stopAt = now + fade;
    const old = this.current;
    this.current = null;
    this.currentId = null;
    this.generation++;
    try {
      old.stop(stopAt);
    } catch {
      // ignore
    }
    try {
      old.disconnect();
    } catch {
      // ignore
    }
  }

  /** Read the gain's current value as a hint for the new track's peak. We
   *  don't have direct access to the master volume, so the bgmGain rides up
   *  to 1.0 — the masterGain downstream is what applies the user's level. */
  private targetVolume(): number {
    return 1;
  }
}
