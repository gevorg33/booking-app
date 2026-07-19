import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAppAnalyticsEventBody,
  buildAppAnalyticsIngestBody,
  configureAppAnalytics,
  flushAppAnalytics,
  getOrCreateAnonId,
  markAppAnalyticsWarmStart,
  resetAppAnalyticsForTests,
  syncAnalyticsConsentFromCookies,
  trackAppAnalyticsEvent,
} from './app-analytics';

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { recorded: 1 } }),
  },
}));

import axios from 'axios';

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

describe('app-analytics (frontend public web)', () => {
  beforeEach(() => {
    installLocalStorageMock();
    resetAppAnalyticsForTests();
    localStorage.clear();
    vi.mocked(axios.post).mockClear();
  });

  it('builds public web ingest payloads gated by cookie consent', () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
      cookieBannerEnabled: true,
    });

    trackAppAnalyticsEvent('app_opened');
    expect(
      buildAppAnalyticsIngestBody(
        { tenantSlug: 'salon-a', appSurface: 'public_web', locale: 'en' },
        [],
      ).events,
    ).toHaveLength(0);

    localStorage.setItem('cookie-consent-salon-a', 'accepted');
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
      cookieBannerEnabled: true,
    });
    expect(syncAnalyticsConsentFromCookies('salon-a')).toBe(true);
    trackAppAnalyticsEvent('started_booking', { serviceId: 'svc-1' });

    const body = buildAppAnalyticsIngestBody(
      { tenantSlug: 'salon-a', appSurface: 'public_web', locale: 'en' },
      [{ event: 'started_booking', props: { serviceId: 'svc-1' } }],
    );
    expect(body.events[0]?.appSurface).toBe('public_web');
    expect(body.events[0]?.platform).toBe('web');
    expect(body.events[0]?.props).toEqual({ serviceId: 'svc-1' });
    expect(body.events[0]?.sessionId).toBeTruthy();
    expect(body.events[0]?.startType).toBe('cold');
    expect(body.events[0]?.userType).toBe('first_open');
    expect(body.events[0]?.locale).toBe('en');
    expect(body.events[0]?.tenantSlug).toBe('salon-a');
  });

  it('attaches warm startType after visibility resume', () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
    });
    localStorage.setItem('cookie-consent-salon-a', 'accepted');
    syncAnalyticsConsentFromCookies('salon-a');
    markAppAnalyticsWarmStart();
    const body = buildAppAnalyticsIngestBody(
      { tenantSlug: 'salon-a', appSurface: 'public_web', locale: 'en' },
      [{ event: 'app_opened' }],
    );
    expect(body.events[0]?.startType).toBe('warm');
  });

  it('flushes queued events to ingest endpoint when consent granted', async () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
      cookieBannerEnabled: true,
    });
    localStorage.setItem('cookie-consent-salon-a', 'accepted');
    syncAnalyticsConsentFromCookies('salon-a', { cookieBannerEnabled: true });
    trackAppAnalyticsEvent('app_opened');
    await flushAppAnalytics();
    expect(axios.post).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(axios.post).mock.calls[0]?.[1] as {
      events: Array<{ anonId: string; sessionId: string }>;
    };
    expect(payload.events[0]?.anonId).toBe(getOrCreateAnonId('salon-a'));
    expect(payload.events[0]?.sessionId).toBeTruthy();
    expect(buildAppAnalyticsEventBody(
      { event: 'viewed_salon' },
      { tenantSlug: 'salon-a', appSurface: 'public_web', locale: 'en' },
    ).userType).toBe('first_open');
  });

  it('rejects drop queued events and block further tracking', () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
      cookieBannerEnabled: true,
    });
    localStorage.setItem('cookie-consent-salon-a', 'accepted');
    syncAnalyticsConsentFromCookies('salon-a', { cookieBannerEnabled: true });
    trackAppAnalyticsEvent('app_opened');

    localStorage.setItem('cookie-consent-salon-a', 'rejected');
    expect(
      syncAnalyticsConsentFromCookies('salon-a', { cookieBannerEnabled: true }),
    ).toBe(false);
    trackAppAnalyticsEvent('started_booking');
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
  });

  it('allows tracking without a choice when cookie banner is disabled', () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'en',
      appSurface: 'public_web',
      cookieBannerEnabled: false,
    });
    trackAppAnalyticsEvent('viewed_salon');
    expect(syncAnalyticsConsentFromCookies('salon-a')).toBe(true);
  });
});
