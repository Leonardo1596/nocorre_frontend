import axios from 'axios';

const api = axios.create({
  baseURL: 'https://nocorre-backend-4w01.onrender.com',
  // baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nocorre_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nocorre_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;