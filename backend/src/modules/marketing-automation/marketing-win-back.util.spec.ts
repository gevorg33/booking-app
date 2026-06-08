import { WIN_BACK_INCENTIVE_SCENARIOS } from './marketing-win-back.fixtures.js';
import {
  buildWinBackIncentiveLines,
  formatWinBackBonusAmount,
  isWinBackLoyaltyIncentiveConfigured,
  resolveWinBackLoyaltyBonusPoints,
} from './marketing-win-back.util.js';

describe('marketing-win-back.util', () => {
  it.each(WIN_BACK_INCENTIVE_SCENARIOS)(
    'builds incentive lines for $id',
    ({ settings, locale, expectPromo, expectLoyalty }) => {
      const lines = buildWinBackIncentiveLines(settings, locale);
      expect(lines.promoLine.includes('Use code')).toBe(expectPromo);
      expect(lines.loyaltyLine.includes('$')).toBe(expectLoyalty);
    },
  );

  it('clamps loyalty bonus points to configured bounds', () => {
    expect(resolveWinBackLoyaltyBonusPoints({ reEngagementLoyaltyBonusPoints: 0 })).toBe(0);
    expect(resolveWinBackLoyaltyBonusPoints({ reEngagementLoyaltyBonusPoints: 5.4 })).toBe(5);
    expect(resolveWinBackLoyaltyBonusPoints({ reEngagementLoyaltyBonusPoints: 999 })).toBe(500);
  });

  it('detects configured loyalty incentive', () => {
    expect(
      isWinBackLoyaltyIncentiveConfigured({ reEngagementLoyaltyBonusPoints: 10 }),
    ).toBe(true);
    expect(
      isWinBackLoyaltyIncentiveConfigured({ reEngagementLoyaltyBonusPoints: null }),
    ).toBe(false);
  });

  it('formats bonus amounts as currency', () => {
    expect(formatWinBackBonusAmount(10)).toBe('10.00');
  });
});
