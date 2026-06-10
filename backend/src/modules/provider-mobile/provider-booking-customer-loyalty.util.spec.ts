import { PROVIDER_CUSTOMER_LOYALTY_QUICK_VIEW_SCENARIOS } from './provider-booking-customer-loyalty.fixtures.js';
import {
  buildProviderBookingCustomerLoyaltyQuickView,
  formatProviderLoyaltyQuickViewSummary,
  mapLoyaltyTransactionToActivity,
  normalizeLoyaltyActivityPoints,
  PROVIDER_LOYALTY_QUICK_VIEW_STAFF_CAN_ADJUST,
} from './provider-booking-customer-loyalty.util.js';

describe('provider-booking-customer-loyalty.util (prov-exp-9.2)', () => {
  it.each(PROVIDER_CUSTOMER_LOYALTY_QUICK_VIEW_SCENARIOS)(
    'buildProviderBookingCustomerLoyaltyQuickView — $id',
    ({ input, expectLastEarnPoints, expectLastRedeemPoints, staffCanAdjust }) => {
      const view = buildProviderBookingCustomerLoyaltyQuickView(input);
      expect(view.lastEarn?.points ?? null).toBe(expectLastEarnPoints);
      expect(view.lastRedeem?.points ?? null).toBe(expectLastRedeemPoints);
      expect(view.staffCanAdjust).toBe(staffCanAdjust);
      expect(view.staffCanAdjust).toBe(PROVIDER_LOYALTY_QUICK_VIEW_STAFF_CAN_ADJUST);
    },
  );

  it('normalizes redeem points to positive amounts', () => {
    expect(normalizeLoyaltyActivityPoints(-7, 'redeem')).toBe(7);
    expect(normalizeLoyaltyActivityPoints(5, 'earn')).toBe(5);
    expect(normalizeLoyaltyActivityPoints(0, 'earn')).toBeNull();
  });

  it('formats loyalty quick view summary for AI', () => {
    const summary = formatProviderLoyaltyQuickViewSummary(
      buildProviderBookingCustomerLoyaltyQuickView({
        pointsBalance: 12,
        pointsValue: 1.2,
        lifetimeEarned: 20,
        lastEarn: {
          points: 5,
          createdAt: new Date('2026-05-10T14:00:00.000Z'),
          note: 'Earned from paid booking',
        },
        lastRedeem: {
          points: -3,
          createdAt: new Date('2026-04-20T10:00:00.000Z'),
          note: 'Redeemed on booking',
        },
      }),
    );

    expect(summary).toContain('12 loyalty pts');
    expect(summary).toContain('last earn +5');
    expect(summary).toContain('last redeem 3');
  });

  it('returns null activity for missing transactions', () => {
    expect(mapLoyaltyTransactionToActivity(null, 'earn')).toBeNull();
  });
});
