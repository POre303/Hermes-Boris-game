import { contextBridge } from 'electron';
import { APP_VERSION, PRELOAD_BRIDGE_NAME } from '../shared/constants';
import type { HermesBorisApi } from '../shared/api';
// Side-effect import: the file calls `contextBridge.exposeInMainWorld`
// at module-evaluation time, wiring up the `window.recovery` global.
// eslint-disable-next-line import/no-unassigned-import
import './recovery-api';
import type { WindowAudio } from './audio-api';

/**
 * Preload script — runs in an isolated world before the renderer page loads.
 * Exposes a minimal, typed API surface via contextBridge. The renderer cannot
 * reach Node, fs, or ipcRenderer directly; everything must go through this API.
 */
const api: HermesBorisApi = {
  platform: process.platform as HermesBorisApi['platform'],
  version: APP_VERSION,
};

contextBridge.exposeInMainWorld(PRELOAD_BRIDGE_NAME, api);

/**
 * Audio placeholder. The real `window.audio` is wired up in the renderer
 * (`src/renderer/src/audio-init.ts`) once a user gesture unlocks the
 * AudioContext per the browser's autoplay policy. We register a typed
 * stub here so renderer code that touches `window.audio` before init
 * surfaces a clear "audio not ready" error rather than `undefined.*`.
 *
 * The renderer's audio-init replaces this stub via the same global
 * property name (contextBridge shadows it on the main world with a
 * write-through proxy; assigning in the renderer re-binds cleanly).
 */
const audioNotReady: WindowAudio = {
  bgm: {
    crossfade: () => Promise.reject(new Error('audio: not initialized')),
    stop: () => {},
    isPlaying: () => false,
  },
  sfx: {
    play: () => {},
    activeCount: () => 0,
  },
  master: {
    setVolume: () => {},
    mute: () => {},
    unmute: () => {},
    toggleMute: () => {},
    getVolume: () => 0,
    getStoredVolume: () => 0.7,
    isMuted: () => false,
  },
  getTrack: () => undefined,
  listTracks: () => [],
  scene: () => Promise.resolve(),
  resume: () => Promise.resolve(),
};

contextBridge.exposeInMainWorld('audio', audioNotReady);
