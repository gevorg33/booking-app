import {
  SIGN_IN_AFTER_BOOKING_PROMPTS,
  type SignInAfterBookingAspect,
  type SignInAfterBookingFixture,
} from './ai-sign-in-after-booking.fixtures.js';
import { SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-after-booking-multilingual.fixtures.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isExplainNotificationCurrencyPrompt } from './ai-notification-currency.util.js';
import { hasSignInToManageBookingCue } from './ai-sign-in-to-manage-booking.util.js';
import { isExplainWhySignInPrompt } from './ai-explain-why-sign-in.util.js';
import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';
import { isExplainConsumerCheckoutSuccessPrompt } from './ai-consumer-checkout-success.util.js';
import { isListMyTestResultsPrompt } from './ai-consumer-clinic-test-results.util.js';

export const SIGN_IN_AFTER_BOOKING_INTENTS = ['sign_in_after_booking'] as const;

export type SignInAfterBookingIntent =
  (typeof SIGN_IN_AFTER_BOOKING_INTENTS)[number];

export { CUSTOMER_SIGN_IN_AFTER_BOOKING_CLASSIFIER_RULES } from './ai-sign-in-after-booking.fixtures.js';

const POST_BOOKING_SIGN_IN_CUE =
  /\b(save (?:this )?booking to (?:my )?account|save (?:my )?appointment on the confirmation(?: screen| page)?|sign in with google after|continue with (?:google|apple) after|post-booking sign|post booking sign|one tap sign in after|turn my guest checkout into an account|guest booking merge when i sign in|maybe later|tap maybe later|skip saving this booking|asking me to save my booking)\b/i;

const SAVE_TO_ACCOUNT_CUE =
  /\b(save (?:this )?booking|save (?:my )?appointment|asking me to save|confirmation screen)\b/i;

const PROVIDER_SIGN_IN_CUE =
  /\b(sign in with google|continue with google|continue with apple|one tap|google after|apple after)\b/i;

const MERGE_RULES_CUE =
  /\b(merge|link|same email|same phone|guest booking|guest checkout into an account)\b/i;

const SKIP_DISMISS_CUE =
  /\b(maybe later|skip saving|skip.*account|dismiss|not now)\b/i;

const HOW_IT_WORKS_CUE =
  /\b(how do i|explain|what does|what happens|turn my guest)\b/i;

function matchSignInAfterBookingScenario(
  prompt: string,
): SignInAfterBookingFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of SIGN_IN_AFTER_BOOKING_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

export function resolveSignInAfterBookingAspect(
  prompt: string,
): SignInAfterBookingAspect {
  const scenario = matchSignInAfterBookingScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (SKIP_DISMISS_CUE.test(prompt)) return 'skip_dismiss';
  if (PROVIDER_SIGN_IN_CUE.test(prompt)) return 'provider_sign_in';
  if (MERGE_RULES_CUE.test(prompt)) return 'merge_rules';
  if (SAVE_TO_ACCOUNT_CUE.test(prompt)) return 'save_to_account';
  if (HOW_IT_WORKS_CUE.test(prompt)) return 'how_it_works';
  return 'how_it_works';
}

const MANAGE_LINK_ONLY_CUE =
  /\b(manage\s+link|reschedule\s+link|cancel\s+link|self[\s-]?service\s+link|resend manage)\b/i;

function isCalendarExportPrompt(prompt: string): boolean {
  return (
    /\b(?:add|put|save|send|download|export|open|get|give)\b/i.test(prompt) &&
    /\b(?:calendar|ics|google\s+calendar|outlook|օրացույց|календар)/i.test(
      prompt,
    ) &&
    !/\b(?:account|sign[\s-]?in|log[\s-]?in)\b/i.test(prompt)
  );
}

export function isSignInAfterBookingPrompt(prompt: string): boolean {
  if (isCalendarExportPrompt(prompt)) return false;
  if (isExplainAnyProviderOptionPrompt(prompt)) return false;
  if (isExplainCheckoutRecommendationsPrompt(prompt)) return false;
  if (isExplainConsumerCheckoutSuccessPrompt(prompt)) return false;
  if (isListMyTestResultsPrompt(prompt)) return false;
  if (matchSignInAfterBookingScenario(prompt)) return true;
  if (
    MANAGE_LINK_ONLY_CUE.test(prompt) &&
    !POST_BOOKING_SIGN_IN_CUE.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(lost|resend|re-?send|didn'?t\s+get|never\s+got|send\s+me)\b/i.test(
      prompt,
    ) &&
    /\bconfirmation\b/i.test(prompt)
  ) {
    return false;
  }
  if (isExplainWhySignInPrompt(prompt)) return false;

  if (
    (containsArmenianScript(prompt) &&
      /(պահպան|հաշվ|մուտք|Google|Apple|Ավելի ուշ)/i.test(prompt) &&
      /(ամրագր|հետո|կիս)/i.test(prompt) &&
      !/օրացույց/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(сохран|аккаунт|войти|Google|Apple|позже|объедин)/i.test(prompt) &&
      /(запис|после|гостев)/i.test(prompt) &&
      !/календар/i.test(prompt))
  ) {
    return true;
  }

  if (!POST_BOOKING_SIGN_IN_CUE.test(prompt)) return false;
  if (isExplainNotificationCurrencyPrompt(prompt)) return false;
  if (hasSignInToManageBookingCue(prompt)) return false;
  if (isExplainGuestCheckoutFieldsPrompt(prompt)) return false;
  return true;
}

