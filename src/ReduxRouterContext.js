import React, { Component, PropTypes } from 'react';
import { RouterContext } from 'react-router';
import { connect } from 'react-redux';

import routerStateEquals from './routerStateEquals';
import { routerDidChange } from './actionCreators';

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

// Only job is to pass down the selector, in here because <ReduxRouter> is not used in server-side rendering
class ReduxRouterContextWrapper extends Component {
  static propTypes = {
    routerStateSelector: PropTypes.func,
  }

  static defaultProps = {
    routerStateSelector: state => state.router,
  }

  render() {

    return (
        <ReduxRouterContext
            routerStateSelector={memoizeRouterStateSelector(this.props.routerStateSelector)}
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
    routerDidChange: PropTypes.func.isRequired,
    routerState: PropTypes.object,
  }

  componentWillMount() {
    // On mount, sync to the store to React-Router props
    this.props.routerDidChange(routerPropsFromProps(this.props));
  }

  componentWillReceiveProps(newProps) {
    // If we have new routing props from React-Router and it doesnt match our store, Update the store
    if (!routerStateEquals(routerPropsFromProps(newProps), routerPropsFromProps(this.props)) &&
        !routerStateEquals(routerPropsFromProps(newProps), newProps.routerState)) {
      this.props.routerDidChange(routerPropsFromProps(newProps));
    // If we have a new store state and it doesnt match the next routing props, transition the router to it
    // This is common when replaying devTools
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
      ...routerState, // Override react-router's props with the store props
    };
    return <RouterContext {...newRouterProps} />;
  }
}

export default ReduxRouterContextWrapper;
