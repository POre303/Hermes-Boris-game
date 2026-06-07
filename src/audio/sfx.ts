/**
 * SFX one-shot player.
 *
 * Each `play()` call spawns a fresh AudioBufferSourceNode connected through
 * a per-voice GainNode (so per-call `volume` is honored without disturbing
 * other voices) and then into a shared `sfxGain` bus (which feeds the master).
 * Nodes are discarded via the spec-mandated pattern: `onended → disconnect()`.
 * We never reuse a source — they're single-use.
 *
 * To prevent crackle / clipping on rapid-fire SFX chains (e.g. footsteps in
 * quick succession), we cap concurrent voices at 8 and drop the oldest. The
 * cap is dev-plan-internal — not specified anywhere user-facing. Bumping it
 * higher risks peaks clipping the master bus.
 */

import type { AudioLoader } from './loader';
import type { PlayOptions, SfxApi } from './types';
import type { AudioParamLike, BufferSourceLike } from './bgm';

export const SFX_VOICE_CAP = 8;
const DEFAULT_SFX_VOLUME = 1;

export type { SfxApi };

/** Subset of GainNode used per-voice. */
export interface SfxVoiceGain {
  readonly gain: AudioParamLike;
  connect(destination: unknown): void;
  disconnect(): void;
}

/** Subset of the AudioContext surface used by the SFX player. */
export interface SfxContextLike {
  readonly currentTime: number;
  createBufferSource(): BufferSourceLike;
  createGain(): SfxVoiceGain;
}

/** Subset of GainNode used as the shared SFX bus. */
export interface SfxBusNode extends SfxVoiceGain {
  readonly gain: AudioParamLike;
}

export interface SfxNodes {
  readonly ctx: SfxContextLike;
  readonly sfxBus: SfxBusNode;
}

export interface SfxOptions {
  readonly loader: AudioLoader;
  readonly nodes: SfxNodes;
}

export class SfxPlayer implements SfxApi {
  private readonly loader: AudioLoader;
  private readonly ctx: SfxContextLike;
  private readonly bus: SfxBusNode;
  /** Active voices, oldest first. We evict from the front on overflow. */
  private readonly active: Voice[] = [];

  constructor(opts: SfxOptions) {
    this.loader = opts.loader;
    this.ctx = opts.nodes.ctx;
    this.bus = opts.nodes.sfxBus;
  }

  // Re-export SfxApi as the public type the engine exposes.
  // The TypeScript interface declaration is in ./types; this satisfies the
  // `implements SfxApi` constraint by being structurally identical.
  // (No code change needed; the class is a SfxApi.)

  activeCount(): number {
    return this.active.length;
  }

  play(trackId: string, opts: PlayOptions = {}): void {
    // Kick off the async decode. Failures are logged but never throw — SFX
    // are non-critical for gameplay, and a missing file shouldn't freeze the
    // render loop.
    void this.fire(trackId, opts);
  }

  private async fire(trackId: string, opts: PlayOptions): Promise<void> {
    let buffer: unknown;
    try {
      buffer = await this.loader.getBuffer(trackId);
    } catch (err) {
      console.warn(`[audio] sfx decode failed for "${trackId}":`, err);
      return;
    }

    // Evict the oldest voice if we're at the cap. We do this on the main
    // audio thread boundary (synchronously, before creating the new source)
    // to keep the active list tight.
    this.evictOverflow();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = opts.loop ?? false;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.value = opts.volume ?? DEFAULT_SFX_VOLUME;
    source.connect(voiceGain);
    voiceGain.connect(this.bus);

    source.start();

    const voice: Voice = { source, voiceGain };
    this.active.push(voice);

    source.onended = (): void => {
      const i = this.active.indexOf(voice);
      if (i >= 0) this.active.splice(i, 1);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      try {
        voiceGain.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private evictOverflow(): void {
    while (this.active.length >= SFX_VOICE_CAP) {
      const victim = this.active.shift();
      if (!victim) break;
      try {
        victim.source.stop();
      } catch {
        // already stopped
      }
    }
  }
}

/** Internal record of an in-flight SFX voice. */
interface Voice {
  readonly source: BufferSourceLike;
  readonly voiceGain: SfxVoiceGain;
}
