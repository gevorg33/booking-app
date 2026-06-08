import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapColdAnalyticsSession,
  buildAnalyticsDeviceContext,
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

describe('app-analytics-context.util (adopt-1.2 public web)', () => {
  beforeEach(() => {
    installLocalStorageMock();
    resetAnalyticsSessionContextForTests();
    localStorage.clear();
    vi.stubGlobal('navigator', { language: 'hy-AM' });
  });

  it('resolves locale from explicit tenant override then device fallback', () => {
    expect(resolveAnalyticsLocale('ru')).toBe('ru');
    expect(resolveAnalyticsLocale()).toBe('hy-AM');
  });

  it('resolves app version from explicit context', () => {
    expect(resolveAnalyticsAppVersion('2.4.1')).toBe('2.4.1');
  });

  it('marks lifetime first_open then returning per tenant slug', () => {
    expect(resolveLifetimeUserType('salon-a')).toBe('first_open');
    resetAnalyticsSessionContextForTests();
    localStorage.setItem('app-analytics-first-open-salon-a', '1');
    expect(resolveLifetimeUserType('salon-a')).toBe('returning');
  });

  it('attaches stable session context to every event in a batch', () => {
    bootstrapColdAnalyticsSession();
    const ctx = {
      appSurface: 'public_web' as const,
      tenantSlug: 'salon-a',
      locale: 'hy',
      appVersion: '1.0.0',
    };
    const first = buildAnalyticsDeviceContext(ctx, 'salon-a');
    const second = buildAnalyticsDeviceContext(ctx, 'salon-a');
    expect(first.sessionId).toBe(second.sessionId);
    expect(first.userType).toBe(second.userType);
    expect(first).toMatchObject({
      platform: 'web',
      locale: 'hy',
      tenantSlug: 'salon-a',
      appVersion: '1.0.0',
      startType: 'cold',
      userType: 'first_open',
    });
  });

  it('switches startType to warm on resume without rotating session id', () => {
    bootstrapColdAnalyticsSession();
    const sessionId = readAnalyticsSessionIdForTests();
    markWarmAnalyticsSession();
    expect(readAnalyticsStartTypeForTests()).toBe('warm');
    expect(readAnalyticsSessionIdForTests()).toBe(sessionId);
  });

  it('reads app version from NEXT_PUBLIC_APP_VERSION when set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '2.1.0');
    expect(resolveAnalyticsAppVersion()).toBe('2.1.0');
    vi.unstubAllEnvs();
  });
});
