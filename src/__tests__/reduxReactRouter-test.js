import {
  ReduxRouter,
  reduxRouterEnhancer,
  routerStateReducer,
  push,
  replace,
  isActive
} from '../';

import React from 'react';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Route } from 'react-router';
import createHistory from 'react-router/lib/createMemoryHistory';
import useBasename from 'history/lib/useBasename';

import jsdom from 'mocha-jsdom';
import sinon from 'sinon';
import { renderIntoDocument } from 'react-addons-test-utils';

const routes = (
  <Route path="/">
    <Route path="parent">
      <Route path="child/:id"/>
    </Route>
  </Route>
);

describe('reduxRouter()', () => {
  jsdom();

  it('adds router state to Redux store', () => {
    const reducer = combineReducers({
      router: routerStateReducer
    });

    const history = createHistory();

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    const historySpy = sinon.spy();
    history.listen(() => historySpy());

    expect(historySpy.callCount).to.equal(1);

    renderIntoDocument(
        <Provider store={store}>
          <ReduxRouter history={history} >
            {routes}
          </ReduxRouter>
        </Provider>
    );

    expect(store.getState().router.location.pathname).to.equal('/');

    history.push({ pathname: '/parent' });
    expect(store.getState().router.location.pathname).to.equal('/parent');
    expect(historySpy.callCount).to.equal(2);

    store.dispatch(push({ pathname: '/parent/child/123', query: { key: 'value' } }));
    expect(historySpy.callCount).to.equal(3);
    expect(store.getState().router.location.pathname)
      .to.equal('/parent/child/123');
    expect(store.getState().router.location.query).to.eql({ key: 'value' });
    expect(store.getState().router.params).to.eql({ id: '123' });
  });

  it('detects external router state changes', () => {
    const baseReducer = combineReducers({
      router: routerStateReducer
    });

    const EXTERNAL_STATE_CHANGE = 'EXTERNAL_STATE_CHANGE';

    const externalState = {
      location: {
        pathname: '/parent/child/123',
        query: { key: 'value' },
        key: 'lolkey'
      }
    };

    const reducerSpy = sinon.spy();
    function reducer(state, action) {
      reducerSpy();

      if (action.type === EXTERNAL_STATE_CHANGE) {
        return { ...state, router: action.payload };
      }

      return baseReducer(state, action);
    }

    const history = createHistory();
    const historySpy = sinon.spy();

    let historyState;
    history.listen(s => {
      historySpy();
      historyState = s;
    });

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    expect(reducerSpy.callCount).to.equal(1);
    expect(historySpy.callCount).to.equal(1);

    store.dispatch({
      type: EXTERNAL_STATE_CHANGE,
      payload: externalState
    });

    expect(reducerSpy.callCount).to.equal(2);
    expect(historySpy.callCount).to.equal(2);
    expect(historyState.pathname).to.equal('/parent/child/123');
    expect(historyState.search).to.equal('?key=value');
  });

  it('works with navigation action creators', () => {
    const reducer = combineReducers({
      router: routerStateReducer
    });

    const history = createHistory();

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    const historySpy = sinon.spy();
    history.listen(() => historySpy());

    expect(historySpy.callCount).to.equal(1);

    renderIntoDocument(
        <Provider store={store}>
          <ReduxRouter history={history} >
            {routes}
          </ReduxRouter>
        </Provider>
    );

    store.dispatch(push({ pathname: '/parent/child/123', query: { key: 'value' } }));
    expect(store.getState().router.location.pathname)
      .to.equal('/parent/child/123');
    expect(store.getState().router.location.query).to.eql({ key: 'value' });
    expect(store.getState().router.params).to.eql({ id: '123' });

    store.dispatch(replace({ pathname: '/parent/child/321', query: { key: 'value2'} }));
    expect(store.getState().router.location.pathname)
      .to.equal('/parent/child/321');
    expect(store.getState().router.location.query).to.eql({ key: 'value2' });
    expect(store.getState().router.params).to.eql({ id: '321' });
  });

  it('doesn\'t interfere with other actions', () => {
    const APPEND_STRING = 'APPEND_STRING';

    function stringBuilderReducer(state = '', action) {
      if (action.type === APPEND_STRING) {
        return state + action.string;
      }
      return state;
    }

    const reducer = combineReducers({
      router: routerStateReducer,
      string: stringBuilderReducer
    });

    const history = createHistory();

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    store.dispatch({ type: APPEND_STRING, string: 'Uni' });
    store.dispatch({ type: APPEND_STRING, string: 'directional' });
    expect(store.getState().string).to.equal('Unidirectional');
  });

  it('stores the latest state in routerState', () => {
    const reducer = combineReducers({
      router: routerStateReducer
    });

    const history = createHistory();

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    const historySpy = sinon.spy();
    history.listen(() => historySpy());

    expect(historySpy.callCount).to.equal(1);

    renderIntoDocument(
        <Provider store={store}>
          <ReduxRouter history={history} >
            {routes}
          </ReduxRouter>
        </Provider>
    );

    let historyState;
    history.listen(s => {
      historyState = s;
    });

    store.dispatch(push({ pathname: '/parent' }));

    historyState = null;

    store.dispatch({ type: 'RANDOM_ACTION' });
    expect(historyState).to.equal(null);
  });

  it('handles async middleware', (done) => {
    const reducer = combineReducers({
      router: routerStateReducer
    });

    const history = createHistory();

    const historySpy = sinon.spy();
    history.listen(() => historySpy());

    expect(historySpy.callCount).to.equal(1);

    const store = compose(
      reduxRouterEnhancer({
        history,
      }),
      applyMiddleware(
        () => next => action => setTimeout(() => next(action), 0)
      )
    )(createStore)(reducer);

    renderIntoDocument(
        <Provider store={store}>
          <ReduxRouter history={history} >
            {routes}
          </ReduxRouter>
        </Provider>
    );

    history.push({ pathname: '/parent' });
    expect(historySpy.callCount).to.equal(2);

    setTimeout(() => {
      expect(historySpy.callCount).to.equal(2);
      done();
    }, 0);
  });

  it('accepts history object when using basename', () => {
    const reducer = combineReducers({
      router: routerStateReducer
    });

    const history = useBasename(createHistory)({
      basename: '/grandparent'
    });

    const store = reduxRouterEnhancer({
      history,
    })(createStore)(reducer);

    renderIntoDocument(
        <Provider store={store}>
          <ReduxRouter history={history} >
            {routes}
          </ReduxRouter>
        </Provider>
    );

    store.dispatch(push({ pathname: '/parent' }));
    expect(store.getState().router.location.pathname).to.eql('/parent');

    store.dispatch(push({ pathname: '/parent/child/123', query: { key: 'value' } }));
    expect(store.getState().router.location.pathname)
      .to.eql('/parent/child/123');
    expect(store.getState().router.location.basename).to.eql('/grandparent');
    expect(store.getState().router.location.query).to.eql({ key: 'value' });
    expect(store.getState().router.params).to.eql({ id: '123' });
  });

  describe('onEnter hook', () => {
    it('can perform redirects', () => {
      const reducer = combineReducers({
        router: routerStateReducer
      });

      const history = createHistory();

      const store = reduxRouterEnhancer({
        history,
      })(createStore)(reducer);

      const requireAuth = (nextState, _replaceState) => {
        _replaceState(null, '/login');
      };

      renderIntoDocument(
          <Provider store={store}>
            <ReduxRouter history={history} >
              <Route path="/">
                <Route path="parent">
                  <Route path="child/:id" onEnter={requireAuth}/>
                </Route>
                <Route path="login" />
              </Route>
            </ReduxRouter>
          </Provider>
      );

      store.dispatch(push({ pathname: '/parent/child/123', query: { key: 'value' } }));
      expect(store.getState().router.location.pathname)
        .to.equal('/login');
    });

    describe('isActive', () => {
      it('creates a selector for whether a pathname/query pair is active', () => {
        const reducer = combineReducers({
          router: routerStateReducer
        });

        const history = createHistory();

        const store = reduxRouterEnhancer({
          history,
        })(createStore)(reducer);

        renderIntoDocument(
            <Provider store={store}>
              <ReduxRouter history={history} >
                {routes}
              </ReduxRouter>
            </Provider>
        );

        const activeSelector = isActive('/parent', { key: 'value' });
        expect(activeSelector(store.getState().router)).to.be.false;
        store.dispatch(push({ pathname: '/parent', query: { key: 'value' } }));
        expect(activeSelector(store.getState().router)).to.be.true;
      });
    });
  });
});
