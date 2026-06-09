import { describe, expect, it } from 'vitest';
import { toggleReviewsInboxFilter } from './provider-reviews-inbox';

describe('provider-reviews-inbox util (prov-exp-2.2)', () => {
  it('toggles inbox filters immutably', () => {
    const initial = { last30d: false, lowRating: false };
    expect(toggleReviewsInboxFilter(initial, 'last30d')).toEqual({
      last30d: true,
      lowRating: false,
    });
    expect(toggleReviewsInboxFilter(initial, 'lowRating')).toEqual({
      last30d: false,
      lowRating: true,
    });
  });
});
