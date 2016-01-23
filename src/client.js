import { compose } from 'redux';
import baseReduxRouterEnhancer from './baseReduxRouterEnhancer';
import useDefaults from './useDefaults';

export default compose(
  useDefaults
)(baseReduxRouterEnhancer);
