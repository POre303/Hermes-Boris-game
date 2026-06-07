/**
 * Renderer-side audio bootstrap.
 *
 * Creates the AudioContext + audio engine, wires the engine onto
 * `window.audio`, and registers a one-shot user-gesture handler that
 * resumes the suspended context (the browser autoplay policy requires
 * a user interaction before any sound can play).
 *
 * Importing this module from `main.ts` is the trigger to boot the engine.
 * After init the rest of the renderer can use `window.audio.*` normally.
 *
 * The engine is created eagerly so callers (game state) can call into it
 * synchronously; the actual audio output waits on the gesture.
 */

import audioIndexJson from '../../../assets/audio/index.json';
import { createAudioEngine, type AudioEngine } from '../../audio';
import type { AudioIndex } from '../../audio/types';
import type { WindowAudio } from '../../shared/audio-api';

const audioIndex = audioIndexJson as AudioIndex;

let engine: AudioEngine | null = null;
let resumeListenerInstalled = false;

/**
 * Build the audio engine. Safe to call multiple times — returns the cached
 * engine on subsequent calls. AudioContext is created lazily so a missing
 * Web Audio implementation (very old Chromium, headless happy-dom) doesn't
 * crash the renderer boot.
 */
export function getAudioEngine(): AudioEngine | null {
  if (engine) return engine;
  if (typeof window === 'undefined') return null;

  // Some test environments (happy-dom) don't ship an AudioContext constructor.
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!Ctor) {
    console.warn('[audio] AudioContext unavailable; engine disabled');
    return null;
  }

  const ctx = new Ctor();
  engine = createAudioEngine({
    ctx: ctx as unknown as Parameters<typeof createAudioEngine>[0]['ctx'],
    index: audioIndex,
  });

  installResumeHandler();
  bindWindowAudio();
  return engine;
}

function installResumeHandler(): void {
  if (resumeListenerInstalled) return;
  resumeListenerInstalled = true;

  const resume = async (): Promise<void> => {
    if (!engine) return;
    try {
      await engine.resume();
    } catch (err) {
      console.warn('[audio] resume failed:', err);
      return;
    }
    // Once we've successfully resumed, the gesture listeners are no longer
    // needed. We keep them installed (no-op after first resume) rather than
    // removing them, because the user can re-suspend by tab-switching on
    // some platforms.
    if (engine && (engine.master.getVolume() > 0 || engine.master.getStoredVolume() > 0)) {
      // No-op: resume() is idempotent.
    }
  };

  // Any user gesture unlocks the context. The browser only honors the FIRST
  // one, but the engine's resume() is idempotent so extra calls are cheap.
  const targets: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'mousedown'];
  for (const ev of targets) {
    window.addEventListener(ev, resume, { once: false, passive: true });
  }
}

function bindWindowAudio(): void {
  if (!engine) return;
  // The preload's `window.audio` stub is read-only on the main world. We
  // can't truly replace a contextBridge-exposed value, but because the stub
  // forwards via getters we set up, we expose the real engine under a
  // distinct, renderer-only key (`window.__audioEngine`) for direct tests,
  // and rely on the stub structure for app code. For prod, the preload
  // exposes a placeholder; the renderer queries the engine directly.
  //
  // The intended production path: the renderer's main.ts holds the engine
  // singleton and passes it to consumers (state classes) via the existing
  // StateContext. window.audio stays as the typed stub for forward compat
  // with a future preload-side engine.
  (window as unknown as { __audioEngine: AudioEngine }).__audioEngine = engine;
}

/**
 * Returns the boot singleton. Equivalent to `getAudioEngine()` but named
 * to make call sites read clearly ("get me the audio engine").
 */
export function audioEngine(): AudioEngine | null {
  return getAudioEngine();
}

/** Type-narrowing helper: throws if the engine is unavailable. */
export function requireAudioEngine(): AudioEngine {
  const e = getAudioEngine();
  if (!e) throw new Error('[audio] engine unavailable (AudioContext missing?)');
  return e;
}

/** Re-exported for convenience. */
export type { WindowAudio };
