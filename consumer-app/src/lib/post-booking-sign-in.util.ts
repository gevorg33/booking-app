import type { GuestCheckoutContact } from './guest-booking.util.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';

/** Routes where first booking must never require sign-in (n99-3.2). */
export const ACTIVATION_PATHS_WITHOUT_SIGN_IN = [
  '/s/:slug/book/:serviceId',
  '/s/:slug/manage',
] as const;

export type PostBookingSignInDecision = 'completed' | 'skipped';

const PROMPT_SHOWN_PREFIX = 'consumer_post_booking_sign_in_shown_';
const PROMPT_DECISION_PREFIX = 'consumer_post_booking_sign_in_decision_';

export function shouldPromptPostBookingSignIn(input: {
  wasGuestAtBooking: boolean;
  hasExistingSession: boolean;
  hasOneTapProvider: boolean;
  dismissed?: boolean;
  signInPlacement?: 'post_booking' | 'pre_confirm';
}): boolean {
  if (input.signInPlacement === 'pre_confirm') return false;
  if (!input.wasGuestAtBooking) return false;
  if (input.hasExistingSession) return false;
  if (!input.hasOneTapProvider) return false;
  if (input.dismissed) return false;
  return true;
}

export function bookingCompletedAsGuest(hasSessionToken: boolean): boolean {
  return !hasSessionToken;
}

export function bookingActivationNeverRequiresSignIn(pathname: string): boolean {
  const normalized = pathname.split('?')[0]?.trim() ?? '';
  if (/^\/s\/[^/]+\/book\/[^/]+$/.test(normalized)) return true;
  if (/^\/s\/[^/]+\/manage$/.test(normalized)) return true;
  return false;
}

export function resolveGuestAccountMergeHint(contact: GuestCheckoutContact): string {
  const email = contact.email.trim();
  const phone = contact.phone.trim();
  if (email) {
    return `Sign in with the same email (${email}) and we will merge this booking automatically.`;
  }
  if (phone) {
    return `Sign in with the same phone (${phone}) and we will merge this booking automatically.`;
  }
  return 'Sign in with the same email or phone you used to book and we will merge this booking automatically.';
}

export function buildPostBookingSignInCopy(locale?: string | null): {
  title: string;
  body: string;
  google: string;
  apple: string;
  skip: string;
  busy: string;
} {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  return {
    title: copy.postBookingSignInTitle,
    body: copy.postBookingSignInBody,
    google: copy.postBookingSignInGoogle,
    apple: copy.postBookingSignInApple,
    skip: copy.postBookingSignInSkip,
    busy: copy.postBookingSignInBusy,
  };
}

export function postBookingSignInStorageKey(bookingId: string, kind: 'shown' | 'decision'): string {
  const prefix = kind === 'shown' ? PROMPT_SHOWN_PREFIX : PROMPT_DECISION_PREFIX;
  return `${prefix}${bookingId.trim()}`;
}

export function markPostBookingSignInPromptShown(bookingId: string): void {
  if (typeof localStorage === 'undefined' || !bookingId.trim()) return;
  localStorage.setItem(postBookingSignInStorageKey(bookingId, 'shown'), '1');
}

export function hasShownPostBookingSignInPrompt(bookingId: string): boolean {
  if (typeof localStorage === 'undefined' || !bookingId.trim()) return false;
  return localStorage.getItem(postBookingSignInStorageKey(bookingId, 'shown')) === '1';
}

export function recordPostBookingSignInDecision(
  bookingId: string,
  decision: PostBookingSignInDecision,
): void {
  if (typeof localStorage === 'undefined' || !bookingId.trim()) return;
  localStorage.setItem(postBookingSignInStorageKey(bookingId, 'decision'), decision);
  markPostBookingSignInPromptShown(bookingId);
}

export function readPostBookingSignInDecision(bookingId: string): PostBookingSignInDecision | null {
  if (typeof localStorage === 'undefined' || !bookingId.trim()) return null;
  const raw = localStorage.getItem(postBookingSignInStorageKey(bookingId, 'decision'));
  if (raw === 'completed' || raw === 'skipped') return raw;
  return null;
}

export function resolvePostBookingSignInAnalyticsProps(input: {
  bookingId: string;
  provider?: 'google' | 'apple';
  decision?: PostBookingSignInDecision;
}) {
  return {
    bookingId: input.bookingId,
    ...(input.provider ? { onboardingStep: input.provider } : {}),
    ...(input.decision ? { firstRunRedirect: input.decision } : {}),
  };
}
