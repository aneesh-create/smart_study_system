import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Inject JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('studyai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('studyai_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
