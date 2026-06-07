/**
 * Renderer-side autosave trigger.
 *
 * Wraps `window.save.autosave(...)` so a host state can fire autosaves
 * with two simple calls:
 *
 *   trigger.notifyChapterStarted(snapshot);  // → autosave('chapter', ...)
 *   trigger.notifySceneChanged(snapshot);    // → autosave('scene', ...)
 *
 * Failures (the main side threw, or the renderer is offline) are swallowed
 * and logged — autosave is a best-effort safety net, not gameplay-critical.
 * Crashes get caught by D2-4's recovery layer, not by this module.
 *
 * The trigger also fires a toast callback so the UI can flash "已自动存档"
 * for 2 seconds. The callback is provided by the host — typically a
 * SaveMenuController's `flashToast` method.
 *
 * The trigger does NOT track scene diffs internally — the host state is
 * the source of truth for "what scene am I in". That keeps this module
 * dumb and unit-testable.
 */

import type { SaveDataInput, SaveSlotSummary } from '../../../shared/save-api';
import type { AutosaveResult } from '../../../shared/save-api';

export interface AutosaveTriggerOptions {
  /** window.save implementation (default: window.save). Override for tests. */
  readonly saveApi?: {
    autosave(kind: 'chapter' | 'scene', data: SaveDataInput): Promise<AutosaveResult>;
  };
  /** Toast notifier. Called on every successful autosave. */
  readonly onToast?: (text: string) => void;
  /** Logger for failures. Default: console.warn. */
  readonly onError?: (msg: string) => void;
}

export class AutosaveTrigger {
  private readonly saveApi: NonNullable<AutosaveTriggerOptions['saveApi']>;
  private readonly onToast: NonNullable<AutosaveTriggerOptions['onToast']>;
  private readonly onError: NonNullable<AutosaveTriggerOptions['onError']>;
  private inflight = 0;

  constructor(opts: AutosaveTriggerOptions = {}) {
    this.saveApi = opts.saveApi ??
      (globalThis as { save?: AutosaveTriggerOptions['saveApi'] }).save ?? {
        // Fallback no-op so missing window.save doesn't throw at construction.
        autosave: async () => ({ id: 0 as const, label: 'noop' }),
      };
    this.onToast = opts.onToast ?? (() => {});
    this.onError = opts.onError ?? ((msg) => console.warn(`[autosave] ${msg}`));
  }

  /** Fire the chapter-start autosave (slot-0 hidden). */
  notifyChapterStarted(snapshot: SaveDataInput): void {
    void this.fire('chapter', snapshot);
  }

  /** Fire the scene-change autosave (autosave-1/2/3 rotation). */
  notifySceneChanged(snapshot: SaveDataInput): void {
    void this.fire('scene', snapshot);
  }

  private async fire(kind: 'chapter' | 'scene', snapshot: SaveDataInput): Promise<void> {
    this.inflight += 1;
    try {
      const result = await this.saveApi.autosave(kind, snapshot);
      this.onToast(`已自动存档 → ${result.label}`);
    } catch (e) {
      this.onError(`${kind} autosave failed: ${(e as Error).message ?? String(e)}`);
    } finally {
      this.inflight -= 1;
    }
  }

  /** How many autosaves are mid-flight (testing only). */
  getInflightCount(): number {
    return this.inflight;
  }
}

/**
 * Build a SaveDataInput snapshot from the bare minimum a state would have.
 * Real game states pass richer data; this is the shape they conform to.
 */
export const buildSnapshot = (args: {
  chapter: SaveDataInput['chapter'];
  scene: string;
  palette: SaveDataInput['palette'];
  inventory?: readonly string[];
  flags?: Readonly<Record<string, boolean>>;
  solvedPuzzles?: readonly string[];
  thumbnailBase64?: string;
}): SaveDataInput => ({
  chapter: args.chapter,
  scene: args.scene,
  palette: args.palette,
  inventory: args.inventory ?? [],
  flags: args.flags ?? {},
  solvedPuzzles: args.solvedPuzzles ?? [],
  thumbnailBase64: args.thumbnailBase64,
});
