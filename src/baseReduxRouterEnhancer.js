import { applyMiddleware } from 'redux';
import historyMiddleware from './historyMiddleware';
import { ROUTER_STATE_SELECTOR } from './constants';

export default function baseReduxRouterEnhancer({
  history,
  routerStateSelector
  }) {
  return createStore => (reducer, initialState) => {

    const store =
      applyMiddleware(
        historyMiddleware(history)
      )(createStore)(reducer, initialState);

    store.history = history;
    store[ROUTER_STATE_SELECTOR] = routerStateSelector;

    return store;
  };
}

