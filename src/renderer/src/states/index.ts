import { StateMachine, type GameStateId, type StateFactories } from '../core/state';
import type { StateContext } from '../core/state';
import { TitleState } from './title-state';
import { MainMenuState } from './main-menu-state';
import { GameStateImpl } from './game-state';
import { DialogState } from './dialog-state';
import { MenuPauseState } from './menu-pause-state';
import { GameOverState } from './game-over-state';

/**
 * Wires the 6 concrete states into a registry the StateMachine can use to
 * re-instantiate a fresh state on every transition.
 */
const factories: StateFactories = {
  title: () => new TitleState(),
  'main-menu': () => new MainMenuState(),
  game: () => new GameStateImpl(),
  dialog: () => new DialogState(),
  'menu-pause': () => new MenuPauseState(),
  'game-over': () => new GameOverState(),
};

export const createStateMachine = (ctx: StateContext, initial: GameStateId = 'title'): StateMachine =>
  new StateMachine(factories, ctx, initial);

export { TitleState } from './title-state';
export { MainMenuState } from './main-menu-state';
export { GameStateImpl as GameState } from './game-state';
export { DialogState } from './dialog-state';
export { MenuPauseState } from './menu-pause-state';
export { GameOverState } from './game-over-state';
