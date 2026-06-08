import axios from 'axios';
import { getCustomerToken } from '../lib/customer-auth.js';
import type {
  PublicBookingManageContext,
  PublicBusinessProfile,
  PublicCustomerBookingItem,
  PublicCustomerProfile,
  PublicCustomerSubscription,
  PackageVisitRescheduleLine,
  PublicProvider,
  PublicRecommendationProduct,
  PublicService,
  PublicCheckoutQuote,
  PublicSlot,
} from '../lib/types.js';
import type { PublicCustomerReleasedClinicResult } from '../lib/public-clinic-results.js';
import { normalizePublicClinicResultsPayload } from '../lib/public-clinic-results.js';
import type { PublicCustomerReleasedClinicDocument } from '../lib/public-clinic-documents.js';
import { normalizePublicClinicDocumentsPayload } from '../lib/public-clinic-documents.js';
import type { PublicClinicLabBookingRequest } from '../lib/public-clinic-lab-booking-requests.js';
import { normalizePublicClinicLabBookingRequestsPayload } from '../lib/public-clinic-lab-booking-requests.js';
import type { PublicServicePackage } from '../lib/package-booking.js';
import { buildCheckoutRecommendationsPath } from '../lib/checkout-recommendations.js';
import type { MobileAppConfigView } from '../lib/app-version-gate.util.js';
import { getPublicApiBaseUrl } from './api-base.js';
import { flushQueue } from '../lib/offline-queue.js';
import {
  shouldReplayConsumerOfflineQueue,
  tryQueueConsumerOfflineAxiosError,
} from '../lib/consumer-api-offline.util.js';
import { attachOperationFeedbackToAxios } from '../lib/operation-feedback.js';

const http = axios.create({
  baseURL: getPublicApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

attachOperationFeedbackToAxios(http);

type OfflineAxiosConfig = {
  __offlineReplay?: boolean;
  __offlineQueued?: boolean;
};

async function replayConsumerOfflineQueue(): Promise<void> {
  if (!shouldReplayConsumerOfflineQueue()) return;
  await flushQueue(async (item) => {
    await http.request({
      method: item.method,
      url: item.url,
      data: item.data,
      __offlineReplay: true,
    } as OfflineAxiosConfig & Parameters<typeof http.request>[0]);
  });
}

http.interceptors.response.use(
  (response) => {
    void replayConsumerOfflineQueue();
    return response;
  },
  async (error) => {
    const queued = tryQueueConsumerOfflineAxiosError(error);
    if (queued) return queued;
    return Promise.reject(error);
  },
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void replayConsumerOfflineQueue();
  });
}

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
  analyticsAnonId?: string,
): Promise<{ token: string; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/auth/google`, {
    idToken,
    analyticsAnonId,
  });
  return unwrap<{ token: string; customer: PublicCustomerProfile }>(data);
}

export async function loginWithApple(
  slug: string,
  idToken: string,
  analyticsAnonId?: string,
): Promise<{ token: string; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/auth/apple`, {
    idToken,
    analyticsAnonId,
  });
  return unwrap<{ token: string; customer: PublicCustomerProfile }>(data);
}

