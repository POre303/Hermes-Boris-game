import paletteJson from '../../../assets/palette.json';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../shared/constants';

/**
 * Renderer entry point — commit 2 boots a black canvas at the 16-color palette's
 * index 0. The state machine arrives in commit 3.
 */

type PaletteColor = { name: string; hex: string };
const palette = (paletteJson as { colors: PaletteColor[] }).colors;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Renderer: #game-canvas not found in DOM');
}

if (canvas.width !== INTERNAL_WIDTH || canvas.height !== INTERNAL_HEIGHT) {
  // Sanity check — the canvas should be authored at the internal resolution.
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

// Fill with palette index 0 (always black per palette.json convention).
ctx2d.fillStyle = palette[0]?.hex ?? '#000000';
ctx2d.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

// Confirm preload bridge is alive.
const bridgeVersion = window.hermesBoris?.version ?? 'unknown';
console.info(`[hermes-boris] renderer booted; bridge version=${bridgeVersion}`);
