/**
 * Constants shared by main, preload, and renderer processes.
 * Imported by all three. Keep this file dependency-free.
 */

/** Internal canvas resolution — fixed at 480x270 per CLAUDE.md pixel-style spec. */
export const INTERNAL_WIDTH = 480;
export const INTERNAL_HEIGHT = 270;

/** Default window scale. The window opens at 3x internal resolution by default. */
export const DEFAULT_SCALE = 3;
export const DEFAULT_WINDOW_WIDTH = INTERNAL_WIDTH * DEFAULT_SCALE; // 1440
export const DEFAULT_WINDOW_HEIGHT = INTERNAL_HEIGHT * DEFAULT_SCALE; // 810

/** Minimum window dimensions — the smallest useful size is the internal resolution. */
export const MIN_WINDOW_WIDTH = INTERNAL_WIDTH; // 480
export const MIN_WINDOW_HEIGHT = INTERNAL_HEIGHT; // 270

/** App version — kept in sync with package.json#version. */
export const APP_VERSION = '0.1.0';

/** Preload-exposed API name. */
export const PRELOAD_BRIDGE_NAME = 'hermesBoris' as const;
