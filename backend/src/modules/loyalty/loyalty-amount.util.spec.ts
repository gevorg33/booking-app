import {
  resolveEligibleCashPaidForEarn,
  resolveAmountPaid,
  wasLoyaltyRedeemedOnBooking,
} from './loyalty-amount.util.js';
import { calculateEarnPoints } from './loyalty-settings.util.js';

describe('loyalty-amount.util', () => {
  it('uses cash amount due after loyalty redemption', () => {
    expect(
      resolveEligibleCashPaidForEarn({
        metadata: {
          pricing: {
            servicePrice: 100,
            loyaltyDiscount: 40,
            loyaltyPointsRedeemed: 40,
            amountDue: 60,
          },
          amountPaid: 60,
        },
        servicePrice: 100,
      }),
    ).toBe(60);
  });

  it('returns 0 for 100% loyalty payment', () => {
    expect(
      resolveEligibleCashPaidForEarn({
        metadata: {
          pricing: {
            loyaltyDiscount: 100,
            loyaltyPointsRedeemed: 100,
            amountDue: 0,
          },
          amountPaid: 0,
        },
        servicePrice: 100,
      }),
    ).toBe(0);
  });

  it('does not fall back to service price when loyalty was redeemed', () => {
    expect(
      resolveEligibleCashPaidForEarn({
        metadata: {
          pricing: { loyaltyDiscount: 40, loyaltyPointsRedeemed: 40 },
        },
        servicePrice: 100,
      }),
    ).toBe(0);
  });

  it('uses full service price when no loyalty was redeemed', () => {
    expect(
      resolveEligibleCashPaidForEarn({ metadata: {}, servicePrice: 85 }),
    ).toBe(85);
  });

  it('prefers explicit cashPaidEligible', () => {
    expect(
      resolveAmountPaid({
        metadata: {
          cashPaidEligible: 60,
          amountPaid: 70,
          pricing: { amountDue: 80, loyaltyDiscount: 20 },
        },
        servicePrice: 100,
      }),
    ).toBe(60);
  });

  it('detects loyalty redemption on booking metadata', () => {
    expect(
      wasLoyaltyRedeemedOnBooking({
        pricing: { loyaltyPointsRedeemed: 10 },
      }),
    ).toBe(true);
    expect(wasLoyaltyRedeemedOnBooking({})).toBe(false);
  });
});

describe('loyalty earn on eligible cash only', () => {
  it('awards 10% on cash portion only for mixed payment', () => {
    const cashPaid = 60;
    expect(calculateEarnPoints(cashPaid, 10)).toBe(6);
  });

  it('awards 0 when eligible cash is 0', () => {
    expect(calculateEarnPoints(0, 10)).toBe(0);
  });

  it('awards normal cashback for 100% cash payment', () => {
    expect(calculateEarnPoints(100, 10)).toBe(10);
  });
});
