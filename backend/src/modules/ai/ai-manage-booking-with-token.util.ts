import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';

export const MANAGE_BOOKING_WITH_TOKEN_INTENTS = [
  'cancel_booking_with_token',
  'reschedule_booking_with_token',
  'cancel_package_visit_with_token',
  'reschedule_package_visit_with_token',
] as const;

export type ManageBookingWithTokenIntent =
  (typeof MANAGE_BOOKING_WITH_TOKEN_INTENTS)[number];

export const MANAGE_BOOKING_WITH_TOKEN_CLASSIFIER_RULES = `- cancel_booking_with_token: MUTATE — guest cancels a single booking using the manage link's bookingId + token (no login). Triggers: "cancel it" / "cancel my booking" right after a manage link was shared, "cancel using this link https://.../manage?bookingId=...&token=...". Requires bookingId and manageToken (from session or a pasted manage-link URL). NOT cancel_my_booking (logged-in, no token), NOT cancel_package_visit_with_token (package visit).
- reschedule_booking_with_token: MUTATE — guest reschedules a single booking using the manage link's bookingId + token. Triggers: "move it to Friday 2pm" / "reschedule using this link". Requires bookingId, manageToken, and a new date/time. NOT reschedule_my_booking (logged-in, no token), NOT reschedule_package_visit_with_token (package visit).
- cancel_package_visit_with_token: MUTATE — guest cancels an entire package visit (all its service lines) using the manage link's bookingId + token. Triggers: "cancel my package visit" / "cancel the whole spa day" right after a manage link was shared. Requires bookingId and manageToken. NOT cancel_package_visit_self (logged-in), NOT cancel_booking_with_token (single service, not a package).
- reschedule_package_visit_with_token: MUTATE — guest reschedules an entire package visit (all its service lines, same-day block) to a new time using the manage link's bookingId + token. Triggers: "move my whole package visit to Monday 10am" right after a manage link was shared. Requires bookingId, manageToken, and a new date/time. NOT reschedule_package_visit_self (logged-in), NOT reschedule_booking_with_token (single service).`;

export function isManageBookingWithTokenIntent(
  action: string,
): action is ManageBookingWithTokenIntent {
  return (
    MANAGE_BOOKING_WITH_TOKEN_INTENTS as readonly string[]
  ).includes(action);
}

/** Pulls bookingId/token out of a pasted manage link (e.g. .../manage?bookingId=x&token=y). */
export function extractManageLinkCredentialsFromPrompt(prompt: string): {
  bookingId?: string;
  manageToken?: string;
} {
  const bookingId = prompt.match(/[?&]bookingId=([a-z0-9-]+)/i)?.[1];
  const manageToken = prompt.match(/[?&]token=([a-z0-9-]+)/i)?.[1];
  return {
    ...(bookingId ? { bookingId } : {}),
    ...(manageToken ? { manageToken } : {}),
  };
}

export function resolveManageBookingCredentials(
  params: Record<string, unknown>,
  prompt: string,
): { bookingId?: string; manageToken?: string } {
  const fromLink = extractManageLinkCredentialsFromPrompt(prompt);
  const bookingId =
    (params.bookingId as string | undefined) ?? fromLink.bookingId;
  const manageToken =
    (params.manageToken as string | undefined) ?? fromLink.manageToken;
  return {
    ...(bookingId ? { bookingId } : {}),
    ...(manageToken ? { manageToken } : {}),
  };
}

export function enrichRescheduleWithTokenParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const next = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );
  return { ...next, ...resolveManageBookingCredentials(next, prompt) };
}
