import { combineReducers } from 'redux';
import Loader from '@store/Loader/reducers';
import Auth from '@store/Auth/reducers';
import Common from '@store/Common/reducers';
import Cart from '@store/Cart/reducers';

const appReducer = combineReducers({
  Loader,
  Auth,
  Common,
  Cart,
});

const rootReducer = (state, action) => {
  if (action.type === 'RESET_STATE') {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
