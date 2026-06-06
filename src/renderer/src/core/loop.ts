import type { StateMachine } from './state';

/**
 * Fixed-step requestAnimationFrame loop. Drives the state machine each frame
 * with wall-clock dt (capped at maxFrameMs to avoid spiral-of-death after a
 * tab switch or breakpoint).
 */
export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private readonly maxFrameMs = 250;
  private readonly machine: StateMachine;
  private readonly onFps?: (fps: number) => void;

  constructor(machine: StateMachine, onFps?: (fps: number) => void) {
    this.machine = machine;
    this.onFps = onFps;
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
    this.machine.update(dtMs);
    this.machine.render();
    if (this.onFps) {
      this.onFps(1000 / Math.max(dtMs, 1));
    }
    this.rafId = requestAnimationFrame(this.frame);
  };
}
