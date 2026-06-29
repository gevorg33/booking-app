import { getApiBaseUrl, getServerApiBaseUrl } from '@/lib/api-base';
import { formatPublicMoney, formatPublicPrice } from '@/lib/public-currency';
import { runWithOperationFeedback, type PublicFetchInit } from '@/lib/operation-feedback';
import { readClientLocaleForPublicApi } from '@/lib/public-locale-cookie';
import type { PublicCustomerReleasedClinicResult } from '@/lib/public-clinic-results';
import type { PublicCustomerReleasedClinicDocument } from '@/lib/public-clinic-documents';

export type { PublicCustomerReleasedClinicResult } from '@/lib/public-clinic-results';
export type { PublicCustomerReleasedClinicDocument } from '@/lib/public-clinic-documents';

function getPublicApiBaseUrl(): string {
  if (typeof window !== 'undefined') return getApiBaseUrl();
  return getServerApiBaseUrl();
}

function isConnectionRefused(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as {
    code?: string;
    cause?: { code?: string; errors?: Array<{ code?: string }> };
  };
  if (err.code === 'ECONNREFUSED') return true;
  if (err.cause?.code === 'ECONNREFUSED') return true;
  return err.cause?.errors?.some((e) => e.code === 'ECONNREFUSED') ?? false;
}

/** Retry SSR fetches while the API restarts (nest watch / dev-backend). */
async function fetchPublicApi(url: string, init: RequestInit): Promise<Response> {
  const isServer = typeof window === 'undefined';
  const maxAttempts = isServer ? 5 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (!isServer || !isConnectionRefused(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  throw lastError;
}

const publicCustomerTokens = new Map<string, string>();

export function setPublicCustomerToken(slug: string, token: string | null) {
  if (token) {
    publicCustomerTokens.set(slug, token);
  } else {
    publicCustomerTokens.delete(slug);
  }
}

export interface PublicCustomerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PublicCustomerAuthResponse {
  token: string;
  customer: PublicCustomerProfile;
}

export interface PublicCustomerBookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  canReview: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  rescheduleCount: number;
  maxReschedules: number;
  allowProviderChangeOnReschedule?: boolean;
  packagePurchaseId?: string | null;
  packageId?: string | null;
  packageName?: string | null;
}

export interface PublicPackageVisitAppointment {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
  status: string;
  canCancel: boolean;
  canReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
}

export interface PublicPackageVisitSummary {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  appointments: PublicPackageVisitAppointment[];
  canCancelAll: boolean;
  canRescheduleAll: boolean;
  policyMessage: string | null;
  allowProviderChangeOnReschedule: boolean;
}

export interface PublicBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface PublicSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
}

export interface PublicLocation {
  mapEmbedHtml?: string;
}

export interface PublicSupportWidgets {
  zendeskWidgetKey?: string;
}

export interface PublicMetaBooking {
  bookingUrl: string;
  buttonLabel: string;
  facebookPageUrl?: string;
  instagramUsername?: string;
}

export interface PublicMessagingLinks {
  publicBookingUrl: string;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  facebookBookingUrl?: string | null;
  instagramBookingUrl?: string | null;
}

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  locale: string;
  defaultLocale?: string;
  enabledLocales?: string[];
  dateFormat?: string;
  timeFormat?: string;
  tax?: {
    enabled: boolean;
    name: string;
    rate: number;
    model: 'inclusive' | 'exclusive';
    rules?: Array<{ name: string; rate: number }>;
  };
  privacy?: {
    cookieBannerEnabled: boolean;
    cookieBannerMessage?: string;
    privacyPolicyVersion: string;
    requireAiProcessingConsent: boolean;
    requireThirdPartyIntegrationsConsent: boolean;
    dataResidencyRegion: 'eu' | 'us' | 'other';
  };
  currency: string;
  stripeCurrencySupported?: boolean;
  branding: PublicBranding;
  social?: PublicSocialLinks;
  location?: PublicLocation;
  publicBookingEnabled: boolean;
  defaultPhoneCountryCode?: string;
  onlinePaymentsEnabled?: boolean;
  acceptCashPayments?: boolean;
  customerSelfService?: {
    allowCancel: boolean;
    allowReschedule: boolean;
    minimumNoticeHours: number;
    maxReschedulesPerBooking: number;
    allowProviderChangeOnReschedule?: boolean;
  };
  giftCardsPurchaseEnabled?: boolean;
  appointmentReminders?: {
    enabled: boolean;
    optionsHours: number[];
    defaultHours: number | null;
  };
  support?: PublicSupportWidgets;
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
  multiService?: {
    enabled: boolean;
    maxServiceCount: number;
    maxDurationMinutes: number;
    turnoverBufferMinutes: number;
    schedulingMode: 'same_visit' | 'per_service';
    incompatiblePairMode: 'service' | 'category';
    incompatiblePairs: Array<[string, string]>;
    incompatibleCategoryPairs: Array<[string, string]>;
  };
  businessType?: string;
}

