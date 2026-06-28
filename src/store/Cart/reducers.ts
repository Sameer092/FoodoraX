import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  restaurant: null,
  items: [],
  promo: null,
  discount: 0,
};

function addItem(items, menuItem) {
  const existing = items.find((i) => i.menuItem.id === menuItem.id);
  if (existing) {
    return items.map((i) =>
      i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i,
    );
  }
  return [...items, { id: menuItem.id, menuItem, quantity: 1 }];
}

function cart(state = Map(initialMap), action) {
  switch (action.type) {
    case 'CART_ADD':
      return state
        .set('restaurant', action.payload.restaurant)
        .set('items', addItem(state.get('items'), action.payload.menuItem));
    case 'CART_UPDATE_QTY': {
      const items = state
        .get('items')
        .map((i) => (i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i))
        .filter((i) => i.quantity > 0);
      return state.set('items', items).set('restaurant', items.length ? state.get('restaurant') : null);
    }
    case 'CART_REMOVE': {
      const items = state.get('items').filter((i) => i.id !== action.payload);
      return state.set('items', items).set('restaurant', items.length ? state.get('restaurant') : null);
    }
    case 'CART_SET_PROMO':
      return state.set('promo', action.payload);
    case 'CART_SET_DISCOUNT':
      return state.set('discount', action.payload);
    case 'CART_CLEAR':
      return Map(initialMap);
    default:
      return state;
  }
}

export default combineReducers({ cart });
