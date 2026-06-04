const DEFAULT_DEV_API = 'http://127.0.0.1:3001';

/** SSR / RSC — prefer 127.0.0.1 over localhost to avoid dual-stack ECONNREFUSED on macOS. */
export function getServerApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_DEV_API
  ).replace(/\/$/, '');
}

/** Resolve API base URL — on mobile/Capacitor use the same host as the WebView. */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getServerApiBaseUrl();
  }

  const { hostname, protocol } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }

  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_DEV_API;
}