export interface PublicProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  nearestDate: string | null;
  nearestDateLabel: string | null;
  slots: Array<{ startTime: string; endTime: string }>;
  averageRating: number | null;
  reviewCount: number;
  recentReviews: PublicProviderReview[];
}

export interface PublicServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
  prepaymentMode?: 'none' | 'full' | 'deposit';
  onlinePaymentEnabled?: boolean;
  depositAmount?: number | null;
  hasSubscriptionPlans?: boolean;
  category?: PublicServiceCategory | null;
  isTour?: boolean;
  tourDurationBadge?: string;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
  dayLevelBooking?: boolean;
  pricePerPerson?: boolean;
  isClinic?: boolean;
  clinicServiceType?: 'consultation' | 'lab_test' | 'procedure';
  clinicServiceTypeBadge?: string;
  requiresFasting?: boolean;
  preparationNotes?: string;
  acceptsPatientNotes?: boolean;
  offersPreVisitIntake?: boolean;
}

export function prepaymentDue(service: PublicService): number {
  if (!service.onlinePaymentEnabled) return 0;
  if (service.prepaymentMode === 'full') return service.price;
  if (service.depositAmount != null && service.depositAmount > 0) {
    return Math.min(service.depositAmount, service.price);
  }
  return Math.round(service.price * 50) / 100;
}

function formatPublicApiError(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return `Request failed (${status})`;
}

async function publicFetch<T>(path: string, init?: PublicFetchInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const { skipOperationFeedback, operationSuccessMessage, ...fetchInit } = init ?? {};

  return runWithOperationFeedback(
    method,
    path,
    async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof document !== 'undefined') {
        const lang = readClientLocaleForPublicApi();
        if (lang) headers['Accept-Language'] = lang;
      }

      const slugMatch = path.match(/^\/public\/([^/]+)/);
      const slug = slugMatch?.[1];
      const token = slug ? publicCustomerTokens.get(slug) : undefined;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetchPublicApi(`${getPublicApiBaseUrl()}${path}`, {
        ...fetchInit,
        method,
        headers: {
          ...headers,
          ...(fetchInit.headers as Record<string, string> | undefined),
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(formatPublicApiError(body, res.status));
      }
      const json = await res.json();
      return (json.data ?? json) as T;
    },
    { skip: skipOperationFeedback, successMessage: operationSuccessMessage },
  );
}

export function getPublicProfile(slug: string, locale?: string) {
  const q = locale ? `?locale=${encodeURIComponent(locale)}` : '';
  return publicFetch<PublicBusinessProfile>(`/public/${slug}${q}`);
}

export interface PublicAppInstall {
  slug: string;
  landingUrl: string;
  qrDataUrl: string;
  customSchemeUrl: string;
  generatedAt: string;
}

export function getPublicAppInstall(slug: string) {
  return publicFetch<PublicAppInstall>(`/public/${slug}/app-install`);
}

export function getPublicProviders(slug: string, date?: string, locale?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (locale) params.set('locale', locale);
  const q = params.toString() ? `?${params.toString()}` : '';
  return publicFetch<{ providers: PublicProvider[] }>(`/public/${slug}/providers${q}`);
}

export function getPublicProviderSlots(slug: string, employeeId: string, date: string) {
  return publicFetch<{ date: string; employeeId: string; employeeName: string; slots: Array<{ startTime: string; endTime: string }> }>(
    `/public/${slug}/providers/${employeeId}/slots?date=${encodeURIComponent(date)}`,
  );
}

export interface PublicProviderReviewsPage {
  employeeId: string;
  employeeName: string;
  employeeRole: string | null;
  avatarUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: PublicProviderReview[];
}

export function getPublicProviderReviews(slug: string, employeeId: string, page = 1) {
  const q = new URLSearchParams({ page: String(page) });
  return publicFetch<PublicProviderReviewsPage>(
    `/public/${slug}/providers/${employeeId}/reviews?${q.toString()}`,
  );
}

export function getPublicServices(
  slug: string,
  opts?: { employeeId?: string; locale?: string },
) {
  const params = new URLSearchParams();
  if (opts?.employeeId) params.set('employeeId', opts.employeeId);
  if (opts?.locale) params.set('locale', opts.locale);
  const q = params.toString() ? `?${params.toString()}` : '';
  return publicFetch<{ services: PublicService[] }>(`/public/${slug}/services${q}`);
}

export interface PublicPackageItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  serviceName: string;
  durationMinutes: number;
  bufferMinutes?: number;
  lineTotal?: number;
  discountedLineTotal?: number;
  lineSavings?: number;
}

