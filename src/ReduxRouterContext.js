import React, { Component, PropTypes } from 'react';
import { RouterContext } from 'react-router';
import { connect } from 'react-redux';

import routerStateEquals from './routerStateEquals';
import { routerDidChange } from './actionCreators';
import { ROUTER_STATE_SELECTOR } from './constants';

function memoizeRouterStateSelector(selector) {
  let previousRouterState = null;

  return state => {
    const nextRouterState = selector(state);
    if (routerStateEquals(previousRouterState, nextRouterState)) {
      return previousRouterState;
    }
    previousRouterState = nextRouterState;
    return nextRouterState;
  };
}

function routerPropsFromProps(props) {
  return {
    location: props.location,
    params: props.params,
  };
}

// Only job is to pass down the selector, in here because <ReduxRouter>
// is not used in server-side rendering
class ReduxRouterContextWrapper extends Component {
  static contextTypes = {
    store: PropTypes.object
  }

  render() {
    const { store } = this.context;

    if (!store) {
      throw new Error(
        'Redux store missing from context of <ReduxRouter>. Make sure you\'re '
        + 'using a <Provider>'
      );
    }

    const { [ROUTER_STATE_SELECTOR]: routerStateSelector } = store;

    if (!routerStateSelector) {
      throw new Error(
          'Redux store not configured properly for <ReduxRouter>. Make sure '
          + 'you\'re using the reduxRouterEnhancer store enhancer.'
      );
    }

    return (
        <ReduxRouterContext
            routerStateSelector={memoizeRouterStateSelector(routerStateSelector)}
            {...this.props}
        />
    );
  }
}

@connect(
  (state, { routerStateSelector }) => { return { routerState: routerStateSelector(state) }; },
  { routerDidChange }
)
class ReduxRouterContext extends Component {

  static propTypes = {
    router: PropTypes.object,
    // End Router State from React-Router
    // Start from Redux-Router
    routerDidChange: PropTypes.func.isRequired,
    routerState: PropTypes.object,
    // End from Redux-Router
  }

  componentWillMount() {
    this.props.routerDidChange(routerPropsFromProps(this.props));
  }

  componentWillReceiveProps(newProps) {
    if (!routerStateEquals(routerPropsFromProps(newProps), routerPropsFromProps(this.props)) &&
        !routerStateEquals(routerPropsFromProps(newProps), newProps.routerState)) {
      this.props.routerDidChange(routerPropsFromProps(newProps));
    } else if (!routerStateEquals(newProps.routerState, this.props.routerState) &&
               !routerStateEquals(routerPropsFromProps(newProps), newProps.routerState)) {
      if (newProps.routerState) {
        newProps.router.transitionTo(newProps.routerState.location);
      }
    }
  }

  render() {
    const { routerDidChange, routerState, ...others } = this.props;
    const newRouterProps = {
      ...others,
      ...routerState,
    };
    return <RouterContext {...newRouterProps} />;
  }
}

export default ReduxRouterContextWrapper;
