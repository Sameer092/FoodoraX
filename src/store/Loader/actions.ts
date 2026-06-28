const showHUD = (status = '') => (dispatch) => {
  dispatch({ type: 'LOADER_ON', payload: { status } });
};

const hideHUD = () => (dispatch) => {
  dispatch({ type: 'LOADER_OFF' });
};

export { showHUD, hideHUD };
