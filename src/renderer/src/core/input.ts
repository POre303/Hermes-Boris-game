import type { InputSnapshot } from './state';

/**
 * Tracks physical key state and one-shot consumption for edge-triggered input.
 * - isDown(): true while the key is physically held.
 * - consume(): true exactly once per press (rising edge).
 */

type KeyState = 'up' | 'down' | 'consumed';

const keys = new Map<string, KeyState>();

const onKeyDown = (e: KeyboardEvent): void => {
  // Only register a fresh press when the key was previously up. Holding the key
  // fires keydown repeatedly on some platforms; we don't want each repeat to
  // reset the consume state.
  const prev = keys.get(e.code);
  if (prev !== 'down' && prev !== 'consumed') {
    keys.set(e.code, 'down');
  }
};

const onKeyUp = (e: KeyboardEvent): void => {
  keys.set(e.code, 'up');
};

const onBlur = (): void => {
  // Release all keys when the window loses focus, otherwise a stuck key
  // persists indefinitely.
  for (const code of keys.keys()) {
    keys.set(code, 'up');
  }
};

const installListeners = (): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
};

installListeners();

export const input: InputSnapshot = {
  isDown: (code) => {
    const s = keys.get(code);
    return s === 'down' || s === 'consumed';
  },
  consume: (code) => {
    const s = keys.get(code);
    if (s === 'down') {
      keys.set(code, 'consumed');
      return true;
    }
    return false;
  },
};
