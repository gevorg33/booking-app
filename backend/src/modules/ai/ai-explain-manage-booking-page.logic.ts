import type { CommandResult } from './command-completion.types.js';
import {
  buildExplainManageBookingPageNavigate,
  buildExplainManageBookingPageSummary,
  enrichExplainManageBookingPageParamsFromPrompt,
  isExplainManageBookingPagePrompt,
  parseExplainManageBookingPageFromPrompt,
} from './ai-explain-manage-booking-page.util.js';

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

export async function handleExplainManageBookingPageLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainManageBookingPageParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainManageBookingPagePrompt(textPrompt)) {
    return failure(
      'explain_manage_booking_page',
      'Ask what you can do on the manage booking page or why a manage link is invalid.',
      { clarify: true },
    );
  }

  const parsed = parseExplainManageBookingPageFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'explain_manage_booking_page',
      'Ask about the manage booking page, guest manage link, or invalid manage link.',
      { clarify: true },
    );
  }

  const signedIn = Boolean(resolveSessionCustomerId(enriched));
  const summary = buildExplainManageBookingPageSummary({
    aspect: parsed.aspect,
    signedIn,
  });
  const navigate = buildExplainManageBookingPageNavigate(
    parsed.aspect,
    enriched,
  );

  return success('explain_manage_booking_page', summary, {
    aspect: parsed.aspect,
    signedIn,
    ...(navigate ? { navigate } : {}),
  });
}
