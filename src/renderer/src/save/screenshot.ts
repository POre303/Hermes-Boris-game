/**
 * Renderer-side screenshot capture for save thumbnails.
 *
 * Takes the main game canvas (480x270 internal resolution per the pixel
 * style spec) and produces a 240x135 PNG base64 string — exactly half
 * size in each dimension, 16:9 aspect preserved.
 *
 * Strategy: draw the main canvas onto an offscreen 240x135 canvas at 0.5x
 * scale, then call `toDataURL('image/png')` and strip the data-URL prefix.
 * `imageSmoothingEnabled = false` on the offscreen context keeps the
 * nearest-neighbor look the rest of the game uses — half-sized pixels
 * would smear otherwise.
 *
 * Why separate from slot.json:
 *   slot.json is read on every save-list render. Embedding a base64 PNG
 *   (typically 8-25 KB at 240x135 16-color) bloats it past the 50KB target
 *   and makes the list scan noticeably slower on cold start. Storing the
 *   PNG as a separate file and keeping the path in slot.json keeps slot.json
 *   at < 5 KB in practice. See `src/save/storage.ts#writeThumbnailFile`.
 */

import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../../../shared/constants';

/** Thumbnail dimensions — half of INTERNAL_*, preserving 16:9. */
export const THUMBNAIL_WIDTH = 240;
export const THUMBNAIL_HEIGHT = 135;

export interface CaptureOptions {
  /** PNG mime type. Default 'image/png' — the only one the pixel pipeline needs. */
  readonly mimeType?: string;
  /** Override the source canvas (for tests). */
  readonly source?: HTMLCanvasElement;
  /** Override the offscreen canvas factory (for tests). */
  readonly createOffscreen?: (w: number, h: number) => HTMLCanvasElement;
}

const defaultCreateOffscreen = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/**
 * Capture a 240x135 PNG of `source` and return the base64 string
 * (no `data:image/png;base64,` prefix). Throws if the source canvas has
 * unexpected dimensions — that's a config bug, not a runtime condition.
 */
export const captureThumbnail = (
  mainCanvas: HTMLCanvasElement,
  opts: CaptureOptions = {},
): string => {
  const source = opts.source ?? mainCanvas;
  if (source.width !== INTERNAL_WIDTH || source.height !== INTERNAL_HEIGHT) {
    throw new Error(
      `screenshot: source canvas is ${source.width}x${source.height}, expected ${INTERNAL_WIDTH}x${INTERNAL_HEIGHT}`,
    );
  }
  const createOffscreen = opts.createOffscreen ?? defaultCreateOffscreen;
  const off = createOffscreen(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  const octx = off.getContext('2d');
  if (!octx) {
    throw new Error('screenshot: offscreen 2d context unavailable');
  }
  octx.imageSmoothingEnabled = false;
  octx.drawImage(source, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

  const mime = opts.mimeType ?? 'image/png';
  const dataUrl = off.toDataURL(mime);
  const prefix = `data:${mime};base64,`;
  if (!dataUrl.startsWith(prefix)) {
    throw new Error('screenshot: toDataURL returned unexpected prefix');
  }
  return dataUrl.slice(prefix.length);
};
