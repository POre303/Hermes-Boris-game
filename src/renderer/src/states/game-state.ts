import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';
import type { GameState, NextState, StateContext } from '../core/state';

const STORE_GAME_CLOCK = 'gameClock';
const STORE_ACTIVE_SCENE = 'activeScene';
const DIALOG_TRIGGER_FRAMES = 30; // ~0.5s at 60fps
const PLAYER_X = 240;
const PLAYER_Y = 200;
const PLAYER_SIZE = 8;

/** Default scene key for the in-game state until the chapter system sets
 *  something more specific. */
const DEFAULT_SCENE_KEY = 'prologue_anomaly';

/** In-game scene — sky strip, ground, and an 8x8 player sprite. */
export class GameStateImpl implements GameState {
  readonly id = 'game' as const;

  enter(ctx: StateContext): void {
    ctx.store.set(STORE_GAME_CLOCK, 0);
    this.drawScene(ctx);
    this.maybePlaySceneAudio(ctx);
  }

  update(ctx: StateContext, _dtMs: number): void {
    const t = ((ctx.store.get(STORE_GAME_CLOCK) as number | undefined) ?? 0) + 1;
    ctx.store.set(STORE_GAME_CLOCK, t);
  }

  render(ctx: StateContext): void {
    this.drawScene(ctx);
  }

  exit(ctx: StateContext): NextState {
    if (ctx.input.consume('Escape')) {
      return 'menu-pause';
    }
    const t = (ctx.store.get(STORE_GAME_CLOCK) as number | undefined) ?? 0;
    if (t >= DIALOG_TRIGGER_FRAMES) {
      return 'dialog';
    }
    return null;
  }

  private drawScene(ctx: StateContext): void {
    const sky = ctx.palette[10] ?? '#005800'; // dark-green
    const ground = ctx.palette[8] ?? '#7c5800'; // olive
    const skin = ctx.palette[15] ?? '#f0b088';
    const accent = ctx.palette[12] ?? '#3cbcfc'; // blue
    const c = ctx.ctx2d;

    c.fillStyle = sky;
    c.fillRect(0, 0, INTERNAL_WIDTH, 180);
    c.fillStyle = ground;
    c.fillRect(0, 180, INTERNAL_WIDTH, INTERNAL_HEIGHT - 180);

    // A simple house shape for visual interest.
    c.fillStyle = accent;
    c.fillRect(60, 130, 30, 50);
    c.fillStyle = ctx.palette[5] ?? '#a40020';
    c.fillRect(60, 120, 30, 12);

    // Player sprite (8x8 skin square with a 2x2 dark-blue eye on top).
    c.fillStyle = skin;
    c.fillRect(PLAYER_X, PLAYER_Y, PLAYER_SIZE, PLAYER_SIZE);
    c.fillStyle = ctx.palette[13] ?? '#005cb8';
    c.fillRect(PLAYER_X + 2, PLAYER_Y + 2, 2, 2);
  }

  /**
   * Reads `store.activeScene` (or the default) and fires the scene's
   * audio hook (bgm crossfade + sfx_on_enter). Errors and missing engine
   * are swallowed — audio is non-critical and the game must not stall on
   * a missing .ogg.
   */
  private maybePlaySceneAudio(ctx: StateContext): void {
    if (!ctx.audio) return;
    const key = (ctx.store.get(STORE_ACTIVE_SCENE) as string | undefined) ?? DEFAULT_SCENE_KEY;
    void ctx.audio.scene(key);
  }
}
