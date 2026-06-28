import * as api from './api';

const getNotifications = (userId) => () => api.getNotifications(userId);
const getUnreadCount = (userId) => () => api.getUnreadCount(userId);
const markAsRead = (id) => () => api.markAsRead(id);
const markAllAsRead = (userId) => () => api.markAllAsRead(userId);

export { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
