import { describe, expect, it } from 'vitest';
import {
  applyOptimisticReviewSummary,
  computeOptimisticAverageRating,
} from './provider-review-summary.util.js';

describe('provider-review-summary.util', () => {
  it.each([
    {
      id: 'e2e-bug.26-five-star-on-3.5-avg',
      currentAverage: 3.5,
      previousCount: 6,
      newRating: 5,
      expected: 3.7,
    },
    {
      id: 'first-review',
      currentAverage: null,
      previousCount: 0,
      newRating: 4,
      expected: 4,
    },
    {
      id: 'one-decimal-round-half-up',
      currentAverage: 4,
      previousCount: 1,
      newRating: 5,
      expected: 4.5,
    },
  ])('$id', ({ currentAverage, previousCount, newRating, expected }) => {
    expect(
      computeOptimisticAverageRating(currentAverage, previousCount, newRating),
    ).toBe(expected);
  });

  it('e2e-bug.26: nested double-apply would inflate 3.7 → 3.9 (documents the bug)', () => {
    const once = computeOptimisticAverageRating(3.5, 6, 5);
    expect(once).toBe(3.7);
    // Same formula with already-updated avg but stale prev count — Strict Mode footgun.
    const doubleApplied = computeOptimisticAverageRating(once, 6, 5);
    expect(doubleApplied).toBe(3.9);
  });

  it('applyOptimisticReviewSummary increments count and average together', () => {
    expect(
      applyOptimisticReviewSummary({
        currentAverage: 3.5,
        previousCount: 6,
        newRating: 5,
      }),
    ).toEqual({ reviewCount: 7, averageRating: 3.7 });
  });
});