export async function loginWithPhone(
  slug: string,
  idToken: string,
  analyticsAnonId?: string,
): Promise<{ token: string; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/auth/phone`, {
    idToken,
    analyticsAnonId,
  });
  return unwrap<{ token: string; customer: PublicCustomerProfile }>(data);
}

export async function fetchNearestBookableSlot(
  slug: string,
  serviceId: string,
  employeeId?: string,
): Promise<{
  employeeId: string;
  employeeName: string;
  dateKey: string;
  startTime: string;
} | null> {
  const params = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
  const { data } = await http.get(
    `/public/${slug}/services/${serviceId}/nearest-slot${params}`,
  );
  return unwrap<{
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  } | null>(data);
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

export async function fetchPublicPromotions(slug: string) {
  const { data } = await http.get(`/public/${slug}/promotions`);
  return unwrap(data);
}

export async function fetchMyRewards(slug: string) {
  const { data } = await http.get(`/public/${slug}/me/rewards`, publicConfig(slug));
  return unwrap(data);
}

export interface PublicReferralProgram {
  referralCode: string;
  shareUrl: string;
  enabled: boolean;
  referrerBonusPoints: number;
  refereeBonusPoints: number;
  refereePromoCode: string | null;
  conversionsCount: number;
}

export async function fetchMyReferralProgram(slug: string): Promise<PublicReferralProgram> {
  const { data } = await http.get(`/public/${slug}/me/referral`, publicConfig(slug));
  return unwrap(data) as PublicReferralProgram;
}

export async function claimReferralCode(
  slug: string,
  referralCode: string,
): Promise<{ attached: boolean; referralCode?: string; reason?: string }> {
  const { data } = await http.post(
    `/public/${slug}/me/referral/claim`,
    { referralCode },
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchMyNotificationPreferences(slug: string) {
  const { data } = await http.get(
    `/public/${slug}/me/notification-preferences`,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function updateMyNotificationPreferences(
  slug: string,
  patch: {
    pushReminders?: boolean;
    pushOffers?: boolean;
    pushNews?: boolean;
  },
) {
  const { data } = await http.patch(
    `/public/${slug}/me/notification-preferences`,
    patch,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchMyClinicTestResults(
  slug: string,
): Promise<PublicCustomerReleasedClinicResult[]> {
  const { data } = await http.get(`/public/${slug}/me/clinic-test-results`, publicConfig(slug));
  return normalizePublicClinicResultsPayload(data);
}

export async function fetchMyClinicDocuments(
  slug: string,
): Promise<PublicCustomerReleasedClinicDocument[]> {
  const { data } = await http.get(`/public/${slug}/me/clinic-documents`, publicConfig(slug));
  return normalizePublicClinicDocumentsPayload(data);
}

export async function fetchMyClinicLabBookingRequests(
  slug: string,
): Promise<PublicClinicLabBookingRequest[]> {
  const { data } = await http.get(
    `/public/${slug}/me/clinic-lab-booking-requests`,
    publicConfig(slug),
  );
  return normalizePublicClinicLabBookingRequestsPayload(data);
}

export async function fetchMyClinicPatientAlerts(slug: string) {
  const { data } = await http.get(`/public/${slug}/me/clinic-patient-alerts`, publicConfig(slug));
  return data;
}

export async function dismissMyClinicPatientAlert(
  slug: string,
  alertType: import('../lib/clinic-patient-alerts.js').ClinicPatientAlertType,
  sourceId: string,
) {
  const { data } = await http.post(
    `/public/${slug}/me/clinic-patient-alerts/${alertType}/${sourceId}/dismiss`,
    {},
    publicConfig(slug),
  );
  return unwrap<{ dismissed: boolean; id: string }>(data);
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

export async function recordCheckoutRecommendationEvent(
  slug: string,
  body: {
    event: 'shown' | 'clicked';
    productId: string;
    serviceId?: string;
    categoryId?: string;
    bookingId?: string;
    surface?: string;
  },
): Promise<{ recorded: boolean }> {
  const { data } = await http.post(
    `/public/${slug}/checkout/recommendations/events`,
    body,
  );
  return unwrap<{ recorded: boolean }>(data);
}

export async function fetchCheckoutRecommendations(
  slug: string,
  params: { serviceId?: string; categoryId?: string },
): Promise<{ products: PublicRecommendationProduct[] }> {
  const { data } = await http.get(buildCheckoutRecommendationsPath(slug, params));
  return unwrap<{ products: PublicRecommendationProduct[] }>(data);
}

export async function quotePublicBooking(
  slug: string,
  body: { serviceId: string },
): Promise<PublicCheckoutQuote> {
  const { data } = await http.post(`/public/${slug}/bookings/quote`, body, publicConfig(slug));
  return unwrap<PublicCheckoutQuote>(data);
}

export async function createBooking(
  slug: string,
  body: {
    serviceId: string;
    employeeId: string;
    startTime: string;
    preVisitIntakeId?: string;
    referralNotes?: string;
    symptoms?: string;
    clinicOrderToken?: string;
    paymentMethod?: 'online' | 'cash';
    customer: { name: string; email?: string; phone?: string };
  },
): Promise<{ booking: { id: string }; customer: PublicCustomerProfile; paymentMethod?: string; amountDue?: number }> {
  const { data } = await http.post(`/public/${slug}/bookings`, body, publicConfig(slug));
  return unwrap(data);
}

export async function createPublicBookingCheckout(
  slug: string,
  body: {
    serviceId: string;
    employeeId?: string;
    startTime: string;
    preVisitIntakeId?: string;
    clinicOrderToken?: string;
    customer: { name: string; email?: string; phone?: string };
  },
): Promise<{ url: string; sessionId: string; amount: number; currency: string }> {
  const { data } = await http.post(`/public/${slug}/bookings/checkout`, body, publicConfig(slug));
  return unwrap(data);
}

export async function confirmPublicBookingPayment(
  slug: string,
  sessionId: string,
): Promise<{ booking: { id: string }; customer: PublicCustomerProfile }> {
  const { data } = await http.post(
    `/public/${slug}/bookings/confirm-payment`,
    { sessionId },
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchPublicPreVisitIntakeConfig(
  slug: string,
  serviceId: string,
) {
  const { data } = await http.get(
    `/public/${slug}/checkout/pre-visit-intake/config?serviceId=${encodeURIComponent(serviceId)}`,
  );
  return unwrap<import('../lib/public-pre-visit-intake.js').PublicPreVisitIntakeConfig>(data);
}

export async function createPublicPreVisitIntakeDraft(
  slug: string,
  body: { serviceId: string },
) {
  const { data } = await http.post(
    `/public/${slug}/me/pre-visit-intake/draft`,
    body,
    publicConfig(slug),
  );
  return unwrap<import('../lib/public-pre-visit-intake.js').PreVisitIntakeSummary>(data);
}

export async function fetchPublicPreVisitIntakeFlow(slug: string, intakeId: string) {
  const { data } = await http.get(
    `/public/${slug}/me/pre-visit-intake/${intakeId}`,
    publicConfig(slug),
  );
  return unwrap<import('../lib/clinic-pre-visit-intake-types.js').PreVisitIntakeFlowView>(data);
}

export async function startPublicPreVisitIntake(slug: string, intakeId: string) {
  const { data } = await http.post(
    `/public/${slug}/me/pre-visit-intake/${intakeId}/start`,
    {},
    publicConfig(slug),
  );
  return unwrap<import('../lib/clinic-pre-visit-intake-types.js').PreVisitIntakeFlowView>(data);
}

export async function submitPublicPreVisitIntakeAnswer(
  slug: string,
  intakeId: string,
  body: { questionId?: string; values: string[] },
) {
  const { data } = await http.post(
    `/public/${slug}/me/pre-visit-intake/${intakeId}/answers`,
    body,
    publicConfig(slug),
  );
  return unwrap<import('../lib/clinic-pre-visit-intake-types.js').PreVisitIntakeFlowView>(data);
}

export async function registerConsumerNativePush(
  slug: string,
  token: string,
  platform: string,
  analyticsAnonId?: string,
  permissionState?: 'full' | 'provisional' | 'default_on',
): Promise<{ registered: boolean; platform: 'ios' | 'android'; refreshed?: boolean }> {
  const { data } = await http.post(
    `/public/${slug}/me/push/register-native`,
    { token, platform, analyticsAnonId, permissionState },
    publicConfig(slug),
  );
  return unwrap<{ registered: boolean; platform: 'ios' | 'android'; refreshed?: boolean }>(data);
}

export async function ackConsumerPushDelivery(
  slug: string,
  deliveryId: string,
  platform: 'ios' | 'android',
): Promise<{ acked: boolean }> {
  const { data } = await http.post(
    `/public/${slug}/me/push/delivery-ack`,
    { deliveryId, platform },
    publicConfig(slug),
  );
  return unwrap<{ acked: boolean }>(data);
}

export async function fetchConsumerNativePushStatus(
  slug: string,
  platform: string,
): Promise<{ registered: boolean; platform: 'ios' | 'android' | null }> {
  const { data } = await http.get(`/public/${slug}/me/push/native-status`, {
    ...publicConfig(slug),
    params: { platform },
  });
  return unwrap<{ registered: boolean; platform: 'ios' | 'android' | null }>(data);
}

export interface PublicAssistantResponse {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  traceId?: string;
}

export async function sendPublicAssistantMessage(
  slug: string,
  body: {
    prompt: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    context?: Record<string, unknown>;
    locale?: string;
  },
): Promise<PublicAssistantResponse> {
  const { data } = await http.post(`/public/${slug}/assistant`, body, publicConfig(slug));
  return unwrap<PublicAssistantResponse>(data);
}

export async function sendPublicAssistantFeedback(
  slug: string,
  traceId: string,
  body: {
    rating: 'up' | 'down';
    reason?:
      | 'wrong_action'
      | 'wrong_date'
      | 'wrong_person'
      | 'wrong_service'
      | 'did_not_understand';
  },
): Promise<{ ok: true }> {
  const { data } = await http.post(
    `/public/${slug}/assistant/trace/${traceId}/feedback`,
    body,
    publicConfig(slug),
  );
  return unwrap<{ ok: true }>(data);
}

export async function submitCustomerReview(
  slug: string,
  bookingId: string,
  body: { rating: number; comment?: string },
): Promise<{ id: string; rating: number }> {
  const { data } = await http.post(
    `/public/${slug}/me/bookings/${bookingId}/review`,
    body,
    publicConfig(slug),
  );
  return unwrap<{ id: string; rating: number }>(data);
}

export async function createPostBookingSupportTicket(
  slug: string,
  token: string,
  body: { bookingId: string; message?: string },
): Promise<{ ticketId: number; agentUrl?: string }> {
  const { data } = await http.post(`/public/${slug}/me/support/ticket`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return unwrap<{ ticketId: number; agentUrl?: string }>(data);
}

export async function fetchMobileAppConfig(input: {
  surface: 'consumer_app' | 'provider_app';
  platform: 'ios' | 'android' | 'web';
  version?: string;
}): Promise<MobileAppConfigView> {
  const params = new URLSearchParams({
    surface: input.surface,
    platform: input.platform,
  });
  if (input.version?.trim()) params.set('version', input.version.trim());
  const { data } = await http.get(`/mobile-app/config?${params.toString()}`);
  return unwrap<MobileAppConfigView>(data);
}

export interface AppAnalyticsIngestBody {
  businessId?: string;
  tenantSlug?: string;
  consentGranted: boolean;
  events: Array<Record<string, unknown>>;
}

/** adopt-1.1 — batched adoption telemetry ingest (consent-gated, no PII). */
export async function recordAppAnalyticsEvents(
  body: AppAnalyticsIngestBody,
): Promise<{ recorded: number; skipped: number }> {
  const { data } = await http.post('/events/app', body);
  return unwrap<{ recorded: number; skipped: number }>(data);
}
