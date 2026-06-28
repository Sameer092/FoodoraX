const setLocation = (location) => (dispatch) => {
  dispatch({ type: 'SET_LOCATION', payload: location });
};

const setAddress = (address) => (dispatch) => {
  dispatch({ type: 'SET_ADDRESS', payload: address });
};

const setUnread = (count) => (dispatch) => {
  dispatch({ type: 'SET_UNREAD', payload: count });
};

export { setLocation, setAddress, setUnread };
