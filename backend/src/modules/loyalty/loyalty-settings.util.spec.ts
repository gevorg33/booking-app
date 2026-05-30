import {
  calculateEarnPoints,
  getEarnPercentCashback,
  maxRedeemablePoints,
  pointsToCurrency,
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
});
