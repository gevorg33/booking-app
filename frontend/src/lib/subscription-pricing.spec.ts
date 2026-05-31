import { describe, it, expect } from 'vitest';
import { calculateSubscriptionPricing } from './subscription-pricing';

describe('subscription-pricing', () => {
  it('matches backend Nail Care examples', () => {
    expect(calculateSubscriptionPricing(25, 6, 'percent', 5).subscriptionPrice).toBe(142.5);
    expect(calculateSubscriptionPricing(25, 12, 'percent', 10).subscriptionPrice).toBe(270);
    expect(calculateSubscriptionPricing(25, 24, 'percent', 20).subscriptionPrice).toBe(480);
  });
});
