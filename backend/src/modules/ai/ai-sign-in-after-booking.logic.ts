import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  assembleSignInAfterBookingSummary,
  buildSignInAfterBookingNavigate,
  parseSignInAfterBookingFromPrompt,
  resolveGuestMergeHintFromParams,
} from './ai-sign-in-after-booking.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function resolveSessionBookingId(
  params: Record<string, unknown>,
): string | null {
  const raw = params.sessionBookingId ?? params.bookingId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export async function handleSignInAfterBookingLogic(
  _deps: SelfServiceBookingLogicDeps,
  _businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseSignInAfterBookingFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'sign_in_after_booking',
      'Ask about saving a guest booking to your account (e.g. "Save this booking to my account").',
      { clarify: true },
    );
  }

  const signedIn = Boolean(resolveSessionCustomerId(params));
  const bookingId = resolveSessionBookingId(params);
  const mergeHint = resolveGuestMergeHintFromParams(params);
  const summary = assembleSignInAfterBookingSummary(parsed.aspect, {
    mergeHint,
    signedIn,
    bookingId,
  });

  return success('sign_in_after_booking', summary, {
    aspect: parsed.aspect,
    signedIn,
    bookingId,
    navigate: buildSignInAfterBookingNavigate(bookingId),
  });
}
