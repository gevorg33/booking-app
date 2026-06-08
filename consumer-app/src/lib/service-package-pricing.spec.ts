import { describe, expect, it } from 'vitest';
import {
  allocatePackageLinePricing,
  calculatePackagePricing,
} from './service-package-pricing.js';

describe('service-package-pricing', () => {
  it('calculates percent package discount', () => {
    const preview = calculatePackagePricing(
      [
        { unitPrice: 80, quantity: 1 },
        { unitPrice: 40, quantity: 2 },
      ],
      'percent',
      25,
    );
    expect(preview.regularTotal).toBe(160);
    expect(preview.packagePrice).toBe(120);
    expect(preview.savings).toBe(40);
  });

  it('allocates discounted totals proportionally', () => {
    const allocations = allocatePackageLinePricing(
      [
        { unitPrice: 80, quantity: 1 },
        { unitPrice: 40, quantity: 2 },
      ],
      120,
    );
    const sum = allocations.reduce((total, line) => total + line.discountedLineTotal, 0);
    expect(sum).toBe(120);
    expect(allocations[0].lineSavings).toBeGreaterThan(0);
  });
});
