import * as api from './api';

const getAllRestaurants = () => () => api.getAllRestaurants();
const setRestaurantVerified = (id, verified) => () => api.setRestaurantVerified(id, verified);
const getAllRiders = () => () => api.getAllRiders();
const setRiderVerified = (id, verified) => () => api.setRiderVerified(id, verified);
const getAllUsers = () => () => api.getAllUsers();
const getAllOrders = () => () => api.getAllOrders();
const cancelOrder = (id, reason, wasPaid) => () => api.cancelOrder(id, reason, wasPaid);
const getSettings = () => () => api.getSettings();
const updateSettings = (updates) => () => api.updateSettings(updates);
const getStats = () => () => api.getStats();

export {
  getAllRestaurants,
  setRestaurantVerified,
  getAllRiders,
  setRiderVerified,
  getAllUsers,
  getAllOrders,
  cancelOrder,
  getSettings,
  updateSettings,
  getStats,
};
