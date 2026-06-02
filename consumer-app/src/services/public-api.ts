import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { getCustomerToken } from '../lib/customer-auth.js';
import type {
  PublicBookingManageContext,
  PublicBusinessProfile,
  PublicCustomerBookingItem,
  PublicCustomerProfile,
  PublicCustomerSubscription,
  PackageVisitRescheduleLine,
  PublicProvider,
  PublicService,
  PublicSlot,
} from '../lib/types.js';
import type { PublicServicePackage } from '../lib/package-booking.js';

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === 'android' &&
    /localhost|127\.0\.0\.1/.test(envUrl)
  ) {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return envUrl.replace(/\/$/, '');
}

const http = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

function unwrap<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function publicConfig(slug: string) {
  const token = getCustomerToken(slug);
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function fetchPublicProfile(slug: string): Promise<PublicBusinessProfile> {
  const { data } = await http.get(`/public/${slug}`);
  return unwrap<PublicBusinessProfile>(data);
}

export async function fetchPublicServices(slug: string): Promise<PublicService[]> {
  const { data } = await http.get(`/public/${slug}/services`);
  const body = unwrap<{ services: PublicService[] }>(data);
  return body.services ?? [];
}

export async function fetchPublicProviders(slug: string): Promise<PublicProvider[]> {
  const { data } = await http.get(`/public/${slug}/providers`);
  const body = unwrap<{ providers: PublicProvider[] }>(data);
  return body.providers ?? [];
}

export async function fetchServiceDaySlots(
  slug: string,
  serviceId: string,
  date: string,
): Promise<PublicSlot[]> {
  const { data } = await http.get(
    `/public/${slug}/services/${serviceId}/slots?date=${encodeURIComponent(date)}`,
  );
  const body = unwrap<{ slots: PublicSlot[] }>(data);
  return body.slots ?? [];
}

/** @deprecated Use fetchServiceDaySlots */
export const fetchServiceSlots = fetchServiceDaySlots;

export async function loginWithGoogle(
  slug: string,
  idToken: string,
): Promise<{ token: string; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/auth/google`, { idToken });
  return unwrap<{ token: string; customer: PublicCustomerProfile }>(data);
}

export async function fetchMyBookings(slug: string): Promise<PublicCustomerBookingItem[]> {
  const { data } = await http.get(`/public/${slug}/me/bookings`, publicConfig(slug));
  const body = unwrap<{ bookings: PublicCustomerBookingItem[] }>(data);
  return body.bookings ?? [];
}

export async function fetchMySubscriptions(slug: string): Promise<PublicCustomerSubscription[]> {
  const { data } = await http.get(`/public/${slug}/me/subscriptions`, publicConfig(slug));
  const body = unwrap<{ subscriptions: PublicCustomerSubscription[] }>(data);
  return body.subscriptions ?? [];
}

export async function cancelCustomerBooking(
  slug: string,
  bookingId: string,
): Promise<{ booking: { id: string; status: string } }> {
  const { data } = await http.post(
    `/public/${slug}/me/bookings/${bookingId}/cancel`,
    {},
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function cancelBookingWithToken(
  slug: string,
  bookingId: string,
  token: string,
): Promise<{ booking: { id: string; status: string } }> {
  const { data } = await http.post(`/public/${slug}/bookings/manage/cancel`, {
    bookingId,
    token,
  });
  return unwrap(data);
}

export async function rescheduleCustomerBooking(
  slug: string,
  bookingId: string,
  body: { startTime: string; employeeId?: string },
): Promise<{ booking: { id: string; startTime: string }; previousStartTime: string }> {
  const { data } = await http.post(
    `/public/${slug}/me/bookings/${bookingId}/reschedule`,
    body,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function rescheduleBookingWithToken(
  slug: string,
  bookingId: string,
  token: string,
  body: { startTime: string; employeeId?: string },
): Promise<{ booking: { id: string; startTime: string }; previousStartTime: string }> {
  const { data } = await http.post(`/public/${slug}/bookings/manage/reschedule`, {
    bookingId,
    token,
    ...body,
  });
  return unwrap(data);
}

export async function fetchBookingManageContext(
  slug: string,
  bookingId: string,
  token: string,
): Promise<PublicBookingManageContext> {
  const params = new URLSearchParams({ bookingId, token });
  const { data } = await http.get(`/public/${slug}/bookings/manage?${params.toString()}`);
  return unwrap<PublicBookingManageContext>(data);
}

export async function cancelCustomerPackageVisit(
  slug: string,
  bookingId: string,
): Promise<{ bookings: Array<{ id: string; status: string }> }> {
  const { data } = await http.post(
    `/public/${slug}/me/bookings/${bookingId}/package/cancel`,
    {},
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function cancelPackageVisitWithToken(
  slug: string,
  bookingId: string,
  token: string,
): Promise<{ bookings: Array<{ id: string; status: string }> }> {
  const { data } = await http.post(`/public/${slug}/bookings/manage/package/cancel`, {
    bookingId,
    token,
  });
  return unwrap(data);
}

export async function rescheduleCustomerPackageVisit(
  slug: string,
  bookingId: string,
  lines: PackageVisitRescheduleLine[],
): Promise<{ bookings: Array<{ id: string; startTime: string }>; previousStartTime: string }> {
  const { data } = await http.post(
    `/public/${slug}/me/bookings/${bookingId}/package/reschedule`,
    { lines },
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function reschedulePackageVisitWithToken(
  slug: string,
  bookingId: string,
  token: string,
  lines: PackageVisitRescheduleLine[],
): Promise<{ bookings: Array<{ id: string; startTime: string }>; previousStartTime: string }> {
  const { data } = await http.post(`/public/${slug}/bookings/manage/package/reschedule`, {
    bookingId,
    token,
    lines,
  });
  return unwrap(data);
}

export async function fetchPublicPackage(
  slug: string,
  packageId: string,
): Promise<{ package: PublicServicePackage }> {
  const { data } = await http.get(`/public/${slug}/packages/${packageId}`);
  return unwrap<{ package: PublicServicePackage }>(data);
}

export async function suggestPackageBlock(slug: string, packageId: string) {
  const { data } = await http.get(`/public/${slug}/packages/${packageId}/suggest-block`);
  return unwrap<{
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  }>(data);
}

export async function fetchPackageBlockSlots(slug: string, packageId: string, date: string) {
  const { data } = await http.get(
    `/public/${slug}/packages/${packageId}/block-slots?date=${encodeURIComponent(date)}`,
  );
  return unwrap<{ slots: PublicSlot[] }>(data);
}

export async function createBooking(
  slug: string,
  body: {
    serviceId: string;
    employeeId: string;
    startTime: string;
    customer: { name: string; email?: string; phone?: string };
  },
): Promise<{ booking: { id: string }; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/bookings`, body, publicConfig(slug));
  return unwrap(data);
}
