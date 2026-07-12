import type { ProviderMobileRoute } from './provider-ai-quick-chips';

export type ProviderTabId =
  | 'today'
  | 'gift-cards'
  | 'calendar'
  | 'schedule'
  | 'profile'
  | 'lab-collection'
  | 'lab-results'
  | 'clinic-tasks'
  | 'patients';

/** Tab route content keys (includes non-tab paths like notifications). */
export type ProviderTabContentPage = ProviderTabId | 'notifications' | 'patient-chart';

export function providerTabPath(tab: ProviderTabId): string {
  return `/tabs/${tab}`;
}

export function resolveProviderTabId(pathname: string): ProviderTabId {
  if (pathname.includes('/gift-cards')) return 'gift-cards';
  if (pathname.includes('/calendar')) return 'calendar';
  if (pathname.includes('/schedule')) return 'schedule';
  if (pathname.includes('/profile') || pathname.includes('/notifications')) return 'profile';
  if (pathname.includes('/lab-collection')) return 'lab-collection';
  if (pathname.includes('/lab-results')) return 'lab-results';
  if (pathname.includes('/clinic-tasks')) return 'clinic-tasks';
  if (pathname.includes('/patients')) return 'patients';
  return 'today';
}

/** AI quick-chip route (ai-m3 / ai-m6 / ai-cmd-provider-5.15.4). */
export function providerRouteFromPath(pathname: string): ProviderMobileRoute {
  const tab = resolveProviderTabId(pathname);
  if (tab === 'calendar') return 'calendar';
  if (tab === 'schedule') return 'schedule';
  if (tab === 'profile') return 'profile';
  if (tab === 'gift-cards') return 'gift-cards';
  if (tab === 'lab-collection') return 'lab-collection';
  if (tab === 'lab-results') return 'lab-results';
  if (tab === 'clinic-tasks') return 'clinic-tasks';
  if (tab === 'patients') return 'patients';
  return 'today';
}
