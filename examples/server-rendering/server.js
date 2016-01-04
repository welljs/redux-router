import express from 'express';
import webpack from 'webpack';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import { match } from 'react-router'
import { ReduxRouterContext } from '../../src/index'; // 'redux-router'
import qs from 'query-string';
import serialize from 'serialize-javascript';

import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import config from './webpack.config.clientDev';
import {MOUNT_ID} from './constants';
import reducer from './reducer';
import routes from './routes';

const app = express();
const compiler = webpack(config);

const getMarkup = (renderProps, store) => {
  const initialState = serialize(store.getState());

  const markup = renderToString(
    <Provider store={store} key="provider">
      <ReduxRouterContext {...renderProps} />
    </Provider>
  );

  return `<!doctype html>
    <html>
      <head>
        <title>Redux React Router – Server rendering Example</title>
      </head>
      <body>
        <div id="${MOUNT_ID}">${markup}</div>
        <script>window.__initialState = ${initialState};</script>
        <script src="/static/bundle.js"></script>
      </body>
    </html>
  `;
};

app.use(webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(webpackHotMiddleware(compiler));

app.use((req, res) => {
  const store = createStore(reducer);
  const query = qs.stringify(req.query);
  const url = req.path + (query.length ? '?' + query : '');

  match({ routes, location: url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      res.status(200).send(getMarkup(renderProps, store))
    } else {
      res.status(404).send('Not found')
    }
  });
});

app.listen(3000, 'localhost', error => {
  if (error) {
    console.log(error);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
