import { getBusinessZapierIntegration, ZAPIER_TRIGGER_EVENTS } from './zapier-integration.types.js';

describe('zapier-integration.types', () => {
  it('lists trigger events', () => {
    expect(ZAPIER_TRIGGER_EVENTS).toContain('booking.created');
    expect(ZAPIER_TRIGGER_EVENTS).toContain('payment.received');
    expect(ZAPIER_TRIGGER_EVENTS).toContain('review.received');
  });

  it('reads zapier settings from business', () => {
    expect(getBusinessZapierIntegration()).toEqual({});
    expect(
      getBusinessZapierIntegration({
        integrations: { zapier: { enabled: true, hookDescription: 'CRM' } },
      }).enabled,
    ).toBe(true);
  });
});
