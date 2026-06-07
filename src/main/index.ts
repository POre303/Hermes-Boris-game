import { app } from 'electron';
import { installMainCrashHandlers, registerRecoveryIpc } from './ipc';
import { createMainWindow } from './window';

/**
 * Electron main process entry point.
 * Creates a single window and quits the app when all windows are closed.
 *
 * Crash-recovery: the recovery IPC channels and process-level crash
 * handlers are installed before window creation so that a renderer crash
 * inside the first few frames still leaves a usable recovery file.
 */
const bootstrap = (): void => {
  // Install crash handlers synchronously so we catch anything that fires
  // before `app.whenReady` resolves.
  const recovery = registerRecoveryIpc();
  installMainCrashHandlers(recovery);

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
