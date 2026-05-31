import { describe, expect, it } from 'vitest';
import {
  findIncompatiblePairLabels,
  multiServiceCartErrors,
  sumMultiServiceDuration,
  sumMultiServicePrice,
} from './multi-service-booking';

describe('multi-service-booking', () => {
  const services = [
    { id: 'a', name: 'Haircut', durationMinutes: 30, bufferMinutes: 0, price: 40 },
    { id: 'b', name: 'Beard', durationMinutes: 20, bufferMinutes: 0, price: 25 },
  ];

  it('sums duration and price for cart', () => {
    expect(sumMultiServiceDuration(services, 5)).toBe(55);
    expect(sumMultiServicePrice(services)).toBe(65);
  });

  it('flags incompatible pairs and limits', () => {
    const warnings = findIncompatiblePairLabels(['a', 'b'], [['a', 'b']], {
      a: 'Haircut',
      b: 'Beard',
    });
    expect(warnings).toHaveLength(1);
    expect(
      multiServiceCartErrors({
        selectedIds: ['a', 'b', 'c'],
        settings: { enabled: true, maxServiceCount: 2, maxDurationMinutes: 60, schedulingMode: 'same_visit' },
        totalDurationMinutes: 70,
        incompatibleWarnings: warnings,
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining('at most 2'), expect.stringContaining('exceeds')]));
  });
});
