import { describe, expect, it } from 'vitest';
import { canBookWithRedeemedGift } from './gift-card-redeemed.util.js';

describe('gift-card-redeemed.util', () => {
  it('allows booking for package and subscription gifts', () => {
    expect(canBookWithRedeemedGift({ cardType: 'package', serviceCredits: [] })).toBe(true);
    expect(canBookWithRedeemedGift({ cardType: 'subscription', serviceCredits: [] })).toBe(true);
  });

  it('requires remaining service credits for service gifts', () => {
    expect(
      canBookWithRedeemedGift({
        cardType: 'service',
        serviceCredits: [{ quantityRemaining: 0 }],
      }),
    ).toBe(false);
    expect(
      canBookWithRedeemedGift({
        cardType: 'service',
        serviceCredits: [{ quantityRemaining: 1 }],
      }),
    ).toBe(true);
  });
});
