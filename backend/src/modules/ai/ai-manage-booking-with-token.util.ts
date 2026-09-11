import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';

export const MANAGE_BOOKING_WITH_TOKEN_INTENTS = [
  'explain_manage_booking_context',
  'cancel_booking_with_token',
  'reschedule_booking_with_token',
  'cancel_package_visit_with_token',
  'reschedule_package_visit_with_token',
] as const;

export type ManageBookingWithTokenIntent =
  (typeof MANAGE_BOOKING_WITH_TOKEN_INTENTS)[number];

export const MANAGE_BOOKING_WITH_TOKEN_CLASSIFIER_RULES = `- explain_manage_booking_context: READ — guest looks up the actual booking behind a manage link's bookingId + token (no login): service, provider, time, and whether it can still be cancelled or rescheduled given salon policy. Triggers: "what's this booking?" / "can I still cancel this?" / "tell me about this appointment" right after a manage link was shared. Requires bookingId and manageToken (from session or a pasted manage-link URL). NOT explain_manage_booking_page (generic FAQ about the manage page/invalid links, no live data), NOT confirm_my_booking_details (logged-in, no token).
- cancel_booking_with_token: MUTATE — guest cancels a single booking using the manage link's bookingId + token (no login). Triggers: "cancel it" / "cancel my booking" right after a manage link was shared, "cancel using this link https://.../manage?bookingId=...&token=...". Requires bookingId and manageToken (from session or a pasted manage-link URL). NOT cancel_my_booking (logged-in, no token), NOT cancel_package_visit_with_token (package visit).
- reschedule_booking_with_token: MUTATE — guest reschedules a single booking using the manage link's bookingId + token. Triggers: "move it to Friday 2pm" / "reschedule using this link". Requires bookingId, manageToken, and a new date/time. NOT reschedule_my_booking (logged-in, no token), NOT reschedule_package_visit_with_token (package visit).
- cancel_package_visit_with_token: MUTATE — guest cancels an entire package visit (all its service lines) using the manage link's bookingId + token. Triggers: "cancel my package visit" / "cancel the whole spa day" right after a manage link was shared. Requires bookingId and manageToken. NOT cancel_package_visit_self (logged-in), NOT cancel_booking_with_token (single service, not a package).
- reschedule_package_visit_with_token: MUTATE — guest reschedules an entire package visit (all its service lines, same-day block) to a new time using the manage link's bookingId + token. Triggers: "move my whole package visit to Monday 10am" right after a manage link was shared. Requires bookingId, manageToken, and a new date/time. NOT reschedule_package_visit_self (logged-in), NOT reschedule_booking_with_token (single service).`;

export function isManageBookingWithTokenIntent(
  action: string,
): action is ManageBookingWithTokenIntent {
  return (MANAGE_BOOKING_WITH_TOKEN_INTENTS as readonly string[]).includes(
    action,
  );
}

/**
 * e2e-bug.102 — a customer who types their bookingId/token as plain labelled
 * text (no URL to paste — copied from an email body, read aloud, etc.) must
 * be recognized the same way a pasted manage-link URL already is. Anchored to
 * the real shapes (`generateBookingManageToken` = 48-char hex; bookingId =
 * UUID) so this can't false-positive on ordinary words.
 */
const FREE_TEXT_BOOKING_ID_PATTERN =
  /\bbooking[\s_-]*id\b\s*(?:is|[:=])?\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const FREE_TEXT_MANAGE_TOKEN_PATTERN =
  /\b(?:manage[\s_-]*)?token\b\s*(?:is|[:=])?\s*([0-9a-f]{16,64})\b/i;

/** Pulls bookingId/token out of a pasted manage link (e.g. .../manage?bookingId=x&token=y)
 *  or plain labelled text ("the booking id is ... and the token is ..."). */
