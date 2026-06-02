import axios from 'axios';
import { LOCALE_COOKIE } from '@/i18n';
import { getApiBaseUrl } from '@/lib/api-base';
import { attachOperationFeedbackToAxios } from '@/lib/operation-feedback';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

if (typeof window !== 'undefined') {
  attachOperationFeedbackToAxios(api);
}

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
    const requestUrl = error.config?.url ?? '';
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/switch-business'].some((path) => requestUrl.includes(path));

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isAuthRequest
    ) {
      localStorage.removeItem('token');
      const loginPath = window.location.pathname.startsWith('/provider')
        ? '/provider/login'
        : '/login';
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  },
);

export default api;

function getClientLocale(): string {
  return readLocaleFromCookie() || 'en';
}

export { getClientLocale };
