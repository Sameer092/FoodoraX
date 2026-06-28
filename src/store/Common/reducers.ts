import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  currentLocation: null,
  selectedAddress: null,
  unread: 0,
};

function common(state = Map(initialMap), action) {
  switch (action.type) {
    case 'SET_LOCATION':
      return state.set('currentLocation', action.payload);
    case 'SET_ADDRESS':
      return state.set('selectedAddress', action.payload);
    case 'SET_UNREAD':
      return state.set('unread', action.payload);
    default:
      return state;
  }
}

export default combineReducers({ common });
