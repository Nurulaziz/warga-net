import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Axios instance untuk API calls (non-auth)
// Better Auth mengelola session via cookies secara otomatis
export const api = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Kirim cookies untuk session Better Auth
});

// Response interceptor — handle 401 redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired, redirect ke login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
