/**
 * Scene → audio metadata registry.
 *
 * Each scene has a BGM track id and a list of SFX ids to fire on enter. The
 * D2-N yaml work will replace this static map with a runtime yaml parser,
 * but for D2-2 we ship a hardcoded placeholder so the renderer's game state
 * has something to read.
 *
 * Scene keys mirror the 6-state machine's "scene" surface — the active game
 * scene is set in `ctx.store['activeScene']` by the game state and consulted
 * here. When the registry doesn't have a key we silently skip audio (the
 * default for menu states: title / pause / game-over).
 */

import type { BgmApi } from './bgm';
import type { SfxApi } from './sfx';

export interface SceneAudio {
  /** BGM track id (must be in `assets/audio/index.json`). */
  readonly bgm?: string;
  /** SFX ids to fire on enter, in order. */
  readonly sfxOnEnter?: readonly string[];
  /** BGM crossfade duration in ms (per-scene override). */
  readonly bgmFadeMs?: number;
}

/** Static placeholder registry. Replaced by yaml loader in a later sprint. */
export const SCENE_AUDIO: Readonly<Record<string, SceneAudio>> = Object.freeze({
  // Prologue: opening in 黑森町. The SFX (sfx_wind_chime) fires once on enter.
  prologue_anomaly: {
    bgm: 'bgm/prologue_anomaly',
    sfxOnEnter: ['sfx/sfx_wind_chime'],
    bgmFadeMs: 2000,
  },
  // rin's first appearance, softer theme.
  prologue_rin: {
    bgm: 'bgm/prologue_rin_theme',
    bgmFadeMs: 2000,
  },
  // Ch.1 village dusk loop.
  ch1_village_dusk: {
    bgm: 'bgm/village_dusk',
    sfxOnEnter: ['sfx/sfx_cicada'],
    bgmFadeMs: 2500,
  },
});

/**
 * Play the audio for a scene entering. Safe to call with an unknown key —
 * it's a no-op. SFX are fire-and-forget; the BGM crossfade is awaited so
 * callers can chain on it if they want.
 */
export async function playSceneEnter(sceneKey: string, bgm: BgmApi, sfx: SfxApi): Promise<void> {
  const meta = SCENE_AUDIO[sceneKey];
  if (!meta) return;

  if (meta.bgm) {
    await bgm.crossfade(meta.bgm, meta.bgmFadeMs);
  }
  if (meta.sfxOnEnter) {
    for (const id of meta.sfxOnEnter) {
      sfx.play(id);
    }
  }
}