export interface PublicServicePackage {
  id: string;
  kind: 'package';
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  expiresAt?: string | null;
  displayOrder: number;
  totalDurationMinutes: number;
  currency: string;
  items: PublicPackageItem[];
  pricing: {
    regularTotal: number;
    packagePrice: number;
    savings: number;
    savingsPercent: number;
  };
}

export function getPublicPackages(slug: string) {
  return publicFetch<{ packages: PublicServicePackage[] }>(`/public/${slug}/packages`);
}

export function getPublicPackage(slug: string, packageId: string) {
  return publicFetch<{ package: PublicServicePackage }>(`/public/${slug}/packages/${packageId}`);
}

export function suggestPublicPackageSlots(slug: string, packageId: string) {
  return publicFetch<{
    dateKey?: string;
    blockStartTime?: string;
    lines: Array<{
      serviceId: string;
      serviceName: string;
      startTime: string;
      employeeId: string;
      employeeName: string;
    }>;
  }>(`/public/${slug}/packages/${packageId}/suggest-slots`);
}

export function getPublicPackageBlockSlots(slug: string, packageId: string, date: string) {
  const params = new URLSearchParams({ date });
  return publicFetch<{
    date: string;
    serviceIds: string[];
    totalDurationMinutes: number;
    slots: PublicServiceDaySlot[];
  }>(`/public/${slug}/packages/${packageId}/block-slots?${params.toString()}`);
}

export function suggestPublicPackageBlock(slug: string, packageId: string) {
  return publicFetch<{
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  }>(`/public/${slug}/packages/${packageId}/suggest-block`);
}

export function getPublicPackageProviders(
  slug: string,
  packageId: string,
  startTime: string,
  includeLaterDays = false,
) {
  const params = new URLSearchParams({
    startTime,
    ...(includeLaterDays ? { includeLaterDays: 'true' } : {}),
  });
  return publicFetch<{ providers: Array<PublicServiceSlotProvider & { earliestStartTime?: string }> }>(
    `/public/${slug}/packages/${packageId}/providers?${params.toString()}`,
  );
}

export type BookPublicPackageBody = {
  packageId: string;
  lines: Array<{ serviceId: string; employeeId?: string; startTime: string }>;
  notes?: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  markPaid?: boolean;
  customer: CreatePublicBookingBody['customer'];
};

