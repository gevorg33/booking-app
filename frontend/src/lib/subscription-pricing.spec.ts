import { describe, it, expect } from 'vitest';
import { calculateSubscriptionPricing } from './subscription-pricing';

describe('subscription-pricing', () => {
  it('matches backend Nail Care examples', () => {
    expect(calculateSubscriptionPricing(25, 6, 'percent', 5).subscriptionPrice).toBe(142.5);
    expect(calculateSubscriptionPricing(25, 12, 'percent', 10).subscriptionPrice).toBe(270);
    expect(calculateSubscriptionPricing(25, 24, 'percent', 20).subscriptionPrice).toBe(480);
  });

  it('applies fixed discount and clamps price at zero', () => {
    expect(calculateSubscriptionPricing(25, 4, 'fixed', 10).subscriptionPrice).toBe(90);
    expect(calculateSubscriptionPricing(10, 2, 'fixed', 50).subscriptionPrice).toBe(0);
  });

  it('returns zero per-appointment price when appointments is zero', () => {
    expect(calculateSubscriptionPricing(25, 0, 'percent', 10).perAppointmentPrice).toBe(0);
  });
});