export function isSignInAfterBookingIntent(
  action: string,
): action is SignInAfterBookingIntent {
  return (SIGN_IN_AFTER_BOOKING_INTENTS as readonly string[]).includes(action);
}

export interface ParsedSignInAfterBooking {
  aspect: SignInAfterBookingAspect;
}

export function parseSignInAfterBookingFromPrompt(
  prompt: string,
): ParsedSignInAfterBooking | null {
  if (!isSignInAfterBookingPrompt(prompt)) return null;
  return { aspect: resolveSignInAfterBookingAspect(prompt) };
}

export function rescueSignInAfterBookingIntent(
  prompt: string,
  action: string,
): { action: SignInAfterBookingIntent; rescueReason: string } | null {
  if (isSignInAfterBookingIntent(action)) return null;
  if (!parseSignInAfterBookingFromPrompt(prompt)) return null;
  return {
    action: 'sign_in_after_booking',
    rescueReason: 'post_booking_sign_in',
  };
}

export function resolveGuestMergeHintFromParams(
  params: Record<string, unknown>,
): string | null {
  const email =
    typeof params.guestEmail === 'string'
      ? params.guestEmail.trim()
      : typeof params.email === 'string'
        ? params.email.trim()
        : '';
  const phone =
    typeof params.guestPhone === 'string'
      ? params.guestPhone.trim()
      : typeof params.phone === 'string'
        ? params.phone.trim()
        : '';
  if (email) {
    return `Sign in with the same email (${email}) and we will merge this booking automatically.`;
  }
  if (phone) {
    return `Sign in with the same phone (${phone}) and we will merge this booking automatically.`;
  }
  return null;
}

export function buildSignInAfterBookingSaveLines(): string[] {
  return [
    'After a guest checkout, the booking confirmation screen may offer to save the visit to your account.',
    'This appears when Apple or Google one-tap sign-in is available and you were not already signed in during checkout.',
    'Your appointment stays confirmed either way — saving just links it to a profile for Account, reminders, and self-service.',
  ];
}

export function buildSignInAfterBookingProviderLines(): string[] {
  return [
    'Tap Continue with Google or Continue with Apple on the confirmation screen.',
    'The native provider sheet signs you in without re-entering checkout contact fields.',
    'When the email or phone matches what you used to book, the guest visit merges into your customer account automatically.',
  ];
}

export function buildSignInAfterBookingMergeLines(
  mergeHint?: string | null,
): string[] {
  const lines = [
    'Guest bookings are matched by the email or phone collected at checkout.',
    'Sign in with the same contact on Apple/Google and the visit attaches to one customer record — no duplicate profile.',
  ];
  if (mergeHint) lines.push(mergeHint);
  return lines;
}

export function buildSignInAfterBookingSkipLines(): string[] {
  return [
    'Tap Maybe later to dismiss the save prompt — your booking confirmation and manage link still work.',
    'You can sign in later from Account or Login; use the same email or phone you booked with to merge the visit.',
    'The app remembers that you skipped for this booking on this device.',
  ];
}

export function buildSignInAfterBookingHowItWorksLines(
  signedIn?: boolean,
): string[] {
  const lines = [
    'Step 1: complete guest checkout (booking never requires sign-in on the book flow).',
    'Step 2: on the confirmation screen, optionally save to account via Google/Apple one-tap when shown.',
    'Step 3: merged visits appear under Account → My bookings for cancel, reschedule, and reminders.',
  ];
  if (signedIn) {
    lines.push(
      'You are already signed in — you will not see the post-booking save prompt for new bookings.',
    );
  }
  return lines;
}

export function assembleSignInAfterBookingSummary(
  aspect: SignInAfterBookingAspect,
  options?: {
    mergeHint?: string | null;
    signedIn?: boolean;
    bookingId?: string | null;
  },
): string {
  const lines: string[] = [];
  switch (aspect) {
    case 'save_to_account':
      lines.push(...buildSignInAfterBookingSaveLines());
      if (options?.mergeHint) lines.push(options.mergeHint);
      break;
    case 'provider_sign_in':
      lines.push(...buildSignInAfterBookingProviderLines());
      break;
    case 'merge_rules':
      lines.push(...buildSignInAfterBookingMergeLines(options?.mergeHint));
      break;
    case 'skip_dismiss':
      lines.push(...buildSignInAfterBookingSkipLines());
      break;
    case 'how_it_works':
    default:
      lines.push(...buildSignInAfterBookingHowItWorksLines(options?.signedIn));
      break;
  }

  if (aspect !== 'skip_dismiss' && aspect !== 'merge_rules') {
    lines.push(
      'Use the same email or phone at sign-in that you used when booking so the visit merges.',
    );
  }

  if (options?.bookingId && aspect !== 'skip_dismiss') {
    lines.push(`Your current booking id is ${options.bookingId}.`);
  }

  return lines.join(' ');
}

export function buildSignInAfterBookingNavigate(bookingId?: string | null) {
  return bookingId
    ? { path: 'book', query: { confirmedBookingId: bookingId } }
    : { path: 'login', query: {} };
}
