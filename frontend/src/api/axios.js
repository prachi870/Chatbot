import axios from 'axios';

// In production VITE_API_BASE_URL points to the Render backend.
// In dev the Vite proxy rewrites /api → localhost:5000 so baseURL stays '/api'.
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise error responses so callers always get a plain message string
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    // Attach a normalised message so callers can do: catch(e) => e.message
    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
