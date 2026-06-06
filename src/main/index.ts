import { app } from 'electron';
import { createMainWindow } from './window';

/**
 * Electron main process entry point.
 * Creates a single window and quits the app when all windows are closed.
 */
const bootstrap = (): void => {
  // On macOS, keep the app running even when all windows are closed.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Re-create a window when the dock icon is clicked and no other windows are open.
  app.on('activate', () => {
    if (app.getAppPath()) {
      createMainWindow();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();
  });
};

bootstrap();
