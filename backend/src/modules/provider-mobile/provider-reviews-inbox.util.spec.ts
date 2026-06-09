import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  PROVIDER_REVIEWS_INBOX_FILTER_SCENARIOS,
  PROVIDER_REVIEW_REQUEST_SCENARIOS,
} from './provider-reviews-inbox.fixtures.js';
import {
  buildProviderReviewRequestEligibility,
  buildProviderReviewsInboxView,
  filterProviderReviewInboxItems,
  isLowRatingReview,
  isReviewWithinLastDays,
  mapProviderReviewInboxItem,
  normalizeProviderReviewsInboxFilters,
} from './provider-reviews-inbox.util.js';

describe('provider-reviews-inbox.util (prov-exp-2.2)', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');
  const sampleReviews = [
    {
      id: 'r-new',
      rating: 5,
      comment: 'Great',
      customerName: 'Sam',
      createdAt: new Date('2026-06-10T10:00:00.000Z'),
      bookingId: 'bk-1',
    },
    {
      id: 'r-old',
      rating: 4,
      comment: null,
      customerName: 'Ann',
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      bookingId: 'bk-2',
    },
    {
      id: 'r-low',
      rating: 2,
      comment: 'Late',
      customerName: 'Jo',
      createdAt: new Date('2026-06-12T10:00:00.000Z'),
      bookingId: 'bk-3',
    },
    {
      id: 'r-high',
      rating: 5,
      comment: 'Perfect',
      customerName: 'Kim',
      createdAt: new Date('2026-06-11T10:00:00.000Z'),
      bookingId: null,
    },
  ];

  it('normalizes inbox filter query params', () => {
    expect(
      normalizeProviderReviewsInboxFilters({ last30d: 'true', lowRating: '1' }),
    ).toEqual({ last30d: true, lowRating: true });
    expect(normalizeProviderReviewsInboxFilters({})).toEqual({
      last30d: false,
      lowRating: false,
    });
  });

  it('detects last-30d and low-rating reviews', () => {
    expect(
      isReviewWithinLastDays(new Date('2026-06-01T00:00:00.000Z'), now, 30),
    ).toBe(true);
    expect(
      isReviewWithinLastDays(new Date('2026-03-01T00:00:00.000Z'), now, 30),
    ).toBe(false);
    expect(isLowRatingReview(3)).toBe(true);
    expect(isLowRatingReview(4)).toBe(false);
  });

  it.each(PROVIDER_REVIEWS_INBOX_FILTER_SCENARIOS)(
    'filterProviderReviewInboxItems — $id',
    ({ filters, expectedIds }) => {
      const filtered = filterProviderReviewInboxItems(
        sampleReviews,
        filters,
        now,
      );
      expect(filtered.map((review) => review.id)).toEqual(expectedIds);
    },
  );

  it('builds inbox view with averages and booking links', () => {
    const view = buildProviderReviewsInboxView({
      employeeId: 'emp-1',
      reviews: sampleReviews,
      filters: { last30d: false, lowRating: false },
      postVisitReviewEnabled: true,
      now,
    });

    expect(view.reviewCount).toBe(4);
    expect(view.filteredCount).toBe(4);
    expect(view.averageRating).toBe(4);
    expect(view.reviews[0]?.bookingId).toBe('bk-1');
    expect(view.postVisitReviewEnabled).toBe(true);
  });

  it('maps trimmed review fields for inbox items', () => {
    const view = buildProviderReviewsInboxView({
      employeeId: 'emp-1',
      reviews: [
        {
          id: 'r-1',
          rating: 3,
          comment: '  ok  ',
          customerName: '  Pat  ',
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
          bookingId: null,
        },
      ],
      filters: { last30d: false, lowRating: false },
      postVisitReviewEnabled: false,
    });

    expect(view.reviews[0]).toEqual({
      id: 'r-1',
      rating: 3,
      comment: 'ok',
      customerName: 'Pat',
      createdAt: '2026-06-01T00:00:00.000Z',
      bookingId: null,
    });
  });

  it.each(PROVIDER_REVIEW_REQUEST_SCENARIOS)(
    'buildProviderReviewRequestEligibility — $id',
    ({ input, allowed, reason }) => {
      const result = buildProviderReviewRequestEligibility({
        ...input,
        bookingStatus:
          input.bookingStatus === 'completed'
            ? BookingStatus.COMPLETED
            : BookingStatus.CONFIRMED,
      });
      expect(result.allowed).toBe(allowed);
      if (reason) expect(result.reason).toBe(reason);
    },
  );
});
