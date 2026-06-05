import { Capacitor } from '@capacitor/core';

export function getPublicApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'android' &&
    /localhost|127\.0\.0\.1/.test(envUrl)
  ) {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2').replace(/\/$/, '');
  }
  return envUrl.replace(/\/$/, '');
}
