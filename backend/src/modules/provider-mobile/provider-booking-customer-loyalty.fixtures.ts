/** prov-exp-9.2 — loyalty quick view scenarios for provider customer snapshot. */

import type { BuildProviderBookingCustomerLoyaltyQuickViewInput } from './provider-booking-customer-loyalty.util.js';

export interface ProviderCustomerLoyaltyQuickViewScenario {
  id: string;
  input: BuildProviderBookingCustomerLoyaltyQuickViewInput;
  expectLastEarnPoints: number | null;
  expectLastRedeemPoints: number | null;
  staffCanAdjust: false;
}

export const PROVIDER_CUSTOMER_LOYALTY_QUICK_VIEW_SCENARIOS: ProviderCustomerLoyaltyQuickViewScenario[] =
  [
    {
      id: 'empty-account',
      input: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 0,
        lastEarn: null,
        lastRedeem: null,
      },
      expectLastEarnPoints: null,
      expectLastRedeemPoints: null,
      staffCanAdjust: false,
    },
    {
      id: 'balance-with-last-earn',
      input: {
        pointsBalance: 12.5,
        pointsValue: 1.25,
        lifetimeEarned: 20,
        lastEarn: {
          points: 5,
          createdAt: new Date('2026-05-10T14:00:00.000Z'),
          note: 'Earned from paid booking',
        },
        lastRedeem: null,
      },
      expectLastEarnPoints: 5,
      expectLastRedeemPoints: null,
      staffCanAdjust: false,
    },
    {
      id: 'balance-with-last-redeem-negative-points',
      input: {
        pointsBalance: 3,
        pointsValue: 0.3,
        lifetimeEarned: 15,
        lastEarn: {
          points: 10,
          createdAt: new Date('2026-04-01T09:00:00.000Z'),
          note: 'Earned from booking',
        },
        lastRedeem: {
          points: -7,
          createdAt: new Date('2026-05-01T11:30:00.000Z'),
          note: 'Redeemed on booking',
        },
      },
      expectLastEarnPoints: 10,
      expectLastRedeemPoints: 7,
      staffCanAdjust: false,
    },
    {
      id: 'ignores-zero-point-transactions',
      input: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 0,
        lastEarn: {
          points: 0,
          createdAt: new Date('2026-01-01T09:00:00.000Z'),
          note: 'No bonus',
        },
        lastRedeem: {
          points: 0,
          createdAt: new Date('2026-01-02T09:00:00.000Z'),
          note: 'Skipped',
        },
      },
      expectLastEarnPoints: null,
      expectLastRedeemPoints: null,
      staffCanAdjust: false,
    },
  ];
