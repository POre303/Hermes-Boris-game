/**
 * Audio asset loader.
 *
 * At build time the user/orchestrator runs the audio postprocess script and
 * commits `assets/audio/index.json` alongside the .ogg files. At runtime we
 * read the JSON once and lazily decode the buffers as they're requested.
 * Decoded buffers are cached per-track-id to avoid repeated decode work.
 *
 * The `AudioContext` instance must be created lazily (in the renderer) so
 * happy-dom tests can inject a mock before the first `new AudioContext()`.
 */

import type { AudioIndex, AudioTrack, AudioTrackKind } from './types';

/** Minimal subset of the Web Audio API used by the loader. Lets tests inject
 * a stub that records `decodeAudioData` calls without a real AudioContext. */
export interface AudioContextLike {
  /** Returns a Promise that resolves with the decoded buffer. */
  decodeAudioData(arrayBuffer: ArrayBuffer): Promise<unknown>;
}

/** Subset of fetch used by the loader. Lets tests serve a pre-baked buffer. */
export type FetchLike = (url: string) => Promise<ArrayBuffer>;

/** Browser default — used when no `fetch` is injected. */
const defaultFetch: FetchLike = (url) => fetch(url).then((r) => r.arrayBuffer());

/**
 * In-memory loader. Holds the parsed index and a per-id cache of decoded
 * buffers. Callers should not share instances across AudioContexts (a
 * decoded buffer is tied to a specific context's sample rate).
 */
export class AudioLoader {
  private readonly index: ReadonlyMap<string, AudioTrack>;
  private readonly buffers = new Map<string, unknown>();
  private readonly pending = new Map<string, Promise<unknown>>();
  private readonly ctx: AudioContextLike;
  private readonly fetchFn: FetchLike;

  constructor(index: AudioIndex, ctx: AudioContextLike, fetchFn: FetchLike = defaultFetch) {
    this.ctx = ctx;
    this.fetchFn = fetchFn;
    this.index = new Map(index.tracks.map((t) => [t.id, t]));
  }

  /** Look up a track by id. Returns undefined if the id isn't in the index. */
  getTrack(id: string): AudioTrack | undefined {
    return this.index.get(id);
  }

  /** Returns every track in the index, in insertion order. */
  listTracks(): readonly AudioTrack[] {
    return Array.from(this.index.values());
  }

  /** Returns every track of a given kind, in insertion order. */
  listByKind(kind: AudioTrackKind): readonly AudioTrack[] {
    return this.listTracks().filter((t) => t.kind === kind);
  }

  /** Returns the decoded buffer, decoding on first request. */
  async getBuffer(id: string): Promise<unknown> {
    const cached = this.buffers.get(id);
    if (cached) return cached;
    const inFlight = this.pending.get(id);
    if (inFlight) return inFlight;

    const track = this.index.get(id);
    if (!track) {
      throw new Error(`AudioLoader: unknown track id "${id}"`);
    }
    const promise = (async () => {
      const arrayBuffer = await this.fetchFn(track.path);
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(id, buffer);
      this.pending.delete(id);
      return buffer;
    })();
    this.pending.set(id, promise);
    return promise;
  }

  /** Drop the in-memory buffer cache (e.g. on suspend or scene unload). */
  clearBuffers(): void {
    this.buffers.clear();
  }

  /** Number of decoded buffers currently held. */
  cacheSize(): number {
    return this.buffers.size;
  }
}
