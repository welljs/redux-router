import { compose } from 'redux';
import routerStateEquals from './routerStateEquals';
import baseReduxRouterEnhancer from './baseReduxRouterEnhancer';
import useDefaults from './useDefaults';

function historySynchronization(next) {
  return options => createStore => (reducer, initialState) => {
    const { routerStateSelector } = options;
    const store = next(options)(createStore)(reducer, initialState);
    const { history } = store;

    let prevRouterState;
    let routerState;

    store.subscribe(() => {
      const nextRouterState = routerStateSelector(store.getState());

      if (
        nextRouterState &&
        prevRouterState !== nextRouterState &&
        !routerStateEquals(routerState, nextRouterState)
      ) {
        routerState = nextRouterState;
        const { state, pathname, query } = nextRouterState.location;
        history.replace({state, pathname, query});
      }
    });

    return store;
  };
}

export default compose(
  useDefaults,
  historySynchronization
)(baseReduxRouterEnhancer);
