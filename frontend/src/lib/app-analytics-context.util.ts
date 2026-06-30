import type {
  AppAnalyticsContext,
  AppAnalyticsPlatform,
  AppAnalyticsStartType,
  AppAnalyticsUserType,
} from './app-analytics';

export interface AppAnalyticsDeviceContext {
  platform: AppAnalyticsPlatform;
  appVersion?: string;
  locale: string;
  tenantSlug?: string;
  sessionId: string;
  startType: AppAnalyticsStartType;
  userType: AppAnalyticsUserType;
}

const FIRST_OPEN_PREFIX = 'app-analytics-first-open-';

let sessionId = createAnalyticsSessionId();
let sessionStartType: AppAnalyticsStartType = 'cold';
const lifetimeUserTypeByTenant = new Map<string, AppAnalyticsUserType>();

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createAnalyticsSessionId(): string {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveAppAnalyticsPlatform(): AppAnalyticsPlatform {
  return 'web';
}

export function resolveAnalyticsLocale(explicit?: string): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed.slice(0, 16);
  if (typeof navigator !== 'undefined') {
    const device = navigator.language?.trim();
    if (device) return device.slice(0, 16);
  }
  return 'en';
}

export function resolveAnalyticsAppVersion(explicit?: string): string | undefined {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed.slice(0, 32);
  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  if (typeof envVersion === 'string' && envVersion.trim()) {
    return envVersion.trim().slice(0, 32);
  }
  return undefined;
}

export function resolveLifetimeUserType(tenantSlug: string): AppAnalyticsUserType {
  const cached = lifetimeUserTypeByTenant.get(tenantSlug);
  if (cached) return cached;
  const storage = getStorage();
  const key = `${FIRST_OPEN_PREFIX}${tenantSlug}`;
  const userType: AppAnalyticsUserType = storage?.getItem(key) ? 'returning' : 'first_open';
  if (userType === 'first_open') storage?.setItem(key, '1');
  lifetimeUserTypeByTenant.set(tenantSlug, userType);
  return userType;
}

export function bootstrapColdAnalyticsSession(): void {
  sessionId = createAnalyticsSessionId();
  sessionStartType = 'cold';
}

export function markWarmAnalyticsSession(): void {
  sessionStartType = 'warm';
}

export function buildAnalyticsDeviceContext(
  ctx: AppAnalyticsContext,
  tenantSlug: string,
): AppAnalyticsDeviceContext {
  return {
    platform: resolveAppAnalyticsPlatform(),
    appVersion: resolveAnalyticsAppVersion(ctx.appVersion),
    locale: resolveAnalyticsLocale(ctx.locale),
    tenantSlug: ctx.tenantSlug,
    sessionId,
    startType: sessionStartType,
    userType: resolveLifetimeUserType(tenantSlug),
  };
}

export function resetAnalyticsSessionContextForTests(): void {
  sessionId = 'sess-test';
  sessionStartType = 'cold';
  lifetimeUserTypeByTenant.clear();
}

export function readAnalyticsSessionIdForTests(): string {
  return sessionId;
}

export function readAnalyticsStartTypeForTests(): AppAnalyticsStartType {
  return sessionStartType;
}
