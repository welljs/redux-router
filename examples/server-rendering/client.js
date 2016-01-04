import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose } from 'redux';
import { browserHistory } from 'react-router';

import {
  ReduxRouter,
  reduxRouterEnhancer,
} from '../../src/index'; // 'redux-router'

import { Provider } from 'react-redux';
import { devTools } from 'redux-devtools';
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';

import routes from './routes';
import reducer from './reducer';
import {MOUNT_ID} from './constants';

const store = compose(
  reduxRouterEnhancer({ history: browserHistory }),
  devTools()
)(createStore)(reducer, window.__initialState);

const rootComponent = (
  <Provider store={store}>
    <ReduxRouter history={browserHistory} routes={routes} />
  </Provider>
);

const mountNode = document.getElementById(MOUNT_ID);

// First render to match markup from server
ReactDOM.render(rootComponent, mountNode);
// Optional second render with dev-tools
ReactDOM.render((
  <div>
    {rootComponent}
    <DebugPanel top right bottom>
      <DevTools store={store} monitor={LogMonitor} />
    </DebugPanel>
  </div>
), mountNode);
