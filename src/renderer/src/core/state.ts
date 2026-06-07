/**
 * State machine core: 6 peer states with explicit transition table.
 * Transitions are decided per-frame by each state's `exit()` return value.
 */

import type { AudioEngine } from '../../../audio/types';

export const GAME_STATE_IDS = [
  'title',
  'main-menu',
  'game',
  'dialog',
  'menu-pause',
  'game-over',
] as const;

export type GameStateId = (typeof GAME_STATE_IDS)[number];

/** Sentinel returned by exit() to signal the app should quit. */
export const QUIT_SENTINEL = '__quit__' as const;
export type QuitSentinel = typeof QUIT_SENTINEL;

/** Decision returned by a state's exit() each frame. */
export type NextState = GameStateId | QuitSentinel | null;

/** Snapshot of physical key state for a single frame. */
export interface InputSnapshot {
  isDown(code: string): boolean;
  /** Returns true exactly once per physical press; subsequent calls return false. */
  consume(code: string): boolean;
}

/** Shared, read-only-ish context passed to every state on every method. */
export interface StateContext {
  readonly canvas: HTMLCanvasElement;
  readonly ctx2d: CanvasRenderingContext2D;
  /** Flat array of hex colors from assets/palette.json. */
  readonly palette: readonly string[];
  readonly input: InputSnapshot;
  /** Per-machine persistent state (save slot, in-game clock, menu selection, etc.). */
  readonly store: Map<string, unknown>;
  /** Triggered when a state returns QUIT_SENTINEL from exit(). */
  readonly quit: () => void;
  /** Audio engine, or null when the Web Audio API is unavailable. */
  readonly audio: AudioEngine | null;
}

/** A single game state. Pure peer — no stack, no nesting. */
export interface GameState {
  readonly id: GameStateId;
  /** Called once when this state becomes current. */
  enter(ctx: StateContext): void;
  /** Called every frame to run per-frame logic (animation, timers). */
  update(ctx: StateContext, dtMs: number): void;
  /** Called every frame after update to draw. */
  render(ctx: StateContext): void;
  /**
   * Called every frame after update to ask "do you want to leave?".
   * Return a GameStateId to transition, QUIT_SENTINEL to quit, or null to stay.
   * Also serves as a cleanup hook: any per-state teardown can live here, gated
   * on a transition actually happening.
   */
  exit(ctx: StateContext): NextState;
}

/** Factory map: state-id → fresh state instance. Re-instantiated on every transition. */
export type StateFactories = Record<GameStateId, () => GameState>;

/**
 * Pure peer state machine. Holds exactly one current state.
 * update() calls current.update() then current.exit() and uses the return value
 * to drive transitions. Transitions create a fresh state instance via the factory.
 */
export class StateMachine {
  private current: GameState;
  private readonly ctx: StateContext;
  private readonly factories: StateFactories;

  constructor(factories: StateFactories, ctx: StateContext, initial: GameStateId = 'title') {
    this.factories = factories;
    this.ctx = ctx;
    this.current = factories[initial]();
    this.current.enter(ctx);
  }

  getCurrent(): GameState {
    return this.current;
  }

  update(dtMs: number): void {
    this.current.update(this.ctx, dtMs);
    const next = this.current.exit(this.ctx);
    if (next === QUIT_SENTINEL) {
      this.ctx.quit();
      return;
    }
    if (next !== null && next !== this.current.id) {
      this.transition(next);
    }
  }

  render(): void {
    this.current.render(this.ctx);
  }

  /** Force a transition (e.g., from window-close events). No-op if already in target. */
  forceTransition(id: GameStateId): void {
    if (id !== this.current.id) {
      this.transition(id);
    }
  }

  private transition(id: GameStateId): void {
    this.current = this.factories[id]();
    this.current.enter(this.ctx);
  }
}
