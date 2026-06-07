/**
 * Shape of the API exposed by the preload script to the renderer.
 * Defined in shared/ so both the preload implementation and the renderer's
 * global type declaration can reference the same type.
 *
 * NOTE: `platform` is a literal union (not `NodeJS.Platform`) because the
 * web tsconfig does not include Node typings — keeps the same semantic
 * without leaking Node into the renderer's type graph.
 */
import type { GameStateSnapshot, RecoveryState } from './types';

export type HermesBorisPlatform =
  | 'aix'
  | 'darwin'
  | 'freebsd'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'android'
  | 'cygwin'
  | 'netbsd';

export interface HermesBorisApi {
  readonly platform: HermesBorisPlatform;
  readonly version: string;
}

/**
 * Recovery / crash-safety surface exposed to the renderer. Backed by IPC
 * handlers in the main process; the renderer never touches `fs` directly.
 * See `src/main/crash-recovery.ts` for the on-disk format and `boot-guard.ts`
 * for the renderer-side flow that consumes this.
 */
export interface RecoveryApi {
  /** Persist `snapshot` as the most recent safe state. Atomic write. */
  write(snapshot: GameStateSnapshot): Promise<void>;
  /** Return the persisted recovery state, or `null` if none / corrupt. */
  read(): Promise<RecoveryState | null>;
  /** Remove the recovery file. Called on graceful exit or on user-decline. */
  clear(): Promise<void>;
}

declare global {
  interface Window {
    readonly hermesBoris: HermesBorisApi;
    readonly recovery?: RecoveryApi;
  }
}
