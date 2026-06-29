/** Provider mobile tab id → guide-flow route prefix (ai-guide-1.4.2). */
export const PROVIDER_MOBILE_TAB_ROUTES: Readonly<Record<string, string>> = {
  today: '/tabs/today',
  calendar: '/tabs/calendar',
  schedule: '/tabs/schedule',
  profile: '/tabs/profile',
  'gift-cards': '/tabs/gift-cards',
  patients: '/tabs/patients',
  'lab-collection': '/tabs/lab-collection',
  'lab-results': '/tabs/lab-results',
  'clinic-tasks': '/tabs/clinic-tasks',
};

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readScreenContextRecord(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const nested = context?.screenContext;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return undefined;
  }
  return nested as Record<string, unknown>;
}

function normalizeProviderGuideRoute(route: string): string | undefined {
  if (route === '/accept-invite' || route === '/invite') return '/accept-invite';
  if (route.startsWith('/tabs')) return route.split('?')[0];
  return undefined;
}

function resolveTabRoute(tab: string | undefined): string | undefined {
  if (!tab) return undefined;
  return PROVIDER_MOBILE_TAB_ROUTES[tab] ?? `/tabs/${tab.replace(/^\//, '')}`;
}

/** Flatten provider API context + nested screenContext for guide route resolution. */
export function mergeProviderMobileGuideContext(
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const screen = readScreenContextRecord(context);
  return {
    ...(screen ?? {}),
    ...(context ?? {}),
    ...(screen?.route ? { route: screen.route } : {}),
    ...(readString(screen?.tab) ? { tab: readString(screen?.tab) } : {}),
    ...(readString(screen?.mobileRoute)
      ? { mobileRoute: readString(screen?.mobileRoute) }
      : {}),
  };
}

/**
 * Map provider mobile screenContext / mobileRoute to guide-flow route.
 * Today vs Calendar vs Schedule vs Profile (ai-guide-1.4.2).
 */
export function mapProviderMobileGuideRoute(
  context?: Record<string, unknown>,
): string | undefined {
  const merged = mergeProviderMobileGuideContext(context);

  const explicitRoute = readString(merged.route);
  if (explicitRoute) {
    const normalized = normalizeProviderGuideRoute(explicitRoute);
    if (normalized) return normalized;
  }

  const tab = readString(merged.tab);
  const tabRoute = resolveTabRoute(tab);
  if (tabRoute) return tabRoute;

  const mobileRoute = readString(merged.mobileRoute);
  if (mobileRoute === 'accept-invite' || mobileRoute === '/accept-invite') {
    return '/accept-invite';
  }
  if (mobileRoute) {
    const chipRoute = PROVIDER_MOBILE_TAB_ROUTES[mobileRoute];
    if (chipRoute) return chipRoute;
    if (mobileRoute.startsWith('/tabs')) {
      return normalizeProviderGuideRoute(mobileRoute);
    }
    return `/tabs/${mobileRoute.replace(/^\//, '')}`;
  }

  return undefined;
}

export function readProviderMobileRouteTab(
  context?: Record<string, unknown>,
): string | undefined {
  const merged = mergeProviderMobileGuideContext(context);
  const tab = readString(merged.tab);
  if (tab) return tab;

  const route = mapProviderMobileGuideRoute(context);
  if (!route?.startsWith('/tabs/')) return undefined;
  return route.slice('/tabs/'.length).split('/')[0];
}
