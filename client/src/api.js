import axios from 'axios';

export const BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE,
});

export const errMsg = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  'Something went wrong';

export default api;
