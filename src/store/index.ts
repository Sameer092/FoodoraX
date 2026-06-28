import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import immutableTransform from 'redux-persist-transform-immutable';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '@store/reducers';

const persistConfig = {
  transforms: [immutableTransform()],
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['Loader', 'Restaurants', 'Orders', 'Admin', 'Rider'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const middlewares = [thunk];

const store = createStore(persistedReducer, compose(applyMiddleware(...middlewares)));
const persistor = persistStore(store);

export { store, persistor };
