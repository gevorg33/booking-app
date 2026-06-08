import api, { unwrap } from '../services/api';
import type { BookingSummary } from './booking-types';

export interface ProviderProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  viewMode: 'provider' | 'team';
}

export interface ProviderReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface ProviderReviewsPayload {
  employeeId: string | null;
  averageRating: number | null;
  reviewCount: number;
  reviews: ProviderReviewItem[];
}

export async function fetchProviderProfile(businessId: string): Promise<ProviderProfile> {
  const { data: res } = await api.get(`/businesses/${businessId}/provider/profile`);
  return unwrap<ProviderProfile>(res);
}

export async function updateProviderProfile(
  businessId: string,
  payload: { title?: string; avatarUrl?: string },
): Promise<ProviderProfile> {
  const { data: res } = await api.put(`/businesses/${businessId}/provider/profile`, payload);
  return unwrap<ProviderProfile>(res);
}

export async function fetchProviderReviews(
  businessId: string,
): Promise<ProviderReviewsPayload> {
  const { data: res } = await api.get(`/businesses/${businessId}/provider/reviews`);
  return unwrap<ProviderReviewsPayload>(res);
}

export async function fetchProviderBookingsByDate(
  businessId: string,
  dateKey: string,
): Promise<{
  date: string;
  viewMode: 'provider' | 'team' | 'admin' | 'owner';
  bookings: BookingSummary[];
}> {
  const { data: res } = await api.get(
    `/businesses/${businessId}/provider/bookings/by-date`,
    { params: { date: dateKey } },
  );
  return unwrap(res);
}

export function groupBookingCountsByDate(
  bookings: Array<{ startTime: string }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const booking of bookings) {
    const dateKey = booking.startTime.slice(0, 10);
    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
  }
  return counts;
}

export function renderStarRating(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}
