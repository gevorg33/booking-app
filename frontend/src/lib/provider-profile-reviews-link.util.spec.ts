import { describe, expect, it } from 'vitest';
import {
  isProviderProfileReviewsPaginated,
  shouldLinkProviderProfileToReviewsPage,
  shouldShowProviderProfileSeeAllReviewsLink,
} from './provider-profile-reviews-link.util';

describe('provider-profile-reviews-link.util (e2e-bug.211)', () => {
  it.each([
    {
      id: 'single-page-with-reviews',
      reviewCount: 7,
      averageRating: 3.7,
      expected: true,
    },
    {
      id: 'zero-reviews',
      reviewCount: 0,
      averageRating: null,
      expected: false,
    },
    {
      id: 'null-count',
      reviewCount: null,
      expected: false,
    },
    {
      id: 'count-without-average-still-linkable',
      reviewCount: 2,
      averageRating: null,
      expected: true,
    },
  ])(
    'shouldLinkProviderProfileToReviewsPage: $id',
    ({ reviewCount, averageRating, expected }) => {
      expect(
        shouldLinkProviderProfileToReviewsPage({ reviewCount, averageRating }),
      ).toBe(expected);
    },
  );

  it.each([
    { id: 'page1-only', reviewCount: 7, totalPages: 1, expected: true },
    { id: 'multi-page', reviewCount: 20, totalPages: 2, expected: true },
    { id: 'empty', reviewCount: 0, totalPages: 0, expected: false },
  ])(
    'shouldShowProviderProfileSeeAllReviewsLink: $id',
    ({ reviewCount, totalPages, expected }) => {
      expect(
        shouldShowProviderProfileSeeAllReviewsLink({ reviewCount, totalPages }),
      ).toBe(expected);
    },
  );

  it.each([
    { id: 'single', totalPages: 1, expected: false },
    { id: 'multi', totalPages: 2, expected: true },
    { id: 'zero', totalPages: 0, expected: false },
    { id: 'null', totalPages: null, expected: false },
  ])('isProviderProfileReviewsPaginated: $id', ({ totalPages, expected }) => {
    expect(isProviderProfileReviewsPaginated({ totalPages })).toBe(expected);
  });

  it('documents the bug: totalPages===1 must still expose see-all (not gated on pagination)', () => {
    // Pre-fix gate was `totalPages > 1` — that hid the route for Gevorg.
    expect(isProviderProfileReviewsPaginated({ totalPages: 1 })).toBe(false);
    expect(
      shouldShowProviderProfileSeeAllReviewsLink({
        reviewCount: 7,
        totalPages: 1,
      }),
    ).toBe(true);
  });
});
