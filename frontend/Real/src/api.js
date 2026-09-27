/**
 * api.js — Axios API client
 */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const getUser   = (userId) => api.get(`/api/user/${userId}`);
export const createUser= (name)   => api.post('/api/user/create', { name });
export const executeTrade = (payload) => api.post('/api/trade', payload);

export default api;
