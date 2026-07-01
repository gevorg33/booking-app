import type { CommandResult } from './command-completion.types.js';
import {
  buildSignInToManageBookingNavigate,
  buildSignInToManageBookingSummary,
  enrichSignInToManageBookingParamsFromPrompt,
  isSignInToManageBookingPrompt,
  parseSignInToManageBookingFromPrompt,
} from './ai-sign-in-to-manage-booking.util.js';

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

export async function handleSignInToManageBookingLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichSignInToManageBookingParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isSignInToManageBookingPrompt(textPrompt)) {
    return failure(
      'sign_in_to_manage_booking',
      'Ask about signing in to manage a booking from the manage page or an invalid manage link.',
      { clarify: true },
    );
  }

  const parsed = parseSignInToManageBookingFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'sign_in_to_manage_booking',
      'Ask why the manage page wants you to sign in or how to manage after an invalid link.',
      { clarify: true },
    );
  }

  const signedIn = Boolean(resolveSessionCustomerId(enriched));
  const summary = buildSignInToManageBookingSummary({
    aspect: parsed.aspect,
    signedIn,
  });
  const navigate = buildSignInToManageBookingNavigate(
    parsed.aspect,
    signedIn,
    enriched,
  );

  return success('sign_in_to_manage_booking', summary, {
    aspect: parsed.aspect,
    signedIn,
    ...(navigate ? { navigate } : {}),
  });
}
