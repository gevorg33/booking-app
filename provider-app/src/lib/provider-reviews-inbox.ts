import api, { unwrap } from '../services/api';

export interface ProviderReviewsInboxFilters {
  last30d: boolean;
  lowRating: boolean;
}

export interface ProviderReviewInboxItem {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
  bookingId: string | null;
}

export interface ProviderReviewsInbox {
  employeeId: string | null;
  averageRating: number | null;
  reviewCount: number;
  filteredCount: number;
  postVisitReviewEnabled: boolean;
  filters: ProviderReviewsInboxFilters;
  reviews: ProviderReviewInboxItem[];
}

export interface ProviderReviewRequestEligibility {
  allowed: boolean;
  reason: string | null;
}

export async function fetchProviderReviewsInbox(
  businessId: string,
  filters: Partial<ProviderReviewsInboxFilters>,
): Promise<ProviderReviewsInbox> {
  const { data: res } = await api.get(
    `/businesses/${businessId}/provider/reviews/inbox`,
    {
      params: {
        ...(filters.last30d ? { last30d: 'true' } : {}),
        ...(filters.lowRating ? { lowRating: 'true' } : {}),
      },
    },
  );
  return unwrap<ProviderReviewsInbox>(res);
}

export async function requestProviderBookingReview(
  businessId: string,
  bookingId: string,
): Promise<{ sent: boolean; bookingId: string }> {
  const { data: res } = await api.post(
    `/businesses/${businessId}/provider/bookings/${bookingId}/request-review`,
  );
  return unwrap(res);
}

export function toggleReviewsInboxFilter(
  current: ProviderReviewsInboxFilters,
  key: keyof ProviderReviewsInboxFilters,
): ProviderReviewsInboxFilters {
  return { ...current, [key]: !current[key] };
}
