import { describe, it, expect } from 'vitest';
import {
  StateMachine,
  QUIT_SENTINEL,
  type GameState,
  type GameStateId,
  type NextState,
  type StateContext,
  type StateFactories,
} from './state';
import { makeCtx } from './__mocks__/canvas';

class StubState implements GameState {
  readonly id: GameStateId;
  nextId: NextState;
  enterCount = 0;
  updateCount = 0;
  renderCount = 0;
  exitCount = 0;
  lastDt = 0;

  constructor(id: GameStateId, nextId: NextState = null) {
    this.id = id;
    this.nextId = nextId;
  }

  enter(_ctx: StateContext): void {
    this.enterCount++;
  }
  update(_ctx: StateContext, dtMs: number): void {
    this.updateCount++;
    this.lastDt = dtMs;
  }
  render(_ctx: StateContext): void {
    this.renderCount++;
  }
  exit(_ctx: StateContext): NextState {
    this.exitCount++;
    return this.nextId;
  }
}

const allIds: GameStateId[] = ['title', 'main-menu', 'game', 'dialog', 'menu-pause', 'game-over'];

const makeFactories = (
  overrides: Partial<Record<GameStateId, () => StubState>> = {},
): StateFactories => {
  const defaults: Record<GameStateId, () => StubState> = Object.fromEntries(
    allIds.map((id) => [id, () => new StubState(id)]),
  ) as Record<GameStateId, () => StubState>;
  return { ...defaults, ...overrides } as StateFactories;
};

describe('StateMachine', () => {
  it('starts with the initial state and calls enter exactly once', () => {
    const titleStub = new StubState('title');
    const m = new StateMachine(makeFactories({ title: () => titleStub }), makeCtx(), 'title');
    expect(m.getCurrent().id).toBe('title');
    expect(titleStub.enterCount).toBe(1);
  });

  it('calls update then exit on each update()', () => {
    const s = new StubState('title');
    const m = new StateMachine(makeFactories({ title: () => s }), makeCtx(), 'title');
    m.update(16);
    expect(s.updateCount).toBe(1);
    expect(s.exitCount).toBe(1);
    expect(s.lastDt).toBe(16);
  });

  it('transitions when exit returns a different id; new state.enter runs once', () => {
    const title = new StubState('title', 'game');
    const game = new StubState('game');
    const m = new StateMachine(
      makeFactories({ title: () => title, game: () => game }),
      makeCtx(),
      'title',
    );
    expect(m.getCurrent().id).toBe('title');
    m.update(16);
    expect(m.getCurrent().id).toBe('game');
    expect(title.exitCount).toBe(1);
    expect(game.enterCount).toBe(1);
    expect(game.updateCount).toBe(0); // not updated this frame
  });

  it('does not transition when exit returns null', () => {
    const s = new StubState('title', null);
    const m = new StateMachine(makeFactories({ title: () => s }), makeCtx(), 'title');
    m.update(16);
    expect(m.getCurrent().id).toBe('title');
    expect(s.enterCount).toBe(1); // No re-enter
  });

  it('does not transition (and does not re-enter) when exit returns the same id', () => {
    const s = new StubState('title', 'title');
    const m = new StateMachine(makeFactories({ title: () => s }), makeCtx(), 'title');
    m.update(16);
    expect(s.enterCount).toBe(1);
    expect(m.getCurrent().id).toBe('title');
  });

  it('triggers ctx.quit when exit returns QUIT_SENTINEL', () => {
    const s = new StubState('title', QUIT_SENTINEL);
    let quitCount = 0;
    const ctx = makeCtx({ quit: () => quitCount++ });
    const m = new StateMachine(makeFactories({ title: () => s }), ctx, 'title');
    m.update(16);
    expect(quitCount).toBe(1);
  });

  it('forceTransition swaps state and calls enter on the new state', () => {
    const title = new StubState('title');
    const game = new StubState('game');
    const m = new StateMachine(
      makeFactories({ title: () => title, game: () => game }),
      makeCtx(),
      'title',
    );
    m.forceTransition('game');
    expect(m.getCurrent().id).toBe('game');
    expect(game.enterCount).toBe(1);
  });

  it('forceTransition to the current id is a no-op (no re-enter)', () => {
    const title = new StubState('title');
    const m = new StateMachine(makeFactories({ title: () => title }), makeCtx(), 'title');
    m.forceTransition('title');
    expect(title.enterCount).toBe(1);
  });

  it('render() delegates to the current state', () => {
    const s = new StubState('title');
    const m = new StateMachine(makeFactories({ title: () => s }), makeCtx(), 'title');
    m.render();
    expect(s.renderCount).toBe(1);
  });
});
