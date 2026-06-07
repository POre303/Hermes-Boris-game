import { GameLoop } from './core/loop';
import { input } from './core/input';
import { PALETTE } from './core/palette';
import { createStateMachine } from './states';
import { GAME_STATE_IDS, type GameStateId, type StateContext } from './core/state';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../shared/constants';
import { applySnapshot, checkRecoveryPrompt, serializeStore } from './boot-guard';
import type { GameStateSnapshot } from '../../shared/types';

/**
 * Renderer entry point — wires the state machine into the canvas and starts
 * the game loop.
 *
 * Crash-recovery (D2-4):
 *   1. `checkRecoveryPrompt` runs *before* the state machine is constructed
 *      and either rehydrates `ctx.store` from a persisted snapshot or starts
 *      fresh.
 *   2. `onTransitioned` writes a fresh snapshot to `crash-recovery.json` on
 *      every successful state change.
 *   3. `window.error` / `unhandledrejection` write a "best effort" snapshot
 *      so the next launch has something to recover from.
 */

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Renderer: #game-canvas not found in DOM');
}

if (canvas.width !== INTERNAL_WIDTH || canvas.height !== INTERNAL_HEIGHT) {
  throw new Error(
    `Renderer: canvas dimensions ${canvas.width}x${canvas.height} differ from internal ${INTERNAL_WIDTH}x${INTERNAL_HEIGHT}`,
  );
}

const ctx2d = canvas.getContext('2d');
if (!ctx2d) {
  throw new Error('Renderer: 2D context unavailable');
}

// Pixel-art must never smooth. Turn it off explicitly in addition to the CSS hint.
ctx2d.imageSmoothingEnabled = false;

const ctx: StateContext = {
  canvas,
  ctx2d,
  palette: PALETTE,
  input,
  store: new Map<string, unknown>(),
  quit: () => {
    // Renderer can't directly quit the app; surface via a custom event the main
    // process will pick up. For commit 3 we just close the window through the
    // preload bridge; commit 4+ can wire a proper ipc channel.
    console.info('[hermes-boris] quit requested');
    window.close();
  },
};

/**
 * Top-level boot. The renderer is bundled by Vite, which supports
 * top-level await for ES modules; we use it here so the state machine
 * doesn't start before the recovery prompt is resolved.
 */
const boot = async (): Promise<void> => {
  const recoveryResult = await checkRecoveryPrompt();
  if (recoveryResult.state) {
    applySnapshot(ctx, recoveryResult.state.lastSafeState);
  }

  const initialId: GameStateId = ((): GameStateId => {
    const fromRecovery = recoveryResult.state?.lastSafeState.currentStateId;
    if (fromRecovery && (GAME_STATE_IDS as readonly string[]).includes(fromRecovery)) {
      return fromRecovery as GameStateId;
    }
    return 'title';
  })();
  const machine = createStateMachine(ctx, initialId);

  // Build a snapshot of the current state for recovery.
  // `ctx.store` is the single source of truth for the persistable view.
  const buildSnapshot = (id: GameStateId): GameStateSnapshot => ({
    currentStateId: id,
    storeEntries: serializeStore(ctx.store),
  });

  // Wire the global error handlers first so any failure during the loop's
  // first frame still produces a recovery marker.
  const writeCrashSnapshot = (): void => {
    if (!window.recovery) return;
    void window.recovery.write(buildSnapshot(machine.getCurrent().id));
  };
  window.addEventListener('error', writeCrashSnapshot);
  window.addEventListener('unhandledrejection', writeCrashSnapshot);

  const loop = new GameLoop(machine, {
    onTransitioned: (id) => {
      if (!window.recovery) return;
      void window.recovery.write(buildSnapshot(id));
    },
  });
  loop.start();

  const bridgeVersion = window.hermesBoris?.version ?? 'unknown';
  console.info(
    `[hermes-boris] renderer booted; bridge version=${bridgeVersion}; state=${machine.getCurrent().id}; recovery=${recoveryResult.decision}`,
  );
};

void boot();
