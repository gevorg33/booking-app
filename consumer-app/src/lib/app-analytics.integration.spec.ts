import { describe, expect, it } from 'vitest';
import { APP_ANALYTICS_CONSUMER_SCENARIOS } from './app-analytics.fixtures.js';
import { buildAppAnalyticsEventBody } from './app-analytics.js';

describe('Sprint 44 — adopt-1.1 consumer analytics scenario matrix', () => {
  it.each(APP_ANALYTICS_CONSUMER_SCENARIOS)(
    'builds $id event body without PII',
    (scenario) => {
      const body = buildAppAnalyticsEventBody(
        { event: scenario.event, props: scenario.props },
        { tenantSlug: 'glow-salon', appSurface: 'consumer_app', locale: 'en' },
      );
      expect(body).toMatchObject({
        event: scenario.event,
        appSurface: 'consumer_app',
        tenantSlug: 'glow-salon',
      });
      expect(body.anonId).toMatch(/^anon-/);
      expect(JSON.stringify(body)).not.toMatch(/@/);
    },
  );
});
