import * as api from './api';

const getRestaurants = (filters) => () => api.getRestaurants(filters);
const getFeatured = () => () => api.getFeatured();
const getNearby = (lat, lon) => () => api.getNearby(lat, lon);
const getRestaurant = (id) => () => api.getById(id);
const getRestaurantsByOwner = (ownerId) => () => api.getByOwner(ownerId);
const createRestaurant = (payload) => () => api.createRestaurant(payload);
const updateRestaurant = (id, updates) => () => api.updateRestaurant(id, updates);
const createMenuItem = (item) => () => api.createMenuItem(item);
const updateMenuItem = (id, updates) => () => api.updateMenuItem(id, updates);
const deleteMenuItem = (id) => () => api.deleteMenuItem(id);
const getReviews = (restaurantId) => () => api.getReviews(restaurantId);
const getReviewByOrder = (orderId) => () => api.getReviewByOrder(orderId);
const createReview = (review) => () => api.createReview(review);
const getFavorites = (userId) => () => api.getFavorites(userId);
const toggleFavorite = (userId, restaurantId) => () => api.toggleFavorite(userId, restaurantId);

export {
  getRestaurants,
  getFeatured,
  getNearby,
  getRestaurant,
  getRestaurantsByOwner,
  createRestaurant,
  updateRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getReviews,
  getReviewByOrder,
  createReview,
  getFavorites,
  toggleFavorite,
};
