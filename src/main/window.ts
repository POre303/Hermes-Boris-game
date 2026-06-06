import { BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
} from '../shared/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Factory that creates the main game window. Pure: no shared state.
 * Loads the dev server URL when ELECTRON_RENDERER_URL is set (electron-vite dev),
 * otherwise loads the built renderer from disk.
 */
export const createMainWindow = (): BrowserWindow => {
  const win = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    resizable: true,
    backgroundColor: '#000000',
    show: false,
    title: 'Hermes & Boris',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Open external links in the user's default browser, not in the game window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // electron-vite sets ELECTRON_RENDERER_URL in dev mode; in prod, load the built file.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devServerUrl) {
    void win.loadURL(devServerUrl);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
};
