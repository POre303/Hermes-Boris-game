/**
 * Shape of the API exposed by the preload script to the renderer.
 * Defined in shared/ so both the preload implementation and the renderer's
 * global type declaration can reference the same type.
 *
 * NOTE: `platform` is a literal union (not `NodeJS.Platform`) because the
 * web tsconfig does not include Node typings — keeps the same semantic
 * without leaking Node into the renderer's type graph.
 */
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

declare global {
  interface Window {
    readonly hermesBoris: HermesBorisApi;
  }
}
