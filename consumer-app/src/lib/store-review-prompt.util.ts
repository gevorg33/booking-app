const LEGACY_PROMPTED_KEY = 'consumer_store_review_prompted';
const PROMPTED_BOOKINGS_KEY = 'consumer_review_prompted_bookings';
const COMPLETED_COUNT_KEY = 'consumer_completed_booking_count';

const IOS_STORE_URL =
  import.meta.env.VITE_IOS_APP_STORE_URL?.trim() ||
  import.meta.env.VITE_CONSUMER_IOS_APP_STORE_URL?.trim() ||
  '';
const PLAY_STORE_URL =
  import.meta.env.VITE_ANDROID_PLAY_STORE_URL?.trim() ||
  import.meta.env.VITE_CONSUMER_ANDROID_PLAY_STORE_URL?.trim() ||
  '';
const PUBLIC_WEB_ORIGIN = import.meta.env.VITE_PUBLIC_WEB_ORIGIN?.replace(/\/$/, '') || '';

export type PostBookingSatisfactionChoice = 'great' | 'unhappy' | 'dismiss';

export interface PostVisitReviewCandidate {
  id: string;
  serviceName: string;
  canReview?: boolean;
  status: string;
  endTime?: string;
}

export function getCompletedBookingCount(): number {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(COMPLETED_COUNT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function incrementCompletedBookingCount(): number {
  const next = getCompletedBookingCount() + 1;
  localStorage?.setItem(COMPLETED_COUNT_KEY, String(next));
  return next;
}

function readPromptedBookingIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  if (localStorage.getItem(LEGACY_PROMPTED_KEY)) {
    return new Set(['legacy-prompted']);
  }
  const raw = localStorage.getItem(PROMPTED_BOOKINGS_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export function markPostVisitReviewPrompted(bookingId: string): void {
  if (typeof localStorage === 'undefined') return;
  const prompted = readPromptedBookingIds();
  prompted.add(bookingId.trim());
  localStorage.removeItem(LEGACY_PROMPTED_KEY);
  localStorage.setItem(PROMPTED_BOOKINGS_KEY, JSON.stringify([...prompted]));
}

/** @deprecated use markPostVisitReviewPrompted */
export function markPostBookingSatisfactionPrompted(bookingId?: string): void {
  if (bookingId?.trim()) {
    markPostVisitReviewPrompted(bookingId);
    return;
  }
  localStorage?.setItem(LEGACY_PROMPTED_KEY, new Date().toISOString());
}

export function shouldPromptPostVisitReview(booking: PostVisitReviewCandidate): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (booking.status !== 'completed') return false;
  if (booking.canReview === false) return false;
  return !readPromptedBookingIds().has(booking.id);
}

export function resolvePostVisitReviewCandidate<T extends PostVisitReviewCandidate>(
  bookings: readonly T[],
): T | null {
  const candidates = bookings
    .filter((booking) => shouldPromptPostVisitReview(booking))
    .sort((a, b) => new Date(b.endTime ?? 0).getTime() - new Date(a.endTime ?? 0).getTime());
  return candidates[0] ?? null;
}

/** @deprecated use shouldPromptPostVisitReview / resolvePostVisitReviewCandidate */
export function shouldPromptPostBookingSatisfaction(completedBookingCount: number): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(LEGACY_PROMPTED_KEY)) return false;
  if (readPromptedBookingIds().has('legacy-prompted')) return false;
  return completedBookingCount >= 1;
}

/** @deprecated use markPostVisitReviewPrompted */
export const markStoreReviewPrompted = markPostBookingSatisfactionPrompted;

/** @deprecated use shouldPromptPostVisitReview */
export const shouldPromptStoreReview = shouldPromptPostBookingSatisfaction;

export function resolveStoreReviewUrl(platform: 'ios' | 'android' | 'web'): string | null {
  if (platform === 'ios' && IOS_STORE_URL) return IOS_STORE_URL;
  if (platform === 'android' && PLAY_STORE_URL) return PLAY_STORE_URL;
  return null;
}

export function buildDefaultSupportTicketMessage(serviceName: string): string {
  return `Customer reported an issue after booking "${serviceName}" in the mobile app.`;
}

export function buildPublicSupportUrl(
  slug: string,
  bookingId: string,
  origin = PUBLIC_WEB_ORIGIN,
): string | null {
  if (!origin?.trim()) return null;
  const url = new URL(`${origin.replace(/\/$/, '')}/book/${slug}`);
  url.searchParams.set('support', '1');
  url.searchParams.set('bookingId', bookingId);
  return url.toString();
}

export function resolvePostBookingSupportHandoff(input: {
  slug: string;
  bookingId: string;
  hasCustomerToken: boolean;
  customerEmail?: string | null;
  zendeskWidgetConfigured?: boolean;
}): 'zendesk_ticket' | 'support_web' | 'none' {
  // e2e-bug.42 — only attempt Zendesk tickets when the business actually has Zendesk.
  if (
    input.hasCustomerToken &&
    input.customerEmail?.trim() &&
    input.zendeskWidgetConfigured
  ) {
    return 'zendesk_ticket';
  }
  if (buildPublicSupportUrl(input.slug, input.bookingId)) {
    return 'support_web';
  }
  return 'none';
}

export function resetStoreReviewPromptForTests(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LEGACY_PROMPTED_KEY);
  localStorage.removeItem(PROMPTED_BOOKINGS_KEY);
  localStorage.removeItem(COMPLETED_COUNT_KEY);
}
