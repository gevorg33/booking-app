const DEFAULT_DASHBOARD_ORIGIN = 'http://127.0.0.1:3000';

export function resolveProviderDashboardOrigin(): string {
  const configured = import.meta.env.VITE_DASHBOARD_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.port === '3001') {
        parsed.port = '3000';
        return parsed.origin;
      }
      return parsed.origin;
    } catch {
      // fall through
    }
  }

  return DEFAULT_DASHBOARD_ORIGIN;
}

export function buildProviderDashboardUrl(relativePath: string): string {
  const origin = resolveProviderDashboardOrigin();
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${origin}${path}`;
}
