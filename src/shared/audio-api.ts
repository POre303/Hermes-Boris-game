/**
 * Public audio API surface exposed to the renderer via `window.audio`.
 *
 * This is a thin structural copy of the engine's method surface — kept in
 * `shared/` so the renderer's main.ts can call into it via the typed global,
 * and so tests / future preload wiring can take a hard dependency on the
 * shape without pulling in DOM types.
 *
 * Per the brief: we expose only high-level methods (crossfade, play, etc.)
 * and never the raw AudioContext. The implementation lives in
 * `src/audio/` and is wired up in `src/renderer/src/audio-init.ts` after
 * the first user gesture (browser autoplay policy gate).
 */

import type { AudioTrack } from '../audio/types';

export interface WindowAudioBgm {
  crossfade(trackId: string, durationMs?: number): Promise<void>;
  stop(fadeOutMs?: number): void;
  isPlaying(): boolean;
}

export interface WindowAudioSfx {
  play(trackId: string, opts?: { volume?: number; loop?: boolean }): void;
  activeCount(): number;
}

export interface WindowAudioMaster {
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  toggleMute(): void;
  getVolume(): number;
  getStoredVolume(): number;
  isMuted(): boolean;
}

export interface WindowAudio {
  readonly bgm: WindowAudioBgm;
  readonly sfx: WindowAudioSfx;
  readonly master: WindowAudioMaster;
  getTrack(id: string): AudioTrack | undefined;
  listTracks(): readonly AudioTrack[];
  /** Fire audio for a scene key. No-op for unknown keys. */
  scene(sceneKey: string): Promise<void>;
  /** Idempotent. Call from a user-gesture handler. */
  resume(): Promise<void>;
}

declare global {
  interface Window {
    readonly audio: WindowAudio;
  }
}
