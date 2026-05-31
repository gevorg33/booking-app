import {
  calculatePackagePricing,
  isPackageBookable,
  isPackageOfferExpired,
  isPackagePubliclyVisible,
  resolvePackageCheckoutGraceHours,
} from './package-pricing.util.js';

describe('package-pricing.util', () => {
  it('calculates percent discount for spa day package', () => {
    const result = calculatePackagePricing(
      [
        { unitPrice: 80, quantity: 1 },
        { unitPrice: 60, quantity: 1 },
        { unitPrice: 40, quantity: 1 },
      ],
      'percent',
      15,
    );
    expect(result.regularTotal).toBe(180);
    expect(result.packagePrice).toBe(153);
    expect(result.savings).toBe(27);
    expect(result.savingsPercent).toBe(15);
  });

  it('calculates fixed discount and clamps at zero', () => {
    expect(calculatePackagePricing([{ unitPrice: 50, quantity: 2 }], 'fixed', 20).packagePrice).toBe(
      80,
    );
    expect(calculatePackagePricing([{ unitPrice: 10, quantity: 1 }], 'fixed', 50).packagePrice).toBe(
      0,
    );
  });

  it('handles quantity multipliers and empty totals', () => {
    const result = calculatePackagePricing(
      [{ unitPrice: 25, quantity: 3 }],
      'percent',
      10,
    );
    expect(result.regularTotal).toBe(75);
    expect(result.packagePrice).toBe(67.5);
    expect(calculatePackagePricing([], 'percent', 10).savingsPercent).toBe(0);
  });

  it('detects expired offers and public visibility', () => {
    const past = new Date('2020-01-01');
    const future = new Date('2099-01-01');
    expect(isPackageOfferExpired(past)).toBe(true);
    expect(isPackageOfferExpired(future)).toBe(false);
    expect(isPackageOfferExpired(null)).toBe(false);
    expect(isPackagePubliclyVisible(true, future)).toBe(true);
    expect(isPackagePubliclyVisible(false, future)).toBe(false);
    expect(isPackagePubliclyVisible(true, past)).toBe(false);
  });

  it('resolves checkout grace hours from business settings', () => {
    expect(resolvePackageCheckoutGraceHours(null)).toBe(0);
    expect(resolvePackageCheckoutGraceHours({ publicBooking: { packageCheckoutGraceHours: 24 } })).toBe(
      24,
    );
    expect(resolvePackageCheckoutGraceHours({ publicBooking: { packageCheckoutGraceHours: -1 } })).toBe(
      0,
    );
  });

  it('allows booking during grace period after expiration', () => {
    const expiredAt = new Date('2026-01-01T12:00:00Z');
    const duringGrace = new Date('2026-01-01T14:00:00Z');
    const afterGrace = new Date('2026-01-02T00:00:00Z');
    expect(isPackageBookable(true, expiredAt, 4, duringGrace)).toBe(true);
    expect(isPackageBookable(true, expiredAt, 4, afterGrace)).toBe(false);
    expect(isPackageBookable(true, expiredAt, 0, duringGrace)).toBe(false);
    expect(isPackageBookable(false, expiredAt, 4, duringGrace)).toBe(false);
  });

  it('allows booking before package expiration', () => {
    const future = new Date('2099-01-01');
    const now = new Date('2026-01-01');
    expect(isPackageBookable(true, future, 0, now)).toBe(true);
    expect(isPackageBookable(true, null, 0)).toBe(true);
    expect(isPackageBookable(true, future, undefined, now)).toBe(true);
  });
});
