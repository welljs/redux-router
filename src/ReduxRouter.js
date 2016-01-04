import React, { Component } from 'react';
import { Router } from 'react-router';
import ReduxRouterContext from './ReduxRouterContext';

class ReduxRouter extends Component {

  render() {
    return (<Router render={props => <ReduxRouterContext {...props} />}
                   {...this.props}
           />);
  }
}

export default ReduxRouter;
