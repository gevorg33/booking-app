import axios from 'axios';
import { LOCALE_COOKIE } from '@/i18n';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

function readLocaleFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const raw = localStorage.getItem('auth-store');
        if (raw) token = JSON.parse(raw)?.state?.token ?? null;
      } catch {
        /* ignore */
      }
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const locale = readLocaleFromCookie();
    if (locale) config.headers['Accept-Language'] = locale;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

function getClientLocale(): string {
  return readLocaleFromCookie() || 'en';
}

export { getClientLocale };
