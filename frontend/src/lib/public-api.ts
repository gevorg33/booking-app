const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  canReview: boolean;
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
  branding: PublicBranding;
  social?: PublicSocialLinks;
  location?: PublicLocation;
  publicBookingEnabled: boolean;
  defaultPhoneCountryCode?: string;
  onlinePaymentsEnabled?: boolean;
  support?: PublicSupportWidgets;
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
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

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )app-locale=([^;]+)/);
    if (match?.[1]) headers['Accept-Language'] = match[1];
  }

  const slugMatch = path.match(/^\/public\/([^/]+)/);
  const slug = slugMatch?.[1];
  const token = slug ? publicCustomerTokens.get(slug) : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatPublicApiError(body, res.status));
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export function getPublicProfile(slug: string) {
  return publicFetch<PublicBusinessProfile>(`/public/${slug}`);
}

export function getPublicProviders(slug: string, date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
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

export function getPublicServices(slug: string, employeeId?: string) {
  const q = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
  return publicFetch<{ services: PublicService[] }>(`/public/${slug}/services${q}`);
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

export function getPublicServicesForSlot(slug: string, employeeId: string, startTime: string) {
  return publicFetch<{ services: PublicService[] }>(
    `/public/${slug}/services/for-slot?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`,
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
  customer: {
    name: string;
    email?: string;
    phone?: string;
    emailReminders?: boolean;
    smsReminders?: boolean;
    whatsappReminders?: boolean;
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
  return publicFetch<{ booking: unknown; customer: { id: string; name: string; created: boolean } }>(
    `/public/${slug}/bookings`,
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
  path: 'professionals' | 'services' | 'checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResponse {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
}

export function sendPublicAssistantMessage(
  slug: string,
  body: {
    prompt: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    context?: Record<string, unknown>;
    locale?: string;
  },
) {
  return publicFetch<PublicAssistantResponse>(`/public/${slug}/assistant`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatPrice(price: number, currency: string, locale?: string): string {
  try {
    const intlLocale =
      locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : undefined;
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

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

export function loginPublicCustomer(slug: string, idToken: string) {
  return publicFetch<PublicCustomerAuthResponse>(`/public/${slug}/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export function getPublicCustomerMe(slug: string) {
  return publicFetch<PublicCustomerProfile>(`/public/${slug}/auth/me`);
}

export function getPublicCustomerBookings(slug: string) {
  return publicFetch<{ bookings: PublicCustomerBookingItem[] }>(`/public/${slug}/me/bookings`);
}

export function exportPublicCustomerData(slug: string) {
  return publicFetch<Record<string, unknown>>(`/public/${slug}/me/data`);
}

export function deletePublicCustomerData(slug: string) {
  return publicFetch<{ deleted: true }>(`/public/${slug}/me/data`, { method: 'DELETE' });
}