export function extractManageLinkCredentialsFromPrompt(prompt: string): {
  bookingId?: string;
  manageToken?: string;
} {
  const bookingId =
    prompt.match(/[?&]bookingId=([a-z0-9-]+)/i)?.[1] ??
    prompt.match(FREE_TEXT_BOOKING_ID_PATTERN)?.[1];
  const manageToken =
    prompt.match(/[?&]token=([a-z0-9-]+)/i)?.[1] ??
    prompt.match(FREE_TEXT_MANAGE_TOKEN_PATTERN)?.[1];
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

const CANCEL_VERB = /\b(cancel|skip)\b/i;
const RESCHEDULE_VERB = /\b(reschedule|move|shift)\b/i;
/** e2e-bug.103 — align with package-visit-self cues (spa day / my package). */
const PACKAGE_VISIT_CUE =
  /\bpackage\s+visit\b|\bwhole\s+(?:spa\s+)?day\b|\bpackage\s+appointment\b|\bspa\s+day\b|\bmy\s+package\b|\bpackage\s+bundle\b/i;

function isManageLinkPolicyOrExplainQuestion(prompt: string): boolean {
  return /\b(can\s+i|am\s+i|will\s+i|do\s+i|what\s+(?:are|is|happens)|explain|rules?|policy|terms?|tell\s+me\s+about|what'?s\s+this)\b/i.test(
    prompt,
  );
}

/** True when the prompt embeds a full guest manage-link bookingId+token pair. */
export function hasManageLinkCredentialsInPrompt(prompt: string): boolean {
  const { bookingId, manageToken } =
    extractManageLinkCredentialsFromPrompt(prompt);
  return Boolean(bookingId && manageToken);
}

/** True when session already carries manage-link credentials (e2e-bug.106 page context). */
export function hasManageLinkCredentialsInSession(
  session?: Record<string, unknown> | null,
): boolean {
  if (!session) return false;
  const bookingId =
    typeof session.bookingId === 'string' ? session.bookingId.trim() : '';
  const manageToken =
    typeof session.manageToken === 'string' ? session.manageToken.trim() : '';
  return Boolean(bookingId && manageToken);
}

export function hasManageLinkCredentials(
  prompt: string,
  session?: Record<string, unknown> | null,
): boolean {
  return (
    hasManageLinkCredentialsInPrompt(prompt) ||
    hasManageLinkCredentialsInSession(session)
  );
}

/**
 * e2e-bug.134 — guest pasted a manage link + cancel/reschedule must NOT fall
 * through to session-only my_appointments / cancel_my_booking.
 * e2e-bug.106 — same when bookingId+manageToken are already in page/session context
 * (manage URL query), even if the customer did not paste the link into chat.
 */
export function rescueManageBookingWithTokenIntent(
  prompt: string,
  action: string,
  session?: Record<string, unknown> | null,
): { action: ManageBookingWithTokenIntent; rescueReason: string } | null {
  if (!hasManageLinkCredentials(prompt, session)) return null;

  const packageCue = PACKAGE_VISIT_CUE.test(prompt);
  const wantsCancel = CANCEL_VERB.test(prompt);
  const wantsReschedule = RESCHEDULE_VERB.test(prompt);
  const explainOrPolicy = isManageLinkPolicyOrExplainQuestion(prompt);

  if (packageCue && wantsCancel && !explainOrPolicy) {
    if (action === 'cancel_package_visit_with_token') return null;
    return {
      action: 'cancel_package_visit_with_token',
      rescueReason: 'cancel_package_visit_with_token',
    };
  }
  if (packageCue && wantsReschedule && !explainOrPolicy) {
    if (action === 'reschedule_package_visit_with_token') return null;
    return {
      action: 'reschedule_package_visit_with_token',
      rescueReason: 'reschedule_package_visit_with_token',
    };
  }
  if (wantsCancel && !explainOrPolicy) {
    if (action === 'cancel_booking_with_token') return null;
    return {
      action: 'cancel_booking_with_token',
      rescueReason: 'cancel_booking_with_token',
    };
  }
  if (wantsReschedule && !explainOrPolicy) {
    if (action === 'reschedule_booking_with_token') return null;
    return {
      action: 'reschedule_booking_with_token',
      rescueReason: 'reschedule_booking_with_token',
    };
  }
  if (
    explainOrPolicy ||
    /\b(this\s+booking|this\s+appointment)\b/i.test(prompt)
  ) {
    if (action === 'explain_manage_booking_context') return null;
    return {
      action: 'explain_manage_booking_context',
      rescueReason: 'explain_manage_booking_context',
    };
  }
  return null;
}

/** Public-surface copy of classifier rules (same intents; schema import clarity). */
export const PUBLIC_MANAGE_BOOKING_WITH_TOKEN_CLASSIFIER_RULES =
  MANAGE_BOOKING_WITH_TOKEN_CLASSIFIER_RULES;
