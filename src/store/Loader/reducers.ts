import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  visible: false,
  status: '',
};

function loader(state = Map(initialMap), action) {
  switch (action.type) {
    case 'LOADER_ON':
      return state.set('visible', true).set('status', action.payload.status);
    case 'LOADER_OFF':
      return state.set('visible', false);
    default:
      return state;
  }
}

export default combineReducers({ loader });
