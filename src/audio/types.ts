/**
 * Audio domain types shared by bgm, sfx, and master modules.
 * No runtime code here — pure type contracts.
 */

/** Three track buckets. UI sounds are short stings (clicks, page-turn) kept
 * on the sfx bus for the same node-cap accounting. */
export type AudioTrackKind = 'bgm' | 'sfx' | 'ui';

/** A single entry in `assets/audio/index.json`. Runtime equivalent of a row
 * in the audio asset manifest. `path` is a renderer-relative URL — Vite will
 * hash the .ogg at build time and rewrite the path. */
export interface AudioTrack {
  /** Stable id, e.g. `'bgm/prologue_anomaly'`. Used as the lookup key. */
  readonly id: string;
  /** Renderer-relative path including kind subfolder, e.g. `'assets/audio/bgm/prologue_anomaly.ogg'`. */
  readonly path: string;
  /** Approximate decoded length in milliseconds (rounded). */
  readonly durationMs: number;
  /** True for ambient/loop tracks (BGM), false for one-shot stings (SFX/UI). */
  readonly loop: boolean;
  readonly kind: AudioTrackKind;
}

/** What `assets/audio/index.json` decodes to. */
export interface AudioIndex {
  readonly tracks: readonly AudioTrack[];
}

/** Options accepted by `sfx.play()` and (partially) `bgm.crossfade()`. */
export interface PlayOptions {
  /** Per-call volume multiplier in [0, 1]. Multiplied on top of master. */
  volume?: number;
  /** Override the track's default loop behavior. */
  loop?: boolean;
  /** BGM-only: fade-in duration in ms. Default 2000 for BGM. */
  fadeInMs?: number;
  /** BGM-only: fade-out duration in ms when replacing current track. */
  fadeOutMs?: number;
}

/** BGM crossfade API surface exposed to the renderer. */
export interface BgmApi {
  /** Smoothly replace the current BGM. If no BGM is playing, fades in from
   *  silence. Resolves once the new track is audible (fade-in scheduled). */
  crossfade(trackId: string, durationMs?: number): Promise<void>;
  /** Immediately stop the current BGM with a short fade. */
  stop(fadeOutMs?: number): void;
  /** True if a BGM is currently scheduled or playing. */
  isPlaying(): boolean;
}

/** SFX one-shot API surface. */
export interface SfxApi {
  /** Fire-and-forget one-shot. Caps concurrent voices at 8 (FIFO eviction). */
  play(trackId: string, opts?: PlayOptions): void;
  /** Number of currently active (scheduled) SFX voices. */
  activeCount(): number;
}

/** Master volume / mute API surface. */
export interface MasterApi {
  /** Set master volume in [0, 1]. Applies via a short linearRamp. */
  setVolume(volume: number): void;
  /** Mute without forgetting the prior volume. */
  mute(): void;
  /** Unmute and restore the last non-zero volume. */
  unmute(): void;
  /** Toggle helper. */
  toggleMute(): void;
  /** Returns the current effective volume (0 if muted). */
  getVolume(): number;
  /** Returns the stored (un-muted) volume. */
  getStoredVolume(): number;
  isMuted(): boolean;
}

/** Aggregate engine surface — the object that ends up on `window.audio`. */
export interface AudioEngine {
  readonly bgm: BgmApi;
  readonly sfx: SfxApi;
  readonly master: MasterApi;
  /** Look up a track metadata entry. Returns undefined if id is unknown. */
  getTrack(id: string): AudioTrack | undefined;
  /** Returns every track metadata entry, useful for debug / preload UIs. */
  listTracks(): readonly AudioTrack[];
  /** Fire the audio for a scene key (bgm crossfade + sfx_on_enter). */
  scene(sceneKey: string): Promise<void>;
  /** Idempotent. Must be called from a user-gesture handler (autoplay policy). */
  resume(): Promise<void>;
  /** Tears down audio nodes and closes the context. */
  dispose(): void;
}
