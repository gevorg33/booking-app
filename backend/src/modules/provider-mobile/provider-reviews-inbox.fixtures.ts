/** prov-exp-2.2 — provider reviews inbox filter scenarios. */

export const PROVIDER_REVIEWS_INBOX_FILTER_SCENARIOS = [
  {
    id: 'no-filters',
    filters: { last30d: false, lowRating: false },
    expectedIds: ['r-new', 'r-old', 'r-low', 'r-high'],
  },
  {
    id: 'last-30d-only',
    filters: { last30d: true, lowRating: false },
    expectedIds: ['r-new', 'r-low', 'r-high'],
  },
  {
    id: 'low-rating-only',
    filters: { last30d: false, lowRating: true },
    expectedIds: ['r-low'],
  },
  {
    id: 'last-30d-and-low-rating',
    filters: { last30d: true, lowRating: true },
    expectedIds: ['r-low'],
  },
] as const;

export const PROVIDER_REVIEW_REQUEST_SCENARIOS = [
  {
    id: 'allowed-completed',
    input: {
      postVisitReviewEnabled: true,
      bookingStatus: 'completed',
      reviewSubmittedAt: null,
      hasExistingReview: false,
      customerEmail: 'a@test.com',
      customerPhone: null,
    },
    allowed: true,
  },
  {
    id: 'blocked-policy-off',
    input: {
      postVisitReviewEnabled: false,
      bookingStatus: 'completed',
      reviewSubmittedAt: null,
      hasExistingReview: false,
      customerEmail: 'a@test.com',
      customerPhone: null,
    },
    allowed: false,
    reason: 'policy_disabled',
  },
  {
    id: 'blocked-already-submitted',
    input: {
      postVisitReviewEnabled: true,
      bookingStatus: 'completed',
      reviewSubmittedAt: '2026-06-01T00:00:00.000Z',
      hasExistingReview: false,
      customerEmail: 'a@test.com',
      customerPhone: null,
    },
    allowed: false,
    reason: 'already_submitted',
  },
  {
    id: 'blocked-not-completed',
    input: {
      postVisitReviewEnabled: true,
      bookingStatus: 'confirmed',
      reviewSubmittedAt: null,
      hasExistingReview: false,
      customerEmail: 'a@test.com',
      customerPhone: null,
    },
    allowed: false,
    reason: 'booking_not_completed',
  },
] as const;
