import { describe, expect, it } from 'vitest';
import {
  canBookWithRedeemedGift,
  hasRedeemedServiceCreditsRemaining,
} from './gift-card-redeemed';

describe('gift-card-redeemed', () => {
  it('allows booking for package and subscription gifts', () => {
    expect(canBookWithRedeemedGift({ cardType: 'package', serviceCredits: [] })).toBe(true);
    expect(canBookWithRedeemedGift({ cardType: 'subscription', serviceCredits: [] })).toBe(true);
  });

  it('allows booking for service and bundle gifts with remaining credits', () => {
    const credits = [{ quantityRemaining: 1 }, { quantityRemaining: 0 }];
    expect(canBookWithRedeemedGift({ cardType: 'service', serviceCredits: credits })).toBe(true);
    expect(canBookWithRedeemedGift({ cardType: 'bundle', serviceCredits: credits })).toBe(true);
  });

  it('blocks booking when all service or bundle credits are used', () => {
    const depleted = [
      { quantityRemaining: 0 },
      { quantityRemaining: 0 },
      { quantityRemaining: 0 },
    ];
    expect(canBookWithRedeemedGift({ cardType: 'bundle', serviceCredits: depleted })).toBe(false);
    expect(canBookWithRedeemedGift({ cardType: 'service', serviceCredits: [{ quantityRemaining: 0 }] })).toBe(
      false,
    );
  });

  it('blocks booking for unknown card types without package or subscription semantics', () => {
    expect(canBookWithRedeemedGift({ cardType: 'monetary', serviceCredits: [] })).toBe(false);
  });

  it('reports remaining credits for service bundles', () => {
    expect(
      hasRedeemedServiceCreditsRemaining({
        cardType: 'bundle',
        serviceCredits: [{ quantityRemaining: 0 }, { quantityRemaining: 1 }],
      }),
    ).toBe(true);
    expect(
      hasRedeemedServiceCreditsRemaining({
        cardType: 'bundle',
        serviceCredits: [{ quantityRemaining: 0 }],
      }),
    ).toBe(false);
  });
});
