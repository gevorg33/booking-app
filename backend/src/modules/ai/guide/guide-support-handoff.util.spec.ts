import type { GuideResponse } from '../command-completion.types.js';
import {
  GUIDE_SUPPORT_HANDOFF_SCENARIOS,
  INVALID_GUIDE_SUPPORT_SNAPSHOTS,
  expectedSnapshotForScenario,
} from './guide-support-handoff.fixtures.js';
import {
  buildGuideSupportHandoff,
  buildGuideSupportSnapshot,
  enrichGuideResponseSupportHandoff,
  formatGuideSupportTicketBody,
  parseGuideSupportSnapshot,
} from './guide-support-handoff.util.js';

describe('guide-support-handoff.util (ai-guide-1.7.2)', () => {
  it.each(GUIDE_SUPPORT_HANDOFF_SCENARIOS)(
    'builds non-PII snapshot for $id',
    (scenario) => {
      const snapshot = buildGuideSupportSnapshot(scenario.context);
      expect(snapshot).toEqual(expectedSnapshotForScenario(scenario));
      expect(formatGuideSupportTicketBody(snapshot)).not.toMatch(
        /@[a-z0-9.-]+\.[a-z]{2,}/i,
      );
      expect(formatGuideSupportTicketBody(snapshot)).toContain(
        `Surface: ${snapshot.surface}`,
      );
      expect(formatGuideSupportTicketBody(snapshot)).toContain(
        `Locale: ${snapshot.locale}`,
      );
    },
  );

  it.each(GUIDE_SUPPORT_HANDOFF_SCENARIOS)(
    'buildGuideSupportHandoff for $id uses create_support_ticket',
    (scenario) => {
      const handoff = buildGuideSupportHandoff(scenario.context);
      expect(handoff.action).toBe('create_support_ticket');
      expect(handoff.label).toBe('Still stuck?');
      expect(handoff.snapshot).toEqual(expectedSnapshotForScenario(scenario));
      expect(handoff.ticket.tags).toContain('product-guide');
      expect(handoff.ticket.tags).toContain(`guide-${scenario.context.surface}`);
    },
  );

  it.each(INVALID_GUIDE_SUPPORT_SNAPSHOTS)(
    'parseGuideSupportSnapshot rejects invalid snapshot %#',
    (value) => {
      expect(parseGuideSupportSnapshot(value)).toBeNull();
    },
  );

  it('parseGuideSupportSnapshot accepts valid snapshot object', () => {
    expect(
      parseGuideSupportSnapshot({
        surface: 'public',
        route: '/book/services',
        topicId: 'public-booking-services',
        locale: 'hy',
      }),
    ).toEqual({
      surface: 'public',
      route: '/book/services',
      topicId: 'public-booking-services',
      locale: 'hy',
    });
  });

  it('enriches guide responses idempotently', () => {
    const base: GuideResponse = {
      summary: 'Checkout steps',
      steps: [{ title: 'Review', body: 'Confirm details.' }],
      topicId: 'public-checkout',
    };
    const enriched = enrichGuideResponseSupportHandoff(base, {
      surface: 'public',
      route: '/book/checkout',
      locale: 'en',
    });
    expect(enriched.supportHandoff?.snapshot.topicId).toBe('public-checkout');
    expect(enriched.supportHandoff?.ticket.body).toContain('Route: /book/checkout');
    expect(enrichGuideResponseSupportHandoff(enriched, {
      surface: 'public',
      route: '/book/checkout',
      locale: 'en',
    })).toBe(enriched);
  });
});
