const DEFAULT_DEV_API = 'http://127.0.0.1:3001';

/** SSR / RSC — prefer 127.0.0.1 over localhost to avoid dual-stack ECONNREFUSED on macOS. */
export function getServerApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_DEV_API
  ).replace(/\/$/, '');
}

/** Resolve API base URL for browser requests. */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getServerApiBaseUrl();
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;

  const { hostname, protocol } = window.location;
  // LAN / Capacitor dev fallback — API on same host, port 3001
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }

  return DEFAULT_DEV_API;
}
