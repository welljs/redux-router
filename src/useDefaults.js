const defaults = {
  onError: error => { throw error; },
  routerStateSelector: state => state.router
};

export default function useDefaults(next) {
  return options => createStore => (reducer, initialState) => {
    const optionsWithDefaults = { ...defaults, ...options };

    return next({
      ...optionsWithDefaults,
    })(createStore)(reducer, initialState);
  };
}
