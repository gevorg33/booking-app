import { describe, expect, it } from 'vitest';
import {
  canLoadMoreProviderReviews,
  mergeProviderReviewItems,
  nextProviderReviewsPage,
} from './provider-reviews-pagination.util.js';
import type { PublicProviderReview } from './types.js';

function review(id: string): PublicProviderReview {
  return {
    id,
    rating: 5,
    comment: null,
    customerName: null,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

describe('provider-reviews-pagination.util', () => {
  it.each([
    {
      id: 'e2e-bug.25-has-more-after-page-size',
      loadedCount: 15,
      reviewCount: 22,
      expected: true,
    },
    {
      id: 'e2e-bug.25-all-loaded',
      loadedCount: 22,
      reviewCount: 22,
      expected: false,
    },
    {
      id: 'e2e-bug.25-empty',
      loadedCount: 0,
      reviewCount: 0,
      expected: false,
    },
    {
      id: 'e2e-bug.25-under-page-size',
      loadedCount: 7,
      reviewCount: 7,
      expected: false,
    },
  ])('$id', ({ loadedCount, reviewCount, expected }) => {
    expect(canLoadMoreProviderReviews({ loadedCount, reviewCount })).toBe(expected);
  });

  it('nextProviderReviewsPage increments from current page', () => {
    expect(nextProviderReviewsPage(1)).toBe(2);
    expect(nextProviderReviewsPage(0)).toBe(2);
  });

  it('mergeProviderReviewItems appends and dedupes by id', () => {
    const existing = [review('a'), review('b')];
    expect(mergeProviderReviewItems(existing, [review('b'), review('c')])).toEqual([
      review('a'),
      review('b'),
      review('c'),
    ]);
  });
});
