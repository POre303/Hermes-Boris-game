import { GameLoop } from './core/loop';
import { input } from './core/input';
import { PALETTE } from './core/palette';
import type { StateContext } from './core/state';
import { createStateMachine } from './states';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../shared/constants';

/**
 * Renderer entry point — wires the state machine into the canvas and starts
 * the game loop. Commit 3: skeleton states; commit 4 fills in real logic.
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

const machine = createStateMachine(ctx, 'title');
const loop = new GameLoop(machine);
loop.start();

const bridgeVersion = window.hermesBoris?.version ?? 'unknown';
console.info(
  `[hermes-boris] renderer booted; bridge version=${bridgeVersion}; state=${machine.getCurrent().id}`,
);