export function quotePublicPackage(
  slug: string,
  body: { packageId: string; promoCode?: string; loyaltyPointsToRedeem?: number },
) {
  return publicFetch<PublicCheckoutQuote>(`/public/${slug}/packages/quote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function bookPublicPackage(slug: string, body: BookPublicPackageBody) {
  return publicFetch<{ bookings: unknown[]; packagePurchase: { id: string } }>(
    `/public/${slug}/packages/book`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function createPublicPackageCheckout(slug: string, body: BookPublicPackageBody) {
  return publicFetch<{ url: string; sessionId: string; amount: number; currency: string }>(
    `/public/${slug}/packages/checkout`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function previewPublicMultiService(slug: string, serviceIds: string[]) {
  return publicFetch<{
    valid: boolean;
    errors: string[];
    services: Array<{
      serviceId: string;
      name?: string;
      durationMinutes: number;
      bufferMinutes: number;
      price: number;
    }>;
    totals: {
      serviceCount: number;
      totalDurationMinutes: number;
      blockDurationMinutes: number;
      totalPrice: number;
      currency: string;
    } | null;
  }>(`/public/${slug}/multi-service/preview`, {
    method: 'POST',
    body: JSON.stringify({ serviceIds }),
  });
}

export function getPublicMultiServiceBlockSlots(slug: string, serviceIds: string[], date: string) {
  const params = new URLSearchParams({
    date,
    serviceIds: [...new Set(serviceIds)].join(','),
  });
  return publicFetch<{
    date: string;
    serviceIds: string[];
    totalDurationMinutes: number;
    slots: PublicServiceDaySlot[];
  }>(`/public/${slug}/multi-service/block-slots?${params.toString()}`);
}

export function suggestPublicMultiServiceBlock(slug: string, serviceIds: string[]) {
  const params = new URLSearchParams({
    serviceIds: [...new Set(serviceIds)].join(','),
  });
  return publicFetch<{
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  }>(`/public/${slug}/multi-service/suggest-block?${params.toString()}`);
}

export function getPublicMultiServiceProviders(
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
  return publicFetch<{ providers: Array<PublicServiceSlotProvider & { earliestStartTime?: string }> }>(
    `/public/${slug}/multi-service/providers?${params.toString()}`,
  );
}

export type BookPublicMultiServiceBody = {
  serviceIds: string[];
  blockStartTime?: string;
  employeeId?: string;
  lines?: Array<{ serviceId: string; employeeId?: string; startTime: string }>;
  notes?: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  customer: CreatePublicBookingBody['customer'] & {
    privacyConsentAccepted?: boolean;
    marketingOptIn?: boolean;
  };
};

export function bookPublicMultiService(slug: string, body: BookPublicMultiServiceBody) {
  return publicFetch<{ multiServiceGroup: { id: string }; bookings: unknown[] }>(
    `/public/${slug}/multi-service/book`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function createPublicMultiServiceCheckout(slug: string, body: BookPublicMultiServiceBody) {
  return publicFetch<{ url: string; sessionId: string; amount: number; currency: string }>(
    `/public/${slug}/multi-service/checkout`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function suggestPublicMultiServiceLines(slug: string, serviceIds: string[]) {
  const params = new URLSearchParams({ serviceIds: serviceIds.join(',') });
  return publicFetch<{
    lines: Array<{
      serviceId: string;
      serviceName: string;
      startTime: string;
      employeeId: string;
      employeeName: string;
    }>;
  }>(`/public/${slug}/multi-service/suggest-lines?${params.toString()}`);
}

export function quotePublicMultiService(
  slug: string,
  body: { serviceIds: string[]; promoCode?: string; loyaltyPointsToRedeem?: number },
) {
  return publicFetch<PublicCheckoutQuote>(`/public/${slug}/multi-service/quote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PublicServiceDaySlot {
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
}

export function getPublicServiceDaySlots(slug: string, serviceId: string, date: string) {
  return publicFetch<{
    date: string;
    serviceId: string;
    serviceName: string;
    slots: PublicServiceDaySlot[];
  }>(`/public/${slug}/services/${serviceId}/slots?date=${encodeURIComponent(date)}`);
}

export interface PublicServiceSlotProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  averageRating: number | null;
  reviewCount: number;
}

export function getPublicServiceSlotProviders(slug: string, serviceId: string, startTime: string) {
  return publicFetch<{ providers: PublicServiceSlotProvider[] }>(
    `/public/${slug}/services/${serviceId}/providers?startTime=${encodeURIComponent(startTime)}`,
  );
}

export function getPublicServicesForSlot(
  slug: string,
  employeeId: string,
  startTime: string,
  locale?: string,
) {
  const params = new URLSearchParams({
    employeeId,
    startTime,
  });
  if (locale) params.set('locale', locale);
  return publicFetch<{ services: PublicService[] }>(
    `/public/${slug}/services/for-slot?${params.toString()}`,
  );
}

export interface PublicCheckoutAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty';
  code?: string;
  label: string;
  amount: number;
  points?: number;
}

export interface PublicCheckoutQuote {
  servicePrice: number;
  subtotal: number;
  afterPromo: number;
  afterGiftCard: number;
  promoDiscount: number;
  giftCardDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
  amountDue: number;
  taxEnabled?: boolean;
  taxName?: string | null;
  taxRate?: number | null;
  taxModel?: 'inclusive' | 'exclusive' | null;
  taxAmount?: number;
  netAmount?: number;
  taxRules?: Array<{
    id: string;
    name: string;
    rate: number;
    amount: number;
  }>;
  currency: string;
  loyaltyPointsToRedeem: number;
  loyaltyPointsBalance: number | null;
  pointsToEarn: number;
  promoCode?: string;
  giftCardCode?: string;
  adjustments: PublicCheckoutAdjustment[];
}

export interface PublicCustomerLoyalty {
  pointsBalance: number;
  lifetimeEarned: number;
  bonusDollarValue: number;
  earnPercentCashback: number;
  pointsValue: number;
}

export type CreatePublicBookingBody = {
  employeeId?: string;
  serviceId: string;
  startTime: string;
  notes?: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  useSubscriptionId?: string;
  purchasePlanId?: string;
  useSubscriptionCreditOnPurchase?: boolean;
  paymentMethod?: 'online' | 'cash';
  referralNotes?: string;
  symptoms?: string;
  preVisitIntakeId?: string;
  clinicOrderToken?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    emailReminders?: boolean;
    smsReminders?: boolean;
    whatsappReminders?: boolean;
    reminderHoursBefore?: number | null;
  };
};

