import axios from 'axios';

const getApiBaseURL = () => {
  return window.location.pathname.startsWith('/projects/eventsphere') ? '/projects/eventsphere/api' : '/api';
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || getApiBaseURL(),
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = window.location.pathname.startsWith('/projects/eventsphere') ? '/projects/eventsphere/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
