import * as api from './api';

const createAddress = (payload) => () => api.createAddress(payload);
const getProfileStats = (user) => () => api.getProfileStats(user);
const getRiderToday = (riderId) => () => api.getRiderToday(riderId);
const getRiderEarnings = (riderId) => () => api.getRiderEarnings(riderId);

export { createAddress, getProfileStats, getRiderToday, getRiderEarnings };