export function quotePublicBooking(
  slug: string,
  body: {
    serviceId: string;
    purchasePlanId?: string;
    promoCode?: string;
    loyaltyPointsToRedeem?: number;
  },
) {
  return publicFetch<PublicCheckoutQuote>(`/public/${slug}/bookings/quote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PublicReferralProgram {
  referralCode: string;
  shareUrl: string;
  enabled: boolean;
  referrerRewardType?: 'loyalty_points' | 'gift_card';
  referrerBonusPoints: number;
  referrerGiftCardAmount?: number;
  referrerRewardSummary?: string;
  refereeBonusPoints: number;
  refereePromoCode: string | null;
  conversionsCount: number;
}

export interface PublicReferralClaimResponse {
  attached: boolean;
  referralCode?: string;
  referrerCustomerId?: string;
  refereePromoCode?: string | null;
  reason?: 'invalid_code' | 'self_referral' | 'already_attached' | 'disabled';
}

export function getPublicCustomerReferralProgram(slug: string) {
  return publicFetch<PublicReferralProgram>(`/public/${slug}/me/referral`);
}

export function claimPublicReferralCode(slug: string, referralCode: string) {
  return publicFetch<PublicReferralClaimResponse>(`/public/${slug}/me/referral/claim`, {
    method: 'POST',
    body: JSON.stringify({ referralCode }),
  });
}

export function getPublicCustomerLoyalty(slug: string) {
  return publicFetch<PublicCustomerLoyalty>(`/public/${slug}/me/loyalty`);
}

export interface PublicSubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  includedAppointments: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  preview: {
    pricing: {
      regularTotal: number;
      subscriptionPrice: number;
      savings: number;
      perAppointmentPrice: number;
    };
  };
}

export interface PublicCustomerSubscription {
  id: string;
  status: string;
  appointmentsRemaining: number;
  appointmentsIncluded: number;
  expiresAt: string;
  plan: { name: string; service?: { id: string; name: string } };
}

export function getPublicServiceSubscriptionPlans(slug: string, serviceId: string) {
  return publicFetch<PublicSubscriptionPlan[]>(`/public/${slug}/services/${serviceId}/subscription-plans`);
}

export function getPublicCustomerSubscriptions(slug: string) {
  return publicFetch<PublicCustomerSubscription[]>(`/public/${slug}/me/subscriptions`);
}

export interface PublicSubscriptionUsageRow {
  id: string;
  action: string;
  appointmentsRemainingAfter: number;
  createdAt: string;
}

export function getPublicCustomerSubscriptionUsage(slug: string, subscriptionId: string) {
  return publicFetch<{ subscription: PublicCustomerSubscription; usage: PublicSubscriptionUsageRow[] }>(
    `/public/${slug}/me/subscriptions/${subscriptionId}/usage`,
  );
}

export function getPublicActiveSubscription(slug: string, serviceId: string) {
  return publicFetch<{ subscription: PublicCustomerSubscription | null }>(
    `/public/${slug}/me/subscriptions/active?serviceId=${encodeURIComponent(serviceId)}`,
  );
}

export function createPublicBooking(slug: string, body: CreatePublicBookingBody) {
  return publicFetch<{
    booking: { id: string };
    customer: { id: string; name: string; created: boolean };
    manageToken?: string;
    paymentMethod?: 'online' | 'cash';
    amountDue?: number;
  }>(`/public/${slug}/bookings`, { method: 'POST', body: JSON.stringify(body) });
}

export function getPublicPreVisitIntakeConfig(slug: string, serviceId: string) {
  return publicFetch<import('./public-pre-visit-intake.js').PublicPreVisitIntakeConfig>(
    `/public/${slug}/checkout/pre-visit-intake/config?serviceId=${encodeURIComponent(serviceId)}`,
  );
}

export function createPublicPreVisitIntakeDraft(
  slug: string,
  body: { serviceId: string; questionnaireId?: string },
) {
  return publicFetch<import('./clinic-pre-visit-intake.js').PreVisitIntakeSummary>(
    `/public/${slug}/me/pre-visit-intake/draft`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function getPublicPreVisitIntakeFlow(slug: string, intakeId: string) {
  return publicFetch<import('./clinic-pre-visit-intake.js').PreVisitIntakeFlowView>(
    `/public/${slug}/me/pre-visit-intake/${intakeId}`,
  );
}

export function startPublicPreVisitIntake(slug: string, intakeId: string) {
  return publicFetch<import('./clinic-pre-visit-intake.js').PreVisitIntakeFlowView>(
    `/public/${slug}/me/pre-visit-intake/${intakeId}/start`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export function submitPublicPreVisitIntakeAnswer(
  slug: string,
  intakeId: string,
  body: { questionId?: string; values: string[] },
) {
  return publicFetch<import('./clinic-pre-visit-intake.js').PreVisitIntakeFlowView>(
    `/public/${slug}/me/pre-visit-intake/${intakeId}/answers`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function createPublicBookingCheckout(slug: string, body: CreatePublicBookingBody) {
  return publicFetch<{ url: string; sessionId: string; amount: number; currency: string }>(
    `/public/${slug}/bookings/checkout`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function confirmPublicBookingPayment(slug: string, sessionId: string) {
  return publicFetch<{ booking: unknown; customer: { id: string; name: string } }>(
    `/public/${slug}/bookings/confirm-payment`,
    { method: 'POST', body: JSON.stringify({ sessionId }) },
  );
}

export interface PublicAssistantNavigate {
  path: 'professionals' | 'services' | 'checkout' | 'multi/checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResponse {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
  guide?: import('@/lib/ai-client.types').AiGuideResponse;
  details?: Record<string, unknown>;
}

export function sendPublicAssistantMessage(
  slug: string,
  body: {
    prompt: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    context?: Record<string, unknown>;
    locale?: string;
    assistantMode?: 'guide' | 'act';
  },
) {
  return publicFetch<PublicAssistantResponse>(`/public/${slug}/assistant`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PublicRecommendationProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  externalLink?: string;
  price?: number;
}

export function getCheckoutRecommendations(
  slug: string,
  params: { serviceId?: string; categoryId?: string },
) {
  const q = new URLSearchParams();
  if (params.serviceId) q.set('serviceId', params.serviceId);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  const query = q.toString();
  return publicFetch<{ products: PublicRecommendationProduct[] }>(
    `/public/${slug}/checkout/recommendations${query ? `?${query}` : ''}`,
  );
}

export function recordProductRecommendationEvent(
  slug: string,
  body: {
    event: 'shown' | 'clicked';
    productId: string;
    serviceId?: string;
    categoryId?: string;
    bookingId?: string;
    surface?: string;
  },
) {
  return publicFetch<{ recorded: boolean }>(
    `/public/${slug}/checkout/recommendations/events`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      skipOperationFeedback: true,
    },
  );
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatPrice(price: number, currency: string, locale?: string): string {
  return formatPublicPrice(price, currency, locale);
}

export { formatPublicMoney } from '@/lib/public-currency';

export interface PublicReviewContext {
  businessName: string;
  employeeName: string;
  serviceName: string;
  customerName: string;
  appointmentDate: string;
  alreadySubmitted: boolean;
}

export function getPublicReviewContext(slug: string, bookingId: string, token: string) {
  const q = new URLSearchParams({ bookingId, token });
  return publicFetch<PublicReviewContext>(`/public/${slug}/reviews/context?${q.toString()}`);
}

export function submitPublicReview(
  slug: string,
  body: { bookingId: string; token: string; rating: number; comment?: string; customerName?: string },
) {
  return publicFetch<{ id: string; rating: number }>(`/public/${slug}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function submitProviderPortalReview(
  slug: string,
  employeeId: string,
  body: { idToken?: string; rating: number; comment?: string },
) {
  return publicFetch<PublicProviderReview>(
    `/public/${slug}/providers/${employeeId}/reviews`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function loginPublicCustomer(
  slug: string,
  idToken: string,
  options?: { preferredLocale?: string; analyticsAnonId?: string },
) {
  return publicFetch<PublicCustomerAuthResponse>(`/public/${slug}/auth/google`, {
    method: 'POST',
    body: JSON.stringify({
      idToken,
      preferredLocale: options?.preferredLocale,
      analyticsAnonId: options?.analyticsAnonId,
    }),
  });
}

export function updatePublicCustomerPreferredLocale(
  slug: string,
  preferredLocale: string,
) {
  return publicFetch<{ preferredLocale: string; storedLocale: string | null }>(
    `/public/${slug}/me/locale`,
    { method: 'PATCH', body: JSON.stringify({ preferredLocale }) },
  );
}

export type PublicGiftCardType = 'monetary' | 'service' | 'bundle' | 'package' | 'subscription';
export type PublicGiftCardDeliveryMethod = 'digital' | 'physical';

export interface PublicGiftCardCatalogSettings {
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
  presetAmounts: number[];
  purchasableServices: Array<{ serviceId: string; price?: number | null }>;
  purchasablePackages: Array<{
    packageId: string;
    price?: number | null;
    name: string;
    packagePrice: number;
    regularTotal?: number;
    savingsPercent?: number;
    itemSummary: string;
    currency: string;
  }>;
  purchasableSubscriptionPlans: Array<{
    planId: string;
    price?: number | null;
    name: string;
    serviceName: string;
    includedAppointments: number;
    durationMonths: number;
    subscriptionPrice: number;
    regularTotal: number;
    savings: number;
    savingsPercent: number;
    currency: string;
  }>;
  bundles: Array<{
    id: string;
    name: string;
    lines: Array<{ serviceId: string; serviceName: string; quantity: number }>;
    price: number;
  }>;
  shippingMethods: Array<{ id: string; label: string; fee: number; estimatedDays: string }>;
  cancelModifyEnabled: boolean;
  cancelModifyWindowHours: number;
  acceptCashPayments?: boolean;
}

export interface PublicGiftCardCatalog {
  purchaseEnabled: boolean;
  settings: PublicGiftCardCatalogSettings | null;
}

export interface PublicGiftCardPurchaseQuote {
  cardType: PublicGiftCardType;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  label: string;
}

export interface PublicGiftCardShippingAddress {
  recipientName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  stateRegion?: string;
  postalCode: string;
  country: string;
  instructions?: string;
}

export interface PurchasePublicGiftCardBody {
  cardType: PublicGiftCardType;
  amount?: number;
  serviceId?: string;
  serviceIds?: string[];
  bundleId?: string;
  packageId?: string;
  subscriptionPlanId?: string;
  deliveryMethod: PublicGiftCardDeliveryMethod;
  buyForSelf?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  purchaserEmail: string;
  purchaserName?: string;
  personalMessage?: string;
  shippingAddress?: PublicGiftCardShippingAddress;
  shippingMethodId?: string;
  paymentMethod?: 'online' | 'cash';
}

export function getPublicGiftCardCatalog(slug: string) {
  return publicFetch<PublicGiftCardCatalog>(`/public/${slug}/gift-cards/catalog`);
}

export function quotePublicGiftCardPurchase(slug: string, body: PurchasePublicGiftCardBody) {
  return publicFetch<PublicGiftCardPurchaseQuote>(`/public/${slug}/gift-cards/quote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createPublicGiftCardCheckout(slug: string, body: PurchasePublicGiftCardBody) {
  return publicFetch<{ url: string; sessionId: string; amount: number; currency: string }>(
    `/public/${slug}/gift-cards/checkout`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function purchasePublicGiftCard(slug: string, body: PurchasePublicGiftCardBody) {
  return publicFetch<{ giftCard: { id: string; code: string } }>(
    `/public/${slug}/gift-cards/purchase`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function claimPublicGiftCard(slug: string, code: string) {
  return publicFetch<{
    giftCardId: string;
    cardType: string;
    packagePurchaseId?: string;
    subscriptionId?: string;
  }>(`/public/${slug}/gift-cards/claim`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export interface PublicGiftCardOrderPolicy {
  canCancel: boolean;
  canModify: boolean;
  cancelModifyEnabled: boolean;
  windowExpiresAt: string | null;
  windowRemainingMs: number;
  blockReason: string | null;
}

export interface PublicGiftCardOrder {
  id: string;
  code: string;
  cardType: string;
  balance: number;
  currency: string;
  deliveryMethod: string | null;
  fulfillmentStatus: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  expiresAt: string | null;
  isActive: boolean;
  purchaseAmount: number | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  serviceCredits: Array<{
    serviceId: string;
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
  policy: PublicGiftCardOrderPolicy;
  changeRequest: {
    id: string;
    requestType: 'cancel' | 'modify';
    status: string;
    createdAt: string;
  } | null;
}

export interface PublicGiftCardRedeemed {
  id: string;
  code: string;
  cardType: string;
  currency: string;
  claimedAt: string;
  purchaseAmount: number | null;
  packageId: string | null;
  subscriptionPlanId: string | null;
  serviceCredits: Array<{
    serviceId: string;
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
}

export interface PublicCustomerGiftCardAccount {
  orders: PublicGiftCardOrder[];
  redeemed: PublicGiftCardRedeemed[];
}

export function getPublicCustomerGiftCards(slug: string) {
  return publicFetch<PublicCustomerGiftCardAccount>(`/public/${slug}/gift-cards/orders`);
}

export function submitPublicGiftCardCancelRequest(
  slug: string,
  giftCardId: string,
  body: { customerNotes?: string },
) {
  return publicFetch<{
    request: { status: string; requestType: string };
    order: PublicGiftCardOrder;
    refundStatus?: 'refunded' | 'failed' | 'skipped' | 'already_refunded';
  }>(`/public/${slug}/gift-cards/orders/${giftCardId}/cancel-request`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function submitPublicGiftCardModifyRequest(
  slug: string,
  giftCardId: string,
  body: {
    modifyPayload: Record<string, unknown>;
    customerNotes?: string;
  },
) {
  return publicFetch<{ request: unknown; order: PublicGiftCardOrder }>(
    `/public/${slug}/gift-cards/orders/${giftCardId}/modify-request`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function getPublicCustomerMe(slug: string) {
  return publicFetch<PublicCustomerProfile>(`/public/${slug}/auth/me`);
}

export function getPublicCustomerBookings(slug: string) {
  return publicFetch<{ bookings: PublicCustomerBookingItem[] }>(`/public/${slug}/me/bookings`);
}

export function getPublicCustomerClinicTestResults(slug: string) {
  return publicFetch<PublicCustomerReleasedClinicResult[]>(
    `/public/${slug}/me/clinic-test-results`,
  );
}

export function getPublicCustomerClinicLabBookingRequests(slug: string) {
  return publicFetch<import('./clinic-lab-booking-request.js').PublicClinicLabBookingRequest[]>(
    `/public/${slug}/me/clinic-lab-booking-requests`,
  );
}

export function getPublicCustomerClinicDocuments(slug: string) {
  return publicFetch<PublicCustomerReleasedClinicDocument[]>(
    `/public/${slug}/me/clinic-documents`,
  );
}

export function getPublicCustomerClinicPatientAlerts(slug: string) {
  return publicFetch<import('./clinic-patient-alerts.js').ClinicPatientAlertListView>(
    `/public/${slug}/me/clinic-patient-alerts`,
  );
}

export function dismissPublicCustomerClinicPatientAlert(
  slug: string,
  alertType: import('./clinic-patient-alerts.js').ClinicPatientAlertType,
  sourceId: string,
) {
  return publicFetch<{ dismissed: boolean; id: string }>(
    `/public/${slug}/me/clinic-patient-alerts/${alertType}/${sourceId}/dismiss`,
    { method: 'POST' },
  );
}

export function cancelPublicCustomerBooking(slug: string, bookingId: string) {
  return publicFetch<{ booking: { id: string; status: string } }>(
    `/public/${slug}/me/bookings/${bookingId}/cancel`,
    { method: 'POST' },
  );
}

export function cancelPublicBookingWithToken(slug: string, bookingId: string, token: string) {
  return publicFetch<{ booking: { id: string; status: string } }>(
    `/public/${slug}/bookings/manage/cancel`,
    { method: 'POST', body: JSON.stringify({ bookingId, token }) },
  );
}

export function reschedulePublicCustomerBooking(
  slug: string,
  bookingId: string,
  body: { startTime: string; employeeId?: string },
) {
  return publicFetch<{ booking: { id: string; startTime: string }; previousStartTime: string }>(
    `/public/${slug}/me/bookings/${bookingId}/reschedule`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function reschedulePublicBookingWithToken(
  slug: string,
  bookingId: string,
  token: string,
  body: { startTime: string; employeeId?: string },
) {
  return publicFetch<{ booking: { id: string; startTime: string }; previousStartTime: string }>(
    `/public/${slug}/bookings/manage/reschedule`,
    { method: 'POST', body: JSON.stringify({ bookingId, token, ...body }) },
  );
}

export interface PublicBookingManageContext {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  customerEmail: string | null;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  manageUrl: string;
  allowProviderChangeOnReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
  packageVisit?: PublicPackageVisitSummary;
}

export type PackageVisitRescheduleLine = {
  bookingId: string;
  startTime: string;
  employeeId?: string;
};

export function cancelPublicCustomerPackageVisit(slug: string, bookingId: string) {
  return publicFetch<{ bookings: Array<{ id: string; status: string }> }>(
    `/public/${slug}/me/bookings/${bookingId}/package/cancel`,
    { method: 'POST' },
  );
}

export function cancelPublicPackageVisitWithToken(slug: string, bookingId: string, token: string) {
  return publicFetch<{ bookings: Array<{ id: string; status: string }> }>(
    `/public/${slug}/bookings/manage/package/cancel`,
    { method: 'POST', body: JSON.stringify({ bookingId, token }) },
  );
}

export function reschedulePublicCustomerPackageVisit(
  slug: string,
  bookingId: string,
  lines: PackageVisitRescheduleLine[],
) {
  return publicFetch<{ bookings: Array<{ id: string; startTime: string }>; previousStartTime: string }>(
    `/public/${slug}/me/bookings/${bookingId}/package/reschedule`,
    { method: 'POST', body: JSON.stringify({ lines }) },
  );
}

export function reschedulePublicPackageVisitWithToken(
  slug: string,
  bookingId: string,
  token: string,
  lines: PackageVisitRescheduleLine[],
) {
  return publicFetch<{ bookings: Array<{ id: string; startTime: string }>; previousStartTime: string }>(
    `/public/${slug}/bookings/manage/package/reschedule`,
    { method: 'POST', body: JSON.stringify({ bookingId, token, lines }) },
  );
}

export function getPublicBookingManageContext(slug: string, bookingId: string, token: string) {
  const params = new URLSearchParams({ bookingId, token });
  return publicFetch<PublicBookingManageContext>(`/public/${slug}/bookings/manage?${params.toString()}`);
}

export function exportPublicCustomerData(slug: string) {
  return publicFetch<Record<string, unknown>>(`/public/${slug}/me/data`);
}

export function deletePublicCustomerData(slug: string) {
  return publicFetch<{ deleted: true }>(`/public/${slug}/me/data`, { method: 'DELETE' });
}
