/**
 * Audio engine factory.
 *
 * Builds the three sub-controllers (bgm, sfx, master) and the loader from a
 * caller-provided AudioContext-like handle. The shape is small enough that
 * the renderer can wire it up after the first user interaction (the
 * autoplay-policy gate), and tests can inject a hand-rolled stub.
 *
 * Graph:
 *   [bgmBufferSource] -> [bgmGain]   -> [masterGain] -> [destination]
 *   [sfxBufferSource] -> [sfxVoiceGain] -> [sfxGain] -> [masterGain] -> [destination]
 */

import { BgmPlayer, type BgmContextLike, type GainParamLike, type AudioParamLike } from './bgm';
import type { BgmApi } from './types';
import { AudioLoader, type AudioContextLike, type FetchLike } from './loader';
import { MasterController, type StorageLike } from './master';
import { SfxPlayer, type SfxBusNode, type SfxContextLike, type SfxVoiceGain } from './sfx';
import type { AudioEngine, AudioIndex, AudioTrack, MasterApi, SfxApi } from './types';
import { playSceneEnter } from './scene';

/** Subset of the AudioContext the engine needs to wire up its node graph. */
export interface EngineAudioContext {
  readonly currentTime: number;
  readonly destination: unknown;
  createGain(): SfxVoiceGain;
  createBufferSource(): import('./bgm').BufferSourceLike;
  decodeAudioData(arrayBuffer: ArrayBuffer): Promise<unknown>;
  resume(): Promise<void>;
  close(): Promise<void>;
  readonly state: 'suspended' | 'running' | 'closed';
}

export interface CreateEngineOptions {
  readonly ctx: EngineAudioContext;
  /** Parsed contents of `assets/audio/index.json`. */
  readonly index: AudioIndex;
  /** Storage handle for master volume + mute persistence. */
  readonly storage?: StorageLike;
  /** Fetch impl. Defaults to the global `fetch`. */
  readonly fetchFn?: FetchLike;
}

/**
 * Public factory. Constructs the loader, builds the bus graph, and returns
 * the engine. The caller is responsible for calling `engine.resume()` from a
 * user-gesture handler (browser autoplay policy).
 */
export function createAudioEngine(opts: CreateEngineOptions): AudioEngine {
  const ctx = opts.ctx;
  const masterGainNode = ctx.createGain();
  const masterGainParam: AudioParamLike = masterGainNode.gain;
  masterGainNode.connect(ctx.destination);

  const bgmGainNode = ctx.createGain();
  bgmGainNode.connect(masterGainNode);

  const sfxBusNode: SfxBusNode = ctx.createGain();
  sfxBusNode.connect(masterGainNode);

  // Loader uses only the decodeAudioData surface of the context.
  const loaderCtx: AudioContextLike = {
    decodeAudioData: (b) => ctx.decodeAudioData(b),
  };
  const loader = new AudioLoader(opts.index, loaderCtx, opts.fetchFn);

  // MasterController only needs a currentTime() function and a gain param.
  const master = new MasterController({
    masterGain: masterGainParam,
    currentTime: () => ctx.currentTime,
    storage: opts.storage,
  });

  const bgmCtx: BgmContextLike = {
    currentTime: ctx.currentTime,
    createBufferSource: () => ctx.createBufferSource(),
    destination: ctx.destination,
  };
  const bgm = new BgmPlayer({
    loader,
    nodes: { ctx: bgmCtx, bgmGain: { gain: bgmGainNode.gain } },
  });

  const sfxCtx: SfxContextLike = {
    currentTime: ctx.currentTime,
    createBufferSource: () => ctx.createBufferSource(),
    createGain: () => ctx.createGain(),
  };
  const sfx = new SfxPlayer({
    loader,
    nodes: { ctx: sfxCtx, sfxBus: sfxBusNode },
  });

  // Bridge: scene-enter helper bound to the engine's bgm + sfx.
  const scene = (sceneKey: string): Promise<void> => playSceneEnter(sceneKey, bgm, sfx);

  let resumed = false;

  return {
    bgm,
    sfx,
    master,
    getTrack: (id) => loader.getTrack(id),
    listTracks: () => loader.listTracks(),
    scene,
    async resume(): Promise<void> {
      if (resumed) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      resumed = true;
    },
    dispose(): void {
      bgm.stop(0);
      void ctx.close();
    },
  };
}

export type {
  AudioEngine,
  AudioIndex,
  AudioTrack,
  BgmApi,
  MasterApi,
  PlayOptions,
  SfxApi,
} from './types';
export { AudioLoader } from './loader';
export { BgmPlayer, DEFAULT_BGM_FADE_MS } from './bgm';
export { MasterController } from './master';
export { SfxPlayer, SFX_VOICE_CAP } from './sfx';
export { SCENE_AUDIO, playSceneEnter } from './scene';
export type { SceneAudio } from './scene';
