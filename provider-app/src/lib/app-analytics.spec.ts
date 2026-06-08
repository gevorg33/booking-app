import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ANALYTICS_PROVIDER_SCENARIOS } from './app-analytics.fixtures';
import {
  buildAppAnalyticsEventBody,
  buildAppAnalyticsIngestBody,
  configureAppAnalytics,
  resetAppAnalyticsForTests,
  setAnalyticsConsent,
  track,
} from './app-analytics';

vi.mock('../services/api', () => ({
  default: {},
  unwrap: (data: unknown) => data,
  recordAppAnalyticsEvents: vi.fn().mockResolvedValue({ recorded: 1, skipped: 0 }),
}));

import { recordAppAnalyticsEvents } from '../services/api';

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

describe('app-analytics (provider)', () => {
  beforeEach(() => {
    installLocalStorageMock();
    resetAppAnalyticsForTests();
    localStorage.clear();
    vi.mocked(recordAppAnalyticsEvents).mockClear();
  });

  it('builds provider ingest payloads with businessId', () => {
    configureAppAnalytics({
      businessId: 'biz-1',
      appSurface: 'provider_app',
      locale: 'en',
    });
    setAnalyticsConsent(true);

    const body = buildAppAnalyticsIngestBody(
      { businessId: 'biz-1', appSurface: 'provider_app', locale: 'en' },
      [{ event: 'signed_in' }],
    );

    expect(body.businessId).toBe('biz-1');
    expect(body.events[0]?.appSurface).toBe('provider_app');
  });

  it.each(APP_ANALYTICS_PROVIDER_SCENARIOS)(
    'builds payload for scenario $id',
    (scenario) => {
      const eventBody = buildAppAnalyticsEventBody(
        { event: scenario.event, props: scenario.props },
        { businessId: 'biz-1', appSurface: 'provider_app', locale: 'en' },
      );
      expect(eventBody.event).toBe(scenario.event);
      expect(eventBody.anonId).toMatch(/^anon-/);
    },
  );

  it('defers flush until business context is configured', async () => {
    configureAppAnalytics({ appSurface: 'provider_app' });
    setAnalyticsConsent(true);
    track('app_opened');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(recordAppAnalyticsEvents).not.toHaveBeenCalled();
    configureAppAnalytics({ businessId: 'biz-1', appSurface: 'provider_app' });
    await vi.waitFor(() => {
      expect(recordAppAnalyticsEvents).toHaveBeenCalled();
    });
  });
});
