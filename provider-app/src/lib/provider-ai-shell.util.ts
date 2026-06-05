import type { ProviderMobileRoute } from './provider-ai-quick-chips';

/** Map Ionic tab path to quick-chip route (ai-m3 / ai-m6). */
export function providerRouteFromPath(pathname: string): ProviderMobileRoute {
  if (pathname.includes('/schedule')) return 'schedule';
  if (pathname.includes('/profile')) return 'profile';
  if (pathname.includes('/gift-cards')) return 'gift-cards';
  return 'today';
}
