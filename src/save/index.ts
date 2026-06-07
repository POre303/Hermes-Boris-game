/**
 * Save module — main-process public surface.
 *
 * The IPC handler in `src/main/save-handler.ts` is the only consumer of
 * this module; the renderer never imports it directly (preload + contextBridge
 * is the boundary).
 */

export {
  deleteSlot,
  listAutosaves,
  listManualSlots,
  readSlot,
  setBaseDirGetter,
  writeSlot,
} from './storage';

export {
  autosaveLabel,
  nextRotation,
  readCounter,
  resetCounter,
  writeAutosave,
} from './autosave';

export { migrate } from './migrate';

export {
  SaveError,
  type AutosaveCounterFile,
  type AutosaveKind,
  type AutosaveRotationId,
  type ChapterKey,
  type PaletteKey,
  type SaveDataInput,
  type SaveErrorCode,
  type SaveSlot,
  type SaveSlotId,
  type SaveSlotSummary,
} from './types';
