import { describe, expect, it } from 'vitest';
import {
  ADOPTION_RETENTION_METRIC_GROUPS,
  readAdoptionRetentionMetric,
} from './adoption-retention-display.util';

describe('adoption-retention-display.util (adopt-1.5)', () => {
  it('defines return, rebook, and win-back metric groups', () => {
    expect(ADOPTION_RETENTION_METRIC_GROUPS.map((group) => group.id)).toEqual([
      'return',
      'rebook',
      'winback',
    ]);
  });

  it('reads numeric retention metrics from dashboard payload', () => {
    const retention = {
      cohortSize: 3,
      d1ReturnRate: 2 / 3,
      d7ReturnRate: 2 / 3,
      d30ReturnRate: 2 / 3,
      rebookWithin30DaysRate: 1 / 3,
      rebookWithin60DaysRate: 1 / 3,
      rebookWithin90DaysRate: 1 / 3,
      resurrectionRate: 1 / 3,
    };

    expect(readAdoptionRetentionMetric(retention, 'd7ReturnRate')).toBeCloseTo(2 / 3, 5);
    expect(readAdoptionRetentionMetric(retention, 'cohortSize')).toBe(3);
  });
});
