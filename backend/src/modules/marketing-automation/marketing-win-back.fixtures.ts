/** adopt-4.5 — win-back campaign scenarios. */

export const WIN_BACK_INCENTIVE_SCENARIOS = [
  {
    id: 'promo-only',
    settings: { reEngagementPromoCode: 'WINBACK10', reEngagementLoyaltyBonusPoints: null },
    locale: 'en' as const,
    expectPromo: true,
    expectLoyalty: false,
  },
  {
    id: 'loyalty-only',
    settings: { reEngagementPromoCode: null, reEngagementLoyaltyBonusPoints: 5 },
    locale: 'en' as const,
    expectPromo: false,
    expectLoyalty: true,
  },
  {
    id: 'promo-and-loyalty',
    settings: {
      reEngagementPromoCode: 'COMEBACK',
      reEngagementLoyaltyBonusPoints: 10,
    },
    locale: 'en' as const,
    expectPromo: true,
    expectLoyalty: true,
  },
  {
    id: 'no-incentive',
    settings: { reEngagementPromoCode: null, reEngagementLoyaltyBonusPoints: null },
    locale: 'en' as const,
    expectPromo: false,
    expectLoyalty: false,
  },
] as const;
