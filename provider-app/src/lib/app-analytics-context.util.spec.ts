import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapColdAnalyticsSession,
  buildAnalyticsDeviceContext,
  hydrateAnalyticsAppVersion,
  markWarmAnalyticsSession,
  readAnalyticsSessionIdForTests,
  readAnalyticsStartTypeForTests,
  resetAnalyticsSessionContextForTests,
  resolveAnalyticsAppVersion,
  resolveAnalyticsLocale,
  resolveLifetimeUserType,
} from './app-analytics-context.util';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    },
  });
}

describe('app-analytics-context.util (adopt-1.2)', () => {
  beforeEach(() => {
    installLocalStorageMock();
    resetAnalyticsSessionContextForTests();
    localStorage.clear();
    vi.stubGlobal('navigator', { language: 'hy-AM' });
  });

  it('resolves locale from explicit override then device fallback', () => {
    expect(resolveAnalyticsLocale('ru')).toBe('ru');
    expect(resolveAnalyticsLocale()).toBe('hy-AM');
  });

  it('keeps userType stable across events in one session', () => {
    bootstrapColdAnalyticsSession();
    const ctx = { appSurface: 'provider_app' as const, businessId: 'biz-1', locale: 'en' };
    const a = buildAnalyticsDeviceContext(ctx);
    const b = buildAnalyticsDeviceContext(ctx);
    expect(a.userType).toBe('first_open');
    expect(b.userType).toBe('first_open');
    expect(a.sessionId).toBe(b.sessionId);
  });

  it('marks lifetime first_open then returning on subsequent cold boots', () => {
    expect(resolveLifetimeUserType()).toBe('first_open');
    resetAnalyticsSessionContextForTests();
    localStorage.setItem('app-analytics-first-open', '1');
    expect(resolveLifetimeUserType()).toBe('returning');
  });

  it('marks warm resume without changing lifetime userType', () => {
    bootstrapColdAnalyticsSession();
    resolveLifetimeUserType();
    markWarmAnalyticsSession();
    const ctx = { appSurface: 'provider_app' as const, locale: 'en' };
    expect(buildAnalyticsDeviceContext(ctx).startType).toBe('warm');
    expect(buildAnalyticsDeviceContext(ctx).userType).toBe('first_open');
  });

  it('switches startType to warm on resume without rotating session id', () => {
    bootstrapColdAnalyticsSession();
    const sessionId = readAnalyticsSessionIdForTests();
    markWarmAnalyticsSession();
    expect(readAnalyticsStartTypeForTests()).toBe('warm');
    expect(readAnalyticsSessionIdForTests()).toBe(sessionId);
  });

  it('hydrates and caches app version from env', async () => {
    vi.stubEnv('VITE_APP_VERSION', '1.2.3');
    await expect(hydrateAnalyticsAppVersion()).resolves.toBe('1.2.3');
    expect(resolveAnalyticsAppVersion()).toBe('1.2.3');
    vi.unstubAllEnvs();
  });

  it('reads app version from VITE_APP_VERSION when set', () => {
    vi.stubEnv('VITE_APP_VERSION', '2.1.0');
    expect(resolveAnalyticsAppVersion()).toBe('2.1.0');
    vi.unstubAllEnvs();
  });
});
