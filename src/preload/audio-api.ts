/**
 * Preload-side audio API surface.
 *
 * Electron's preload runs in the renderer's isolated world before page load
 * and can use Web Audio APIs. In D2-2 the actual audio engine is created
 * lazily in the renderer (after the autoplay-policy gate), and the
 * `window.audio` global is bound there. This file documents the shape
 * surfaced to the renderer and re-exports the type from `shared/`.
 *
 * We deliberately do NOT import `src/audio/` from the preload because:
 *   1. The audio module needs the DOM lib (AudioContext etc.) which the
 *      Node-flavored tsconfig for the preload does not include.
 *   2. The preload runs before the renderer's user gesture; creating the
 *      AudioContext here would leave it suspended and need a later resume.
 *   3. Keeping the preload to types and the contextBridge call makes the
 *      security story obvious: the bridge only forwards declared method
 *      names, not a full object graph.
 *
 * The shared type is re-exported so the preload's index.ts can refer to
 * `WindowAudio` without circular-import gymnastics.
 */

export type {
  WindowAudio,
  WindowAudioBgm,
  WindowAudioSfx,
  WindowAudioMaster,
} from '../shared/audio-api';
