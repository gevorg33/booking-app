import { describe, expect, it, vi } from 'vitest';
import { APP_ANALYTICS_PROVIDER_SCENARIOS } from './app-analytics.fixtures';
import { buildAppAnalyticsEventBody } from './app-analytics';

vi.mock('../services/api', () => ({
  default: {},
  unwrap: (data: unknown) => data,
  recordAppAnalyticsEvents: vi.fn().mockResolvedValue({ recorded: 1, skipped: 0 }),
}));

describe('Sprint 44 — adopt-1.1 provider analytics scenario matrix', () => {
  it.each(APP_ANALYTICS_PROVIDER_SCENARIOS)(
    'builds $id event body without PII',
    (scenario) => {
      const body = buildAppAnalyticsEventBody(
        { event: scenario.event, props: scenario.props },
        { businessId: 'biz-1', appSurface: 'provider_app', locale: 'en' },
      );
      expect(body).toMatchObject({
        event: scenario.event,
        appSurface: 'provider_app',
      });
      expect(body.anonId).toMatch(/^anon-/);
      expect(JSON.stringify(body)).not.toMatch(/@/);
    },
  );
});
