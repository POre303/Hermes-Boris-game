import type { GameStateSnapshot, RecoveryState } from '../../shared/types';
import type { StateContext } from './core/state';

/**
 * Boot-time guard: checks whether a recovery file is present and, if so,
 * asks the player whether to resume from the last safe state.
 *
 * Used at the very top of the renderer entry, before the state machine
 * is constructed. The 5-minute staleness threshold is a hardcoded
 * compromise between "the player just rebooted" and "we're a week later
 * and the file is stale" — see dev-plan §3.6 for the broader save-slot
 * rotation story.
 *
 * Returns the chosen recovery state, or `null` if the player declined,
 * the file was stale, or no recovery file was present. Callers are
 * expected to call `applySnapshot` if a non-null return value comes back.
 */

const STALE_MS = 5 * 60 * 1000; // TODO(后续): tune per chapter length; see dev-plan §3.6

export type RecoveryDecision = 'recovered' | 'declined' | 'stale' | 'absent';

export interface RecoveryPromptResult {
  /** What the guard decided to do. */
  readonly decision: RecoveryDecision;
  /** The recovery state the player agreed to, or `null` for any other decision. */
  readonly state: RecoveryState | null;
}

const isFresh = (recovery: RecoveryState, now: number): boolean => {
  return now - recovery.lastTransitionAt <= STALE_MS;
};

const formatAge = (ageMs: number): string => {
  const minutes = Math.max(1, Math.floor(ageMs / 60_000));
  return `约 ${minutes} 分钟前`;
};

export const checkRecoveryPrompt = async (): Promise<RecoveryPromptResult> => {
  if (typeof window === 'undefined' || !window.recovery) {
    return { decision: 'absent', state: null };
  }
  const recovery = await window.recovery.read();
  if (!recovery) {
    return { decision: 'absent', state: null };
  }
  const ageMs = Date.now() - recovery.lastTransitionAt;
  if (!isFresh(recovery, Date.now())) {
    // Recovery is too old to be useful; drop it so a future boot starts
    // clean. We don't prompt the user for stale files.
    await window.recovery.clear();
    return { decision: 'stale', state: null };
  }
  const lastState = recovery.lastSafeState.currentStateId || 'unknown';
  const proceed = window.confirm(
    `上次游戏未正常结束（${formatAge(ageMs)}）。\n\n是否恢复到「${lastState}」？`,
  );
  if (!proceed) {
    await window.recovery.clear();
    return { decision: 'declined', state: null };
  }
  return { decision: 'recovered', state: recovery };
};

/**
 * Apply a snapshot's `storeEntries` onto a live `StateContext.store`.
 * Existing keys are overwritten, missing keys are added, and stale keys
 * (present in the live store but not in the snapshot) are cleared.
 *
 * JSON.parse failures fall back to the raw string — the snapshot is best
 * effort, and a string-coerced value is still better than losing the key.
 */
export const applySnapshot = (ctx: StateContext, snapshot: GameStateSnapshot): void => {
  ctx.store.clear();
  for (const [k, v] of snapshot.storeEntries) {
    try {
      ctx.store.set(k, JSON.parse(v));
    } catch {
      ctx.store.set(k, v);
    }
  }
};

/**
 * Convert a live store map to the serializable form used by the recovery
 * payload. Non-JSON-serialisable values (functions, Maps, etc.) are skipped
 * with a console warning — the recovery writer must not throw because of
 * one odd store value.
 */
export const serializeStore = (
  store: ReadonlyMap<string, unknown>,
): ReadonlyArray<readonly [string, string]> => {
  const entries: Array<readonly [string, string]> = [];
  for (const [k, v] of store) {
    try {
      entries.push([k, JSON.stringify(v)]);
    } catch (err) {
      console.warn('[recovery] skipping non-serialisable store key:', k, err);
    }
  }
  return entries;
};
