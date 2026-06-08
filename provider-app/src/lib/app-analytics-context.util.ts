import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
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

const FIRST_OPEN_KEY = 'app-analytics-first-open';

let sessionId = createAnalyticsSessionId();
let sessionStartType: AppAnalyticsStartType = 'cold';
let lifetimeUserType: AppAnalyticsUserType | null = null;
let cachedAppVersion: string | undefined;

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
  if (!Capacitor.isNativePlatform()) return 'web';
  return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
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
  if (cachedAppVersion) return cachedAppVersion;
  const envVersion = import.meta.env.VITE_APP_VERSION;
  if (typeof envVersion === 'string' && envVersion.trim()) {
    return envVersion.trim().slice(0, 32);
  }
  return undefined;
}

export async function hydrateAnalyticsAppVersion(): Promise<string | undefined> {
  const resolved = resolveAnalyticsAppVersion();
  if (resolved) {
    cachedAppVersion = resolved;
    return cachedAppVersion;
  }
  if (!Capacitor.isNativePlatform()) return undefined;
  try {
    const info = await CapacitorApp.getInfo();
    cachedAppVersion = info.version?.trim().slice(0, 32) || undefined;
  } catch {
    cachedAppVersion = undefined;
  }
  return cachedAppVersion;
}

export function resolveLifetimeUserType(): AppAnalyticsUserType {
  if (lifetimeUserType) return lifetimeUserType;
  const storage = getStorage();
  if (storage?.getItem(FIRST_OPEN_KEY)) {
    lifetimeUserType = 'returning';
    return lifetimeUserType;
  }
  storage?.setItem(FIRST_OPEN_KEY, '1');
  lifetimeUserType = 'first_open';
  return lifetimeUserType;
}

export function bootstrapColdAnalyticsSession(): void {
  sessionId = createAnalyticsSessionId();
  sessionStartType = 'cold';
  resolveLifetimeUserType();
}

export function markWarmAnalyticsSession(): void {
  sessionStartType = 'warm';
}

export function buildAnalyticsDeviceContext(
  ctx: AppAnalyticsContext,
): AppAnalyticsDeviceContext {
  return {
    platform: resolveAppAnalyticsPlatform(),
    appVersion: resolveAnalyticsAppVersion(ctx.appVersion),
    locale: resolveAnalyticsLocale(ctx.locale),
    tenantSlug: ctx.tenantSlug,
    sessionId,
    startType: sessionStartType,
    userType: resolveLifetimeUserType(),
  };
}

export function resetAnalyticsSessionContextForTests(): void {
  sessionId = 'sess-test';
  sessionStartType = 'cold';
  lifetimeUserType = null;
  cachedAppVersion = undefined;
}

export function readAnalyticsSessionIdForTests(): string {
  return sessionId;
}

export function readAnalyticsStartTypeForTests(): AppAnalyticsStartType {
  return sessionStartType;
}
