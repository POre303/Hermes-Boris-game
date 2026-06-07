/**
 * Serializable snapshot of game state.
 * Written to userData/crash-recovery.json on every successful transition so
 * that a crashed session can resume from the last safe point on next launch.
 *
 * Kept in shared/ so main, preload, and renderer can all reference the same
 * shape without duplication. Values in `storeEntries` are JSON-stringified to
 * sidestep IPC structured-clone quirks and to give the file a stable on-disk
 * format that can be inspected by hand.
 */
export type GameStateSnapshot = {
  readonly currentStateId: string;
  /** Array of [key, JSON-stringified-value] tuples pulled from ctx.store. */
  readonly storeEntries: ReadonlyArray<readonly [string, string]>;
};

/**
 * The full file payload. `crashCount` is incremented on each `write()` —
 * the field is reset to 0 the first time the file is written, and bumps by
 * 1 on every subsequent write. The number therefore represents "how many
 * times the recovery file was rewritten since the last clean exit (clear)".
 * A non-zero value at boot is a strong signal that the previous session
 * crashed without going through graceful shutdown.
 */
export type RecoveryState = {
  readonly lastSafeState: GameStateSnapshot;
  /** Unix-ms timestamp of the most recent successful write. */
  readonly lastTransitionAt: number;
  readonly crashCount: number;
};
