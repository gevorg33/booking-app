import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/** Android emulator uses 10.0.2.2; physical devices need your Mac LAN IP in VITE_API_URL. */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && /localhost|127\.0\.0\.1/.test(envUrl)) {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return envUrl;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';
    const isAuth = ['/auth/login', '/auth/google', '/auth/forgot-password'].some((p) => url.includes(p));
    if (error.response?.status === 401 && !isAuth) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(data: unknown): T {
  return ((data as { data?: T })?.data ?? data) as T;
}

export default api;
