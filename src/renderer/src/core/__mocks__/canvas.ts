import type { InputSnapshot, StateContext } from '../state';

/**
 * Proxy-based mock for CanvasRenderingContext2D that records every method call.
 * Returning a Proxy means tests don't need to know which methods exist; any
 * call is captured into `calls` with the method name and arguments.
 */
export type CanvasCall = { method: string; args: unknown[] };

export const makeMockCtx2d = (): { ctx: CanvasRenderingContext2D; calls: CanvasCall[] } => {
  const calls: CanvasCall[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === '__calls') return calls;
      if (typeof prop === 'symbol') return undefined;
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args });
        return undefined;
      };
    },
    set(_target, prop, value) {
      calls.push({ method: String(prop), args: [value] });
      return true;
    },
  };
  const ctx = new Proxy({} as object, handler) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
};

/** Clear the recorded calls in place. */
export const clearCalls = (calls: CanvasCall[]): void => {
  calls.splice(0, calls.length);
};

/**
 * Minimal input mock with a __press helper for tests. Each press is one-shot
 * — consume returns true once, then the key is gone until pressed again.
 */
export interface MockInput extends InputSnapshot {
  __press: (code: string) => void;
  __pressed: () => readonly string[];
}

export const makeMockInput = (): MockInput => {
  const pressed = new Set<string>();
  return {
    isDown: (c) => pressed.has(c),
    consume: (c) => {
      if (!pressed.has(c)) return false;
      pressed.delete(c);
      return true;
    },
    __press: (c) => {
      pressed.add(c);
    },
    __pressed: () => Array.from(pressed),
  };
};

/** Test-flavored StateContext: exposes MockInput and the recorded calls list. */
export interface TestContext extends StateContext {
  readonly input: MockInput;
  readonly calls: CanvasCall[];
}

/** Build a complete StateContext with sensible defaults for tests. */
export const makeCtx = (overrides: Partial<StateContext> = {}): TestContext => {
  const { ctx, calls } = makeMockCtx2d();
  const input = makeMockInput();
  const store = new Map<string, unknown>();
  const quit = (): void => {};
  const canvas: HTMLCanvasElement =
    typeof document !== 'undefined'
      ? document.createElement('canvas')
      : ({ width: 480, height: 270 } as unknown as HTMLCanvasElement);

  const base: StateContext = {
    canvas,
    ctx2d: ctx,
    palette: ['#000000', '#ffffff', '#7c7c7c'],
    input,
    store,
    quit,
    audio: null,
  };
  return {
    ...base,
    ...overrides,
    input: (overrides.input as MockInput | undefined) ?? input,
    calls,
  } as TestContext;
};
