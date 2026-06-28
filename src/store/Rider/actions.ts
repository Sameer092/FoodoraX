import * as api from './api';

const getStatus = (riderId) => () => api.getStatus(riderId);
const setStatus = (riderId, status) => () => api.setStatus(riderId, status);
const getPayoutRates = () => () => api.getPayoutRates();

export { getStatus, setStatus, getPayoutRates };
