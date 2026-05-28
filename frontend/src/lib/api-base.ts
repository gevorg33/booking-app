/** Resolve API base URL — on mobile/Capacitor use the same host as the WebView. */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  const { hostname, protocol } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
}
