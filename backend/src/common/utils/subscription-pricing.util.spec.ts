import {
  calculateSubscriptionPricing,
  addMonths,
} from './subscription-pricing.util.js';

describe('subscription-pricing.util', () => {
  it('calculates percent discount preview (Nail Care example)', () => {
    const short = calculateSubscriptionPricing(25, 6, 'percent', 5);
    expect(short.regularTotal).toBe(150);
    expect(short.subscriptionPrice).toBe(142.5);
    expect(short.savings).toBe(7.5);

    const medium = calculateSubscriptionPricing(25, 12, 'percent', 10);
    expect(medium.subscriptionPrice).toBe(270);
    expect(medium.savings).toBe(30);

    const annual = calculateSubscriptionPricing(25, 24, 'percent', 20);
    expect(annual.subscriptionPrice).toBe(480);
    expect(annual.savings).toBe(120);
  });

  it('calculates fixed discount and floors at zero', () => {
    const result = calculateSubscriptionPricing(50, 4, 'fixed', 200);
    expect(result.regularTotal).toBe(200);
    expect(result.subscriptionPrice).toBe(0);
    expect(result.savings).toBe(200);
  });

  it('calculates fixed discount preview', () => {
    const result = calculateSubscriptionPricing(25, 4, 'fixed', 10);
    expect(result.subscriptionPrice).toBe(90);
  });

  it('adds months for expiration', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    const end = addMonths(start, 3);
    expect(end.getMonth()).toBe(3);
  });

  it('handles zero appointments in pricing', () => {
    expect(calculateSubscriptionPricing(25, 0, 'percent', 5).perAppointmentPrice).toBe(0);
  });
});
