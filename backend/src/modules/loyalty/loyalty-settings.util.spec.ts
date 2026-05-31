import {
  calculateEarnPoints,
  getEarnPercentCashback,
  maxRedeemablePoints,
  pointsToCurrency,
  getLoyaltyEarnExcludedServiceIds,
  isServiceExcludedFromLoyaltyEarn,
  getLoyaltySettingsResponse,
  resolveEarnPercentForService,
} from './loyalty-settings.util.js';

describe('loyalty-settings.util', () => {
  it('defaults earn percent to 5% cashback', () => {
    expect(getEarnPercentCashback({})).toBe(5);
    expect(getEarnPercentCashback(null)).toBe(5);
  });

  it('reads tenant-configured earn percent', () => {
    expect(getEarnPercentCashback({ loyalty: { earnPercentCashback: 10 } })).toBe(10);
  });

  it('earns percent of amount paid as dollar bonus', () => {
    expect(calculateEarnPoints(10, 5)).toBe(0.5);
    expect(calculateEarnPoints(80, 5)).toBe(4);
    expect(calculateEarnPoints(100, 10)).toBe(10);
  });

  it('treats bonus balance as dollar credit', () => {
    expect(pointsToCurrency(0.5)).toBe(0.5);
    expect(pointsToCurrency(4)).toBe(4);
  });

  it('caps redeemable bonuses by order total', () => {
    expect(maxRedeemablePoints(50, 30)).toBe(30);
    expect(maxRedeemablePoints(0.5, 10)).toBe(0.5);
  });

  it('reads excluded service ids from settings', () => {
    expect(getLoyaltyEarnExcludedServiceIds(null)).toEqual([]);
    expect(
      getLoyaltyEarnExcludedServiceIds({
        loyalty: { earnExcludedServiceIds: ['svc-1', 'svc-2'] },
      }),
    ).toEqual(['svc-1', 'svc-2']);
  });

  it('detects excluded services for earn rate', () => {
    const settings = { loyalty: { earnExcludedServiceIds: ['svc-1'] } };
    expect(isServiceExcludedFromLoyaltyEarn(settings, 'svc-1')).toBe(true);
    expect(isServiceExcludedFromLoyaltyEarn(settings, 'svc-2')).toBe(false);
    expect(isServiceExcludedFromLoyaltyEarn(settings, null)).toBe(false);
  });

  it('filters invalid excluded service ids', () => {
    expect(
      getLoyaltyEarnExcludedServiceIds({
        loyalty: { earnExcludedServiceIds: ['svc-1', '', 42, null, 'svc-2'] },
      }),
    ).toEqual(['svc-1', 'svc-2']);
    expect(getLoyaltyEarnExcludedServiceIds({ loyalty: { earnExcludedServiceIds: 'bad' } })).toEqual(
      [],
    );
    expect(getLoyaltyEarnExcludedServiceIds({ loyalty: null })).toEqual([]);
  });

  it('builds loyalty settings response with exclusions', () => {
    expect(getLoyaltySettingsResponse(null)).toEqual({
      earnPercentCashback: 5,
      earnExcludedServiceIds: [],
      bonusDollarValue: 1,
    });
    expect(
      getLoyaltySettingsResponse({
        loyalty: { earnPercentCashback: 12, earnExcludedServiceIds: ['svc-a'] },
      }),
    ).toEqual({
      earnPercentCashback: 12,
      earnExcludedServiceIds: ['svc-a'],
      bonusDollarValue: 1,
    });
  });

  it('returns zero earn points for zero percent or amount', () => {
    expect(calculateEarnPoints(0, 10)).toBe(0);
    expect(calculateEarnPoints(100, 0)).toBe(0);
  });

  it('falls back to default earn percent for invalid settings', () => {
    expect(getEarnPercentCashback({ loyalty: { earnPercentCashback: -1 } })).toBe(5);
    expect(getEarnPercentCashback({ loyalty: { earnPercentCashback: '10' } })).toBe(5);
  });

  it('returns zero earn percent for excluded services at checkout', () => {
    const settings = {
      loyalty: { earnPercentCashback: 10, earnExcludedServiceIds: ['svc-1'] },
    };
    expect(resolveEarnPercentForService(settings, 'svc-1')).toBe(0);
    expect(resolveEarnPercentForService(settings, 'svc-2')).toBe(10);
    expect(resolveEarnPercentForService(null, 'svc-2')).toBe(5);
  });
});
