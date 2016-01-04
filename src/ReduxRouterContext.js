import React, { Component, PropTypes } from 'react';
import { RouterContext } from 'react-router';
import { connect } from 'react-redux';

import routerStateEquals from './routerStateEquals';
import { routerDidChange } from './actionCreators';

function routerPropsFromProps(props) {
  return {
    location: props.location,
    routes: props.routes,
    params: props.params,
    components: props.components
  };
}

@connect(
  false,
  { routerDidChange }
)
class ReduxRouterContext extends Component {

  static propTypes = {
    // Start Router State from React-Router
    location: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    components: PropTypes.array.isRequired,
    // End Router State from React-Router
    // Start from Redux-Router
    routerDidChange: PropTypes.func.isRequired
    // End from Redux-Router
  }

  componentWillMount() {
    this.props.routerDidChange(routerPropsFromProps(this.props));
  }

  componentWillReceiveProps(newProps) {
    if (!routerStateEquals(routerPropsFromProps(newProps), routerPropsFromProps(this.props))) {
      this.props.routerDidChange(routerPropsFromProps(newProps));
    }
  }

  render() {
    return <RouterContext {...this.props} />;
  }
}

export default ReduxRouterContext;
