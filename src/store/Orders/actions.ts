import * as api from './api';

const createOrder = (payload) => () => api.createOrder(payload);
const getOrder = (orderId) => () => api.getById(orderId);
const getCustomerOrders = (customerId) => () => api.getCustomerOrders(customerId);
const getOrdersByRestaurants = (ids) => () => api.getOrdersByRestaurants(ids);
const getAvailableDeliveries = () => () => api.getAvailableDeliveries();
const getRiderActiveDelivery = (riderId) => () => api.getRiderActiveDelivery(riderId);
const updateOrderStatus = (orderId, status, updates) => () => api.updateStatus(orderId, status, updates);
const acceptDelivery = (orderId, riderId) => () => api.assignRider(orderId, riderId);
const validatePromo = (code, subtotal) => () => api.validatePromo(code, subtotal);

export {
  createOrder,
  getOrder,
  getCustomerOrders,
  getOrdersByRestaurants,
  getAvailableDeliveries,
  getRiderActiveDelivery,
  updateOrderStatus,
  acceptDelivery,
  validatePromo,
};
