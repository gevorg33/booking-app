import { describe, it, expect } from 'vitest';
import { calculatePackagePricing, allocatePackageLinePricing } from './service-package-pricing';

describe('service-package-pricing', () => {
  it('calculates percent and fixed discounts', () => {
    expect(
      calculatePackagePricing(
        [
          { unitPrice: 80, quantity: 1 },
          { unitPrice: 60, quantity: 1 },
        ],
        'percent',
        15,
      ).packagePrice,
    ).toBe(119);

    expect(calculatePackagePricing([{ unitPrice: 50, quantity: 2 }], 'fixed', 20).packagePrice).toBe(
      80,
    );
  });

  it('reports zero savings percent for empty bundles', () => {
    expect(calculatePackagePricing([], 'percent', 10).savingsPercent).toBe(0);
  });

  it('clamps negative totals', () => {
    const result = calculatePackagePricing([{ unitPrice: 10, quantity: 1 }], 'fixed', 50);
    expect(result.packagePrice).toBe(0);
    expect(result.savingsPercent).toBe(100);
  });

  it('allocates discount per line item', () => {
    const items = [
      { unitPrice: 60, quantity: 1 },
      { unitPrice: 50, quantity: 1 },
    ];
    const pricing = calculatePackagePricing(items, 'percent', 15);
    const lines = allocatePackageLinePricing(items, pricing.packagePrice);
    expect(lines[0].discountedLineTotal).toBe(51);
    expect(lines[0].lineSavings).toBe(9);
    expect(lines[1].discountedLineTotal).toBe(42.5);
    expect(lines[1].lineSavings).toBe(7.5);
  });
});
