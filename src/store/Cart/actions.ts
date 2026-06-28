const addToCart = (menuItem, restaurant) => (dispatch) => {
  dispatch({ type: 'CART_ADD', payload: { menuItem, restaurant } });
};

const updateQuantity = (id, quantity) => (dispatch) => {
  dispatch({ type: 'CART_UPDATE_QTY', payload: { id, quantity } });
};

const removeFromCart = (id) => (dispatch) => {
  dispatch({ type: 'CART_REMOVE', payload: id });
};

const setPromo = (promo) => (dispatch) => {
  dispatch({ type: 'CART_SET_PROMO', payload: promo });
};

const setDiscount = (discount) => (dispatch) => {
  dispatch({ type: 'CART_SET_DISCOUNT', payload: discount });
};

const clearCart = () => (dispatch) => {
  dispatch({ type: 'CART_CLEAR' });
};

export { addToCart, updateQuantity, removeFromCart, setPromo, setDiscount, clearCart };
