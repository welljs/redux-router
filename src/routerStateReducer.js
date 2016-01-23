import { ROUTER_DID_CHANGE } from './constants';

export default function routerStateReducer(state = null, {type, payload}) {
  if (type === ROUTER_DID_CHANGE) {
    return {
      ...state, // In case not using combineReducers
      ...payload
    };
  }
  return state;
}
