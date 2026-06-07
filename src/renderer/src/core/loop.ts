import type { GameStateId, StateMachine } from './state';

/**
 * Fixed-step requestAnimationFrame loop. Drives the state machine each frame
 * with wall-clock dt (capped at maxFrameMs to avoid spiral-of-death after a
 * tab switch or breakpoint).
 *
 * Crash-recovery (D2-4): the loop tracks the active state id and, on a
 * change, fires `onTransitioned` so the caller can persist a snapshot. The
 * store snapshot is supplied by the caller via `getStoreSnapshot` because
 * the StateMachine itself does not expose the store — keeping the engine
 * core unchanged.
 */

export interface GameLoopOptions {
  onFps?: (fps: number) => void;
  /**
   * Called once per frame in which the active state id changed. The id
   * argument is the *new* state id. Pass-through for crash-recovery —
   * the renderer wires this to `window.recovery.write(...)`.
   */
  onTransitioned?: (id: GameStateId) => void;
}

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private lastStateId: GameStateId;
  private running = false;
  private readonly maxFrameMs = 250;
  private readonly machine: StateMachine;
  private readonly onFps?: (fps: number) => void;
  private readonly onTransitioned?: (id: GameStateId) => void;

  constructor(machine: StateMachine, options: GameLoopOptions = {}) {
    this.machine = machine;
    this.onFps = options.onFps;
    this.onTransitioned = options.onTransitioned;
    this.lastStateId = machine.getCurrent().id;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    const dtMs = Math.min(now - this.lastTime, this.maxFrameMs);
    this.lastTime = now;
    // Any error thrown by machine.update propagates to the renderer's
    // unhandled-error path. main.ts attaches a `window.error` listener
    // that writes a recovery snapshot before the renderer dies; the
    // state machine itself already logs the underlying cause.
    this.machine.update(dtMs);
    this.machine.render();
    const newId = this.machine.getCurrent().id;
    if (newId !== this.lastStateId) {
      this.lastStateId = newId;
      if (this.onTransitioned) {
        try {
          this.onTransitioned(newId);
        } catch (cbErr) {
          // A failing recovery write must not crash the loop; the catch in
          // the recovery path itself already swallows write errors.
          console.error('[game-loop] onTransitioned handler threw:', cbErr);
        }
      }
    }
    if (this.onFps) {
      this.onFps(1000 / Math.max(dtMs, 1));
    }
    this.rafId = requestAnimationFrame(this.frame);
  };
}
