/** prov-exp-2.2 — provider mobile reviews inbox + review request eligibility. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_REVIEWS_INBOX_LOW_RATING_MAX = 3;
export const PROVIDER_REVIEWS_INBOX_LAST_DAYS = 30;
export const PROVIDER_REVIEWS_INBOX_FETCH_LIMIT = 200;

export type ProviderReviewRequestBlockReason =
  | 'policy_disabled'
  | 'booking_not_completed'
  | 'already_submitted'
  | 'no_customer_contact';

export interface ProviderReviewsInboxFilters {
  last30d: boolean;
  lowRating: boolean;
}

export interface ProviderReviewInboxItemLike {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: Date;
  bookingId: string | null;
}

export interface ProviderReviewsInboxItem {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
  bookingId: string | null;
}

export interface ProviderReviewsInboxView {
  employeeId: string | null;
  averageRating: number | null;
  reviewCount: number;
  filteredCount: number;
  postVisitReviewEnabled: boolean;
  filters: ProviderReviewsInboxFilters;
  reviews: ProviderReviewsInboxItem[];
}

export interface ProviderReviewRequestEligibility {
  allowed: boolean;
  reason: ProviderReviewRequestBlockReason | null;
}

export interface ProviderReviewRequestEligibilityInput {
  postVisitReviewEnabled: boolean;
  bookingStatus: string;
  reviewSubmittedAt?: unknown;
  hasExistingReview: boolean;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

export function normalizeProviderReviewsInboxFilters(query: {
  last30d?: string | boolean | null;
  lowRating?: string | boolean | null;
}): ProviderReviewsInboxFilters {
  const truthy = (value: string | boolean | null | undefined) =>
    value === true || value === 'true' || value === '1';
  return {
    last30d: truthy(query.last30d),
    lowRating: truthy(query.lowRating),
  };
}

export function isReviewWithinLastDays(
  createdAt: Date,
  now: Date,
  days: number,
): boolean {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return createdAt >= cutoff;
}

export function isLowRatingReview(
  rating: number,
  maxRating = PROVIDER_REVIEWS_INBOX_LOW_RATING_MAX,
): boolean {
  return rating <= maxRating;
}

export function filterProviderReviewInboxItems(
  reviews: ProviderReviewInboxItemLike[],
  filters: ProviderReviewsInboxFilters,
  now = new Date(),
): ProviderReviewInboxItemLike[] {
  return reviews.filter((review) => {
    if (
      filters.last30d &&
      !isReviewWithinLastDays(
        review.createdAt,
        now,
        PROVIDER_REVIEWS_INBOX_LAST_DAYS,
      )
    ) {
      return false;
    }
    if (filters.lowRating && !isLowRatingReview(review.rating)) {
      return false;
    }
    return true;
  });
}

export function mapProviderReviewInboxItem(
  review: ProviderReviewInboxItemLike,
): ProviderReviewsInboxItem {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment?.trim() || null,
    customerName: review.customerName?.trim() || null,
    createdAt: review.createdAt.toISOString(),
    bookingId: review.bookingId,
  };
}

export function computeAverageRating(
  reviews: Array<{ rating: number }>,
): number | null {
  if (!reviews.length) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export function buildProviderReviewsInboxView(input: {
  employeeId: string | null;
  reviews: ProviderReviewInboxItemLike[];
  filters: ProviderReviewsInboxFilters;
  postVisitReviewEnabled: boolean;
  now?: Date;
}): ProviderReviewsInboxView {
  const filtered = filterProviderReviewInboxItems(
    input.reviews,
    input.filters,
    input.now,
  );

  return {
    employeeId: input.employeeId,
    averageRating: computeAverageRating(input.reviews),
    reviewCount: input.reviews.length,
    filteredCount: filtered.length,
    postVisitReviewEnabled: input.postVisitReviewEnabled,
    filters: input.filters,
    reviews: filtered.map(mapProviderReviewInboxItem),
  };
}

export function buildProviderReviewRequestEligibility(
  input: ProviderReviewRequestEligibilityInput,
): ProviderReviewRequestEligibility {
  if (!input.postVisitReviewEnabled) {
    return { allowed: false, reason: 'policy_disabled' };
  }
  if (input.bookingStatus !== BookingStatus.COMPLETED) {
    return { allowed: false, reason: 'booking_not_completed' };
  }
  if (input.reviewSubmittedAt || input.hasExistingReview) {
    return { allowed: false, reason: 'already_submitted' };
  }
  const email =
    typeof input.customerEmail === 'string' ? input.customerEmail.trim() : '';
  const phone =
    typeof input.customerPhone === 'string' ? input.customerPhone.trim() : '';
  if (!email && !phone) {
    return { allowed: false, reason: 'no_customer_contact' };
  }
  return { allowed: true, reason: null };
}
