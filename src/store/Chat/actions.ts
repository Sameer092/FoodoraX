import * as api from './api';

const getMessages = (orderId) => () => api.getMessages(orderId);
const sendMessage = (orderId, senderId, message) => () => api.sendMessage(orderId, senderId, message);

export { getMessages, sendMessage };
