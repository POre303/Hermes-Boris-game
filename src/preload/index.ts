import { contextBridge } from 'electron';
import { APP_VERSION, PRELOAD_BRIDGE_NAME } from '../shared/constants';
import type { HermesBorisApi } from '../shared/api';
// Side-effect import: the file calls `contextBridge.exposeInMainWorld`
// at module-evaluation time, wiring up the `window.recovery` global.
// eslint-disable-next-line import/no-unassigned-import
import './recovery-api';

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
