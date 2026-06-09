import axios from 'axios';
import { getCustomerToken } from '../lib/customer-auth.js';
import type {
  PublicBookingManageContext,
  PublicBusinessProfile,
  PublicCustomerBookingItem,
  PublicCustomerProfile,
  PublicReferralProgram,
  PublicShareRewardsView,
  ReferralClaimResponse,
  ShareRewardClaimResponse,
  PublicCustomerSubscription,
  PackageVisitRescheduleLine,
  PublicProvider,
  PublicProviderReview,
  PublicRecommendationProduct,
  PublicService,
  PublicCheckoutQuote,
  PublicServiceDaySlots,
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

const http = axios.create({
  baseURL: getPublicApiBaseUrl(),
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

export async function fetchPublicProviders(
  slug: string,
  opts?: { date?: string; locale?: string },
): Promise<PublicProvider[]> {
  const params = new URLSearchParams();
  if (opts?.date?.trim()) params.set('date', opts.date.trim());
  if (opts?.locale?.trim()) params.set('locale', opts.locale.trim());
  const qs = params.toString();
  const { data } = await http.get(`/public/${slug}/providers${qs ? `?${qs}` : ''}`);
  const body = unwrap<{ providers: PublicProvider[] }>(data);
  return (body.providers ?? []).map((provider) => ({
    ...provider,
    slots: provider.slots ?? [],
    averageRating: provider.averageRating ?? null,
    reviewCount: provider.reviewCount ?? 0,
  }));
}

export async function fetchPublicServicesForSlot(
  slug: string,
  employeeId: string,
  startTime: string,
  locale?: string,
): Promise<PublicService[]> {
  const params = new URLSearchParams({ employeeId, startTime });
  if (locale?.trim()) params.set('locale', locale.trim());
  const { data } = await http.get(`/public/${slug}/services/for-slot?${params.toString()}`);
  const body = unwrap<{ services: PublicService[] }>(data);
  return body.services ?? [];
}

export async function fetchPublicProviderReviews(
  slug: string,
  employeeId: string,
  page = 1,
): Promise<import('../lib/types.js').PublicProviderReviewsPage> {
  const { data } = await http.get(
    `/public/${slug}/providers/${employeeId}/reviews?page=${page}`,
  );
  return unwrap(data);
}

export async function submitPublicProviderReview(
  slug: string,
  employeeId: string,
  body: { rating: number; comment?: string; idToken?: string },
): Promise<PublicProviderReview> {
  const { data } = await http.post(
    `/public/${slug}/providers/${employeeId}/reviews`,
    body,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchServiceDaySlots(
  slug: string,
  serviceId: string,
  date: string,
): Promise<PublicServiceDaySlots> {
  const { data } = await http.get(
    `/public/${slug}/services/${serviceId}/slots?date=${encodeURIComponent(date)}`,
  );
  const body = unwrap<PublicServiceDaySlots>(data);
  return {
    date: body.date ?? date,
    serviceId: body.serviceId ?? serviceId,
    serviceName: body.serviceName ?? '',
    slots: body.slots ?? [],
    remainingSpots: body.remainingSpots ?? null,
  };
}

/** @deprecated Use fetchServiceDaySlots */
export const fetchServiceSlots = fetchServiceDaySlots;

export async function loginWithGoogle(
  slug: string,
  idToken: string,
  options?: { preferredLocale?: string; analyticsAnonId?: string },
): Promise<{ token: string; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/auth/google`, {
    idToken,
    preferredLocale: options?.preferredLocale,
    analyticsAnonId: options?.analyticsAnonId,
  });
  return unwrap<{ token: string; customer: PublicCustomerProfile }>(data);
}

export async function fetchMyReferralProgram(slug: string): Promise<PublicReferralProgram> {
  const { data } = await http.get(`/public/${slug}/me/referral`, publicConfig(slug));
  return unwrap<PublicReferralProgram>(data);
}

export async function claimReferralCode(
  slug: string,
  referralCode: string,
): Promise<ReferralClaimResponse> {
  const { data } = await http.post(
    `/public/${slug}/me/referral/claim`,
    { referralCode },
    publicConfig(slug),
  );
  return unwrap<ReferralClaimResponse>(data);
}

export async function fetchMyShareRewards(slug: string): Promise<PublicShareRewardsView> {
  const { data } = await http.get(`/public/${slug}/me/share-rewards`, publicConfig(slug));
  return unwrap<PublicShareRewardsView>(data);
}

export async function claimShareReward(
  slug: string,
  channel: 'salon' | 'booking',
  bookingId?: string,
): Promise<ShareRewardClaimResponse> {
  const { data } = await http.post(
    `/public/${slug}/me/share-rewards/claim`,
    { channel, bookingId },
    publicConfig(slug),
  );
  return unwrap<ShareRewardClaimResponse>(data);
}

export async function fetchMyPreferredLocale(
  slug: string,
): Promise<{ preferredLocale: string; storedLocale: string | null }> {
  const { data } = await http.get(`/public/${slug}/me/locale`, publicConfig(slug));
  return unwrap(data);
}

export async function updateMyPreferredLocale(
  slug: string,
  preferredLocale: string,
): Promise<{ preferredLocale: string; storedLocale: string | null }> {
  const { data } = await http.patch(
    `/public/${slug}/me/locale`,
    { preferredLocale },
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchMyNotificationPreferences(
  slug: string,
): Promise<import('../lib/consumer-notification-preferences.util.js').ConsumerNotificationPreferences> {
  const { data } = await http.get(
    `/public/${slug}/me/notification-preferences`,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function updateMyNotificationPreferences(
  slug: string,
  patch: import('../lib/consumer-notification-preferences.util.js').ConsumerNotificationPreferencesPatch,
): Promise<import('../lib/consumer-notification-preferences.util.js').ConsumerNotificationPreferences> {
  const { data } = await http.patch(
    `/public/${slug}/me/notification-preferences`,
    patch,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function fetchMyBookings(slug: string): Promise<PublicCustomerBookingItem[]> {
  const { data } = await http.get(`/public/${slug}/me/bookings`, publicConfig(slug));
  const body = unwrap<{ bookings: PublicCustomerBookingItem[] }>(data);
  return body.bookings ?? [];
}

export async function fetchMySubscriptions(slug: string): Promise<PublicCustomerSubscription[]> {
  const { data } = await http.get(`/public/${slug}/me/subscriptions`, publicConfig(slug));
  const body = unwrap<{ subscriptions: import('../lib/types.js').PublicCustomerSubscription[] }>(data);
  return body.subscriptions ?? [];
}

export async function fetchMySubscriptionUsage(
  slug: string,
  subscriptionId: string,
): Promise<{
  subscription: import('../lib/types.js').PublicCustomerSubscription;
  usage: import('../lib/types.js').PublicSubscriptionUsageRow[];
}> {
  const { data } = await http.get(
    `/public/${slug}/me/subscriptions/${subscriptionId}/usage`,
    publicConfig(slug),
  );
  return unwrap(data);
}

export async function exportPublicCustomerData(slug: string): Promise<Record<string, unknown>> {
  const { data } = await http.get(`/public/${slug}/me/data`, publicConfig(slug));
  return unwrap<Record<string, unknown>>(data);
}

export async function deletePublicCustomerData(slug: string): Promise<{ deleted: true }> {
  const { data } = await http.delete(`/public/${slug}/me/data`, publicConfig(slug));
  return unwrap<{ deleted: true }>(data);
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

export async function fetchPublicPackages(slug: string): Promise<PublicServicePackage[]> {
  const { data } = await http.get(`/public/${slug}/packages`);
  const body = unwrap<{ packages: PublicServicePackage[] }>(data);
  return body.packages ?? [];
}

export async function fetchPublicPackage(
  slug: string,
  packageId: string,
): Promise<{ package: PublicServicePackage }> {
  const { data } = await http.get(`/public/${slug}/packages/${packageId}`);
  return unwrap<{ package: PublicServicePackage }>(data);
}

export type BookPublicPackageBody = {
  packageId: string;
  lines: Array<{ serviceId: string; employeeId?: string; startTime: string }>;
  notes?: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  markPaid?: boolean;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    emailReminders?: boolean;
    whatsappReminders?: boolean;
    reminderHoursBefore?: number | null;
    privacyConsentAccepted?: boolean;
    marketingOptIn?: boolean;
  };
};

export async function quotePublicPackage(
  slug: string,
  body: { packageId: string; promoCode?: string; loyaltyPointsToRedeem?: number },
): Promise<PublicCheckoutQuote> {
  const { data } = await http.post(`/public/${slug}/packages/quote`, body, publicConfig(slug));
  return unwrap<PublicCheckoutQuote>(data);
}

export async function bookPublicPackage(slug: string, body: BookPublicPackageBody) {
  const { data } = await http.post(`/public/${slug}/packages/book`, body, publicConfig(slug));
  return unwrap<{ bookings: unknown[]; packagePurchase: { id: string } }>(data);
}

export async function createPublicPackageCheckout(slug: string, body: BookPublicPackageBody) {
  const { data } = await http.post(`/public/${slug}/packages/checkout`, body, publicConfig(slug));
  return unwrap<{ url: string; sessionId: string; amount: number; currency: string }>(data);
}

export async function fetchPackageProviders(
  slug: string,
  packageId: string,
  startTime: string,
  includeLaterDays = false,
) {
  const params = new URLSearchParams({ startTime });
  if (includeLaterDays) params.set('includeLaterDays', 'true');
  const { data } = await http.get(
    `/public/${slug}/packages/${packageId}/providers?${params.toString()}`,
  );
  return unwrap<{
    providers: Array<{ id: string; name: string; earliestStartTime?: string }>;
  }>(data);
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
  body: {
    serviceId: string;
    purchasePlanId?: string;
    promoCode?: string;
    loyaltyPointsToRedeem?: number;
    paxCount?: number;
  },
): Promise<PublicCheckoutQuote> {
  const { data } = await http.post(`/public/${slug}/bookings/quote`, body, publicConfig(slug));
  return unwrap<PublicCheckoutQuote>(data);
}

export async function getPublicServiceSubscriptionPlans(
  slug: string,
  serviceId: string,
): Promise<import('../lib/types.js').PublicSubscriptionPlan[]> {
  const { data } = await http.get(
    `/public/${slug}/services/${serviceId}/subscription-plans`,
    publicConfig(slug),
  );
  return unwrap<import('../lib/types.js').PublicSubscriptionPlan[]>(data);
}

export async function getPublicActiveSubscription(slug: string, serviceId: string) {
  const { data } = await http.get(
    `/public/${slug}/me/subscriptions/active?serviceId=${encodeURIComponent(serviceId)}`,
    publicConfig(slug),
  );
  return unwrap<{ subscription: import('../lib/types.js').PublicCustomerSubscription | null }>(data);
}

export async function getPublicCustomerLoyalty(slug: string) {
  const { data } = await http.get(`/public/${slug}/me/loyalty`, publicConfig(slug));
  return unwrap<import('../lib/types.js').PublicCustomerLoyalty>(data);
}

export async function fetchPublicPromotions(slug: string) {
  const { data } = await http.get(`/public/${slug}/promotions`);
  return unwrap<import('../lib/consumer-rewards-display.util.js').PublicPromotionsPayload>(data);
}

export async function fetchMyRewards(slug: string) {
  const { data } = await http.get(`/public/${slug}/me/rewards`, publicConfig(slug));
  return unwrap<import('../lib/consumer-rewards-display.util.js').PublicCustomerRewardsPayload>(data);
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
    promoCode?: string;
    loyaltyPointsToRedeem?: number;
    useSubscriptionId?: string;
    purchasePlanId?: string;
    useSubscriptionCreditOnPurchase?: boolean;
    paymentMethod?: 'online' | 'cash';
    paxCount?: number;
    customer: { name: string; email?: string; phone?: string };
  },
): Promise<{ booking: { id: string }; customer: PublicCustomerProfile }> {
  const { data } = await http.post(`/public/${slug}/bookings`, body, publicConfig(slug));
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

export async function fetchNearestBookableSlot(
  slug: string,
  serviceId: string,
  employeeId?: string,
): Promise<{
  dateKey: string;
  startTime: string;
  employeeId?: string | null;
} | null> {
  const params = new URLSearchParams({ serviceId });
  if (employeeId) params.set('employeeId', employeeId);
  const { data } = await http.get(`/public/${slug}/nearest-slot?${params.toString()}`);
  const body = unwrap<{ nearest: { dateKey: string; startTime: string; employeeId?: string | null } | null }>(
    data,
  );
  return body.nearest ?? null;
}

export async function createPublicBookingCheckout(
  slug: string,
  body: {
    serviceId: string;
    employeeId: string;
    startTime: string;
    preVisitIntakeId?: string;
    clinicOrderToken?: string;
    promoCode?: string;
    loyaltyPointsToRedeem?: number;
    useSubscriptionId?: string;
    purchasePlanId?: string;
    useSubscriptionCreditOnPurchase?: boolean;
    paymentMethod?: 'cash';
    paxCount?: number;
    symptoms?: string;
    referralNotes?: string;
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

export interface PublicAssistantNavigate {
  path: string;
  query: Record<string, string>;
}

export interface PublicAssistantResponse {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
  details?: Record<string, unknown>;
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

export type BookPublicMultiServiceBody = {
  serviceIds: string[];
  blockStartTime?: string;
  employeeId?: string;
  lines?: Array<{ serviceId: string; employeeId?: string; startTime: string }>;
  notes?: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  markPaid?: boolean;
  customer: { name: string; email?: string; phone?: string };
};

export async function bookPublicMultiService(
  slug: string,
  body: BookPublicMultiServiceBody,
): Promise<{ multiServiceGroup: { id: string }; bookings: unknown[] }> {
  const { data } = await http.post(`/public/${slug}/multi-service/book`, body, publicConfig(slug));
  return unwrap(data);
}

export async function previewPublicMultiService(slug: string, serviceIds: string[]) {
  const { data } = await http.post(`/public/${slug}/multi-service/preview`, { serviceIds });
  return unwrap<{
    valid: boolean;
    errors: string[];
    totals: {
      totalPrice: number;
      currency: string;
      totalDurationMinutes: number;
    } | null;
  }>(data);
}

export async function getPublicMultiServiceBlockSlots(
  slug: string,
  serviceIds: string[],
  date: string,
) {
  const params = new URLSearchParams({
    date,
    serviceIds: [...new Set(serviceIds)].join(','),
  });
  const { data } = await http.get(
    `/public/${slug}/multi-service/block-slots?${params.toString()}`,
  );
  return unwrap<{
    date: string;
    serviceIds: string[];
    totalDurationMinutes: number;
    slots: PublicSlot[];
  }>(data);
}

export async function suggestPublicMultiServiceBlock(slug: string, serviceIds: string[]) {
  const params = new URLSearchParams({
    serviceIds: [...new Set(serviceIds)].join(','),
  });
  const { data } = await http.get(
    `/public/${slug}/multi-service/suggest-block?${params.toString()}`,
  );
  return unwrap<{
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  }>(data);
}

export async function getPublicMultiServiceProviders(
  slug: string,
  serviceIds: string[],
  startTime: string,
  includeLaterDays = false,
) {
  const params = new URLSearchParams({
    startTime,
    serviceIds: serviceIds.join(','),
    ...(includeLaterDays ? { includeLaterDays: 'true' } : {}),
  });
  const { data } = await http.get(
    `/public/${slug}/multi-service/providers?${params.toString()}`,
  );
  return unwrap<{
    providers: Array<PublicProvider & { earliestStartTime?: string }>;
  }>(data);
}

export async function suggestPublicMultiServiceLines(slug: string, serviceIds: string[]) {
  const params = new URLSearchParams({ serviceIds: serviceIds.join(',') });
  const { data } = await http.get(
    `/public/${slug}/multi-service/suggest-lines?${params.toString()}`,
  );
  return unwrap<{
    lines: Array<{
      serviceId: string;
      serviceName: string;
      startTime: string;
      employeeId: string;
      employeeName: string;
    }>;
  }>(data);
}

export async function quotePublicMultiService(
  slug: string,
  body: { serviceIds: string[]; promoCode?: string; loyaltyPointsToRedeem?: number },
): Promise<PublicCheckoutQuote> {
  const { data } = await http.post(`/public/${slug}/multi-service/quote`, body, publicConfig(slug));
  return unwrap<PublicCheckoutQuote>(data);
}

export async function createPublicMultiServiceCheckout(
  slug: string,
  body: BookPublicMultiServiceBody,
): Promise<{ url: string; sessionId: string; amount: number; currency: string }> {
  const { data } = await http.post(`/public/${slug}/multi-service/checkout`, body, publicConfig(slug));
  return unwrap(data);
}

/** @deprecated Use previewPublicMultiService */
export async function quotePublicMultiServicePreview(
  slug: string,
  serviceIds: string[],
) {
  return previewPublicMultiService(slug, serviceIds);
}

export async function getPublicGiftCardCatalog(slug: string) {
  const { data } = await http.get(`/public/${slug}/gift-cards/catalog`);
  return unwrap<import('../lib/gift-card.types.js').PublicGiftCardCatalog>(data);
}

export async function quotePublicGiftCardPurchase(
  slug: string,
  body: import('../lib/gift-card.types.js').PurchasePublicGiftCardBody,
) {
  const { data } = await http.post(`/public/${slug}/gift-cards/quote`, body, publicConfig(slug));
  return unwrap<import('../lib/gift-card.types.js').PublicGiftCardPurchaseQuote>(data);
}

export async function createPublicGiftCardCheckout(
  slug: string,
  body: import('../lib/gift-card.types.js').PurchasePublicGiftCardBody,
) {
  const { data } = await http.post(`/public/${slug}/gift-cards/checkout`, body, publicConfig(slug));
  return unwrap<{ url: string; sessionId: string; amount: number; currency: string }>(data);
}

export async function purchasePublicGiftCard(
  slug: string,
  body: import('../lib/gift-card.types.js').PurchasePublicGiftCardBody,
) {
  const { data } = await http.post(`/public/${slug}/gift-cards/purchase`, body, publicConfig(slug));
  return unwrap<{ giftCard: { id: string; code: string } }>(data);
}

export async function claimPublicGiftCard(slug: string, code: string) {
  const { data } = await http.post(
    `/public/${slug}/gift-cards/claim`,
    { code },
    publicConfig(slug),
  );
  return unwrap<{
    giftCardId: string;
    cardType: string;
    packagePurchaseId?: string;
    subscriptionId?: string;
  }>(data);
}

export async function getPublicCustomerGiftCards(slug: string) {
  const { data } = await http.get(`/public/${slug}/gift-cards/orders`, publicConfig(slug));
  return unwrap<import('../lib/gift-card.types.js').PublicCustomerGiftCardAccount>(data);
}

export async function submitPublicGiftCardCancelRequest(
  slug: string,
  giftCardId: string,
  body: { customerNotes?: string },
) {
  const { data } = await http.post(
    `/public/${slug}/gift-cards/orders/${giftCardId}/cancel-request`,
    body,
    publicConfig(slug),
  );
  return unwrap<{
    request: { status: string; requestType: string };
    order: import('../lib/gift-card.types.js').PublicGiftCardOrder;
    refundStatus?: 'refunded' | 'failed' | 'skipped' | 'already_refunded';
  }>(data);
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

export async function recordAppAnalyticsEvents(
  body: AppAnalyticsIngestBody,
): Promise<{ recorded: number; skipped: number }> {
  const { data } = await http.post('/events/app', body);
  return unwrap<{ recorded: number; skipped: number }>(data);
}
