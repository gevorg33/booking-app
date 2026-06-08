import { describe, expect, it } from 'vitest';
import { resolvePackageItemPricing } from './package-item-pricing.util.js';
import type { PublicServicePackage } from './package-booking.js';

const pkg: PublicServicePackage = {
  id: 'pkg-1',
  kind: 'package',
  name: 'Bundle',
  displayOrder: 0,
  totalDurationMinutes: 60,
  currency: 'USD',
  items: [
    {
      serviceId: 'svc-a',
      serviceName: 'A',
      quantity: 1,
      unitPrice: 100,
      durationMinutes: 60,
    },
    {
      serviceId: 'svc-b',
      serviceName: 'B',
      quantity: 1,
      unitPrice: 50,
      durationMinutes: 30,
    },
  ],
  pricing: {
    regularTotal: 150,
    packagePrice: 120,
    savings: 30,
    savingsPercent: 20,
  },
};

describe('package-item-pricing.util', () => {
  it('resolves per-item discounted totals', () => {
    const priced = resolvePackageItemPricing(pkg);
    expect(priced).toHaveLength(2);
    expect(priced.reduce((sum, item) => sum + item.discountedLineTotal, 0)).toBe(120);
    expect(priced.every((item) => item.lineSavings >= 0)).toBe(true);
  });
});
