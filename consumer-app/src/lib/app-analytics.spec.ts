import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'ios'),
  },
}));

vi.mock('../services/public-api.js', () => ({
  recordAppAnalyticsEvents: vi.fn().mockResolvedValue({ recorded: 1, skipped: 0 }),
}));

import { Capacitor } from '@capacitor/core';
import { APP_ANALYTICS_CONSUMER_SCENARIOS } from './app-analytics.fixtures.js';
import { recordAppAnalyticsEvents } from '../services/public-api.js';
import {
  buildAppAnalyticsEventBody,
  buildAppAnalyticsIngestBody,
  configureAppAnalytics,
  getOrCreateAnonId,
  resetAppAnalyticsForTests,
  setAnalyticsConsent,
  track,
  trackAppAnalyticsEvent,
} from './app-analytics.js';
import { saveDeferredInstallLink } from './deferred-install-link.util.js';

describe('app-analytics (consumer)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAppAnalyticsForTests();
    vi.mocked(recordAppAnalyticsEvents).mockClear();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('builds typed ingest payloads with session context', () => {
    configureAppAnalytics({
      tenantSlug: 'salon-a',
      locale: 'hy',
      appSurface: 'consumer_app',
      appVersion: '1.0.0',
    });
    setAnalyticsConsent(true);

    const body = buildAppAnalyticsIngestBody(
      {
        tenantSlug: 'salon-a',
        locale: 'hy',
        appSurface: 'consumer_app',
        appVersion: '1.0.0',
      },
      [{ event: 'app_opened' }, { event: 'viewed_salon' }],
    );

    expect(body.consentGranted).toBe(true);
    expect(body.events[0]?.anonId).toBe(getOrCreateAnonId());
    expect(body.events[0]?.locale).toBe('hy');
    expect(body.events[0]?.appVersion).toBe('1.0.0');
    expect(body.events[0]?.tenantSlug).toBe('salon-a');
    expect(body.events[0]?.sessionId).toBe(body.events[1]?.sessionId);
    expect(body.events[0]?.userType).toBe(body.events[1]?.userType);
    expect(body.events[0]?.startType).toBe('cold');
  });

  it.each(APP_ANALYTICS_CONSUMER_SCENARIOS)(
    'builds payload for scenario $id',
    (scenario) => {
      const eventBody = buildAppAnalyticsEventBody(
        { event: scenario.event, props: scenario.props },
        { tenantSlug: 'salon-a', appSurface: 'consumer_app', locale: 'en' },
      );
      expect(eventBody.event).toBe(scenario.event);
      expect(eventBody.anonId).toMatch(/^anon-/);
      expect(eventBody.platform).toBeDefined();
    },
  );

  it('track alias posts batched events via public-api', async () => {
    configureAppAnalytics({ tenantSlug: 'salon-a', appSurface: 'consumer_app' });
    setAnalyticsConsent(true);
    track('viewed_salon');
    track('started_booking', { serviceId: 'svc-1' });
    await vi.waitFor(() => {
      expect(recordAppAnalyticsEvents).toHaveBeenCalled();
    });
  });

  it('does not track when consent is denied', async () => {
    configureAppAnalytics({ tenantSlug: 'salon-a', appSurface: 'consumer_app' });
    setAnalyticsConsent(false);
    trackAppAnalyticsEvent('app_opened');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(recordAppAnalyticsEvents).not.toHaveBeenCalled();
  });

  it('defers flush until tenant context is configured', async () => {
    configureAppAnalytics({ appSurface: 'consumer_app' });
    setAnalyticsConsent(true);
    track('app_opened');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(recordAppAnalyticsEvents).not.toHaveBeenCalled();
    configureAppAnalytics({ tenantSlug: 'salon-a', appSurface: 'consumer_app' });
    await vi.waitFor(() => {
      expect(recordAppAnalyticsEvents).toHaveBeenCalled();
    });
  });

  it('swallows analytics API failures', async () => {
    vi.mocked(recordAppAnalyticsEvents).mockRejectedValueOnce(new Error('network'));
    configureAppAnalytics({ tenantSlug: 'salon-a', appSurface: 'consumer_app' });
    setAnalyticsConsent(true);
    track('referral_sent', { referralCode: 'FRIEND10' });
    await vi.waitFor(() => {
      expect(recordAppAnalyticsEvents).toHaveBeenCalled();
    });
  });

  it('trackAppInstalledOnce attaches deferred install attribution on native first open', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    saveDeferredInstallLink({
      slug: 'salon-a',
      serviceId: 'svc-1',
      installSource: 'qr',
      campaign: 'venue_qr',
    });
    configureAppAnalytics({ appSurface: 'consumer_app' });
    setAnalyticsConsent(true);
    await vi.waitFor(() => {
      expect(recordAppAnalyticsEvents).toHaveBeenCalled();
    });
    const body = vi.mocked(recordAppAnalyticsEvents).mock.calls.at(-1)?.[0];
    const installed = body?.events.find((event) => event.event === 'app_installed');
    expect(installed?.tenantSlug).toBe('salon-a');
    expect(installed?.props).toEqual(
      expect.objectContaining({
        installSource: 'qr',
        campaign: 'venue_qr',
        serviceId: 'svc-1',
        intentQualified: true,
      }),
    );
    expect(localStorage.getItem('app-analytics-installed')).toBe('1');
  });

  it('trackAppInstalledOnce is idempotent on native', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    localStorage.setItem('app-analytics-installed', '1');
    configureAppAnalytics({ tenantSlug: 'salon-a', appSurface: 'consumer_app' });
    setAnalyticsConsent(true);
    const installedEvents = vi
      .mocked(recordAppAnalyticsEvents)
      .mock.calls.flatMap((call) => call[0]?.events ?? [])
      .filter((event) => event.event === 'app_installed');
    expect(installedEvents).toHaveLength(0);
  });
});
