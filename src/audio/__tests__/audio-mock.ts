/**
 * Shared audio mocks for vitest. Builds a minimal AudioContext-like object
 * with Proxy-based GainNodes and BufferSourceNodes, plus a recording
 * `AudioParam` so tests can assert on `linearRampToValueAtTime` calls.
 *
 * happy-dom 15 does not implement Web Audio; these mocks let us drive
 * BgmPlayer / SfxPlayer / MasterController / createAudioEngine without
 * touching a real AudioContext.
 */

import { AudioLoader } from '../loader';
import type { AudioParamLike, BufferSourceLike, GainParamLike } from '../bgm';
import type { SfxBusNode, SfxContextLike, SfxVoiceGain } from '../sfx';
import type { EngineAudioContext } from '..';

export interface RampCall {
  method: 'setValueAtTime' | 'linearRampToValueAtTime' | 'cancelScheduledValues';
  value: number | null;
  time: number;
}

export interface MockAudioParam extends AudioParamLike {
  /** Record of every scheduled call in invocation order. */
  readonly calls: RampCall[];
  /** Convenience: just the linearRamp endpoints. */
  linearRamps: { value: number; time: number }[];
  /** Convenience: just the setValueAtTime entries. */
  setValues: { value: number; time: number }[];
}

export const makeMockParam = (initial = 0): MockAudioParam => {
  const calls: RampCall[] = [];
  const param: MockAudioParam = {
    value: initial,
    calls,
    linearRamps: [],
    setValues: [],
    setValueAtTime(value: number, time: number) {
      param.value = value;
      calls.push({ method: 'setValueAtTime', value, time });
      param.setValues.push({ value, time });
    },
    linearRampToValueAtTime(value: number, time: number) {
      param.value = value;
      calls.push({ method: 'linearRampToValueAtTime', value, time });
      param.linearRamps.push({ value, time });
    },
    cancelScheduledValues(time: number) {
      calls.push({ method: 'cancelScheduledValues', value: null, time });
    },
  };
  return param;
};

export interface MockGainNode extends GainParamLike, SfxBusNode {
  readonly gain: MockAudioParam;
  /** Connection log. */
  connects: unknown[];
}

export const makeMockGain = (initial = 0): MockGainNode => {
  const gain = makeMockParam(initial);
  const node: MockGainNode = {
    gain,
    connects: [],
    connect(dest: unknown) {
      node.connects.push(dest);
    },
    disconnect() {
      // no-op
    },
  };
  return node;
};

export interface MockBufferSource extends BufferSourceLike {
  startedAt: number | null;
  stoppedAt: number | null;
  /** Disconnect call count. */
  disconnects: number;
}

export const makeMockBufferSource = (): MockBufferSource => {
  const src: MockBufferSource = {
    buffer: null,
    loop: false,
    startedAt: null,
    stoppedAt: null,
    onended: null,
    disconnects: 0,
    start(when = 0) {
      src.startedAt = when;
    },
    stop(when = 0) {
      src.stoppedAt = when;
    },
    connect(_dest: unknown) {
      // no-op
    },
    disconnect() {
      src.disconnects++;
    },
  };
  return src;
};

export interface MockAudioContext extends EngineAudioContext {
  /** Recording of every createBufferSource / createGain call. */
  readonly bufferSources: MockBufferSource[];
  readonly gainNodes: MockGainNode[];
  /** Fake currentTime advance. Tests push time forward to verify ramps. */
  advanceTime(ms: number): void;
  /** Captures the most recent resume() call. */
  resumeCount: number;
  /** State string for the autoplay policy gate. */
  setState(s: 'suspended' | 'running' | 'closed'): void;
}

export const makeMockAudioContext = (opts: { initialTime?: number } = {}): MockAudioContext => {
  let now = opts.initialTime ?? 0;
  const bufferSources: MockBufferSource[] = [];
  const gainNodes: MockGainNode[] = [];
  let state: 'suspended' | 'running' | 'closed' = 'running';
  let resumeCount = 0;

  const ctx: MockAudioContext = {
    get currentTime() {
      return now;
    },
    get state() {
      return state;
    },
    setState(s) {
      state = s;
    },
    destination: { __mockDest: true },
    bufferSources,
    gainNodes,
    resumeCount: 0,
    advanceTime(ms) {
      now += ms / 1000;
    },
    createBufferSource() {
      const src = makeMockBufferSource();
      bufferSources.push(src);
      return src;
    },
    createGain() {
      const g = makeMockGain();
      gainNodes.push(g);
      return g;
    },
    decodeAudioData: () => Promise.resolve({ __decoded: true }),
    async resume() {
      resumeCount++;
      state = 'running';
    },
    async close() {
      state = 'closed';
    },
  };
  // Mirror resumeCount on the ctx itself.
  Object.defineProperty(ctx, 'resumeCount', {
    get() {
      return resumeCount;
    },
  });
  return ctx;
};

/** Build a minimal in-memory AudioIndex with the given tracks. */
export const makeIndex = (
  tracks: ReadonlyArray<{
    id: string;
    path?: string;
    durationMs?: number;
    loop?: boolean;
    kind: 'bgm' | 'sfx' | 'ui';
  }>,
) => {
  return {
    tracks: tracks.map((t) => ({
      id: t.id,
      path: t.path ?? `assets/audio/${t.kind}/${t.id.split('/').pop()}.ogg`,
      durationMs: t.durationMs ?? 1000,
      loop: t.loop ?? t.kind === 'bgm',
      kind: t.kind,
    })),
  };
};

/** Build an AudioLoader pre-loaded with the given buffers (no fetch needed).
 *
 * The fetchFn is wired against the track id (not the renderer-relative path)
 * so the test buffers map keyed by id resolves cleanly regardless of how the
 * path was synthesized in makeIndex. */
export const makeLoader = (
  tracks: Parameters<typeof makeIndex>[0],
  buffers?: Map<string, unknown>,
) => {
  const ctx = { decodeAudioData: () => Promise.resolve({ __decoded: true }) };
  const index = makeIndex(tracks);
  const idByPath = new Map(index.tracks.map((t) => [t.path, t.id]));
  const fetchFn = (path: string): Promise<ArrayBuffer> => {
    const id = idByPath.get(path);
    if (id && buffers && buffers.has(id)) return Promise.resolve(new ArrayBuffer(0));
    return Promise.reject(new Error(`fetch not stubbed: ${path}`));
  };
  const loader = new AudioLoader(index, ctx, fetchFn);
  return loader;
};

// Re-export types used by tests.
export type { SfxContextLike, SfxVoiceGain };
