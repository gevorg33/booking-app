import type { CommandResult } from './command-completion.types.js';
import {
  buildDismissRecommendationsSummary,
  parseDismissRecommendationsFromPrompt,
} from './ai-dismiss-recommendations.util.js';

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
  sessionContext?: Record<string, string>,
): CommandResult {
  return {
    success: true,
    action,
    summary,
    details: details ?? {},
    ...(sessionContext ? { sessionContext } : {}),
  };
}

export async function handleDismissRecommendationsLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = String(prompt || params._prompt || '');
  const parsed = parseDismissRecommendationsFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'dismiss_recommendations',
      'Say something like "Hide You might also like" or "Dismiss recommendations" on your booking success screen.',
      { clarify: true },
    );
  }

  const bookingId =
    parsed.bookingId ??
    (typeof params.bookingId === 'string'
      ? params.bookingId.trim()
      : undefined);
  const serviceId =
    parsed.serviceId ??
    (typeof params.serviceId === 'string'
      ? params.serviceId.trim()
      : undefined);

  const sessionContext: Record<string, string> = {
    checkoutRecommendationsDismissed: 'true',
  };
  if (bookingId) sessionContext.bookingId = bookingId;
  if (serviceId) sessionContext.serviceId = serviceId;

  return success(
    'dismiss_recommendations',
    buildDismissRecommendationsSummary(),
    {
      clientAction: 'dismissConsumerCheckoutRecommendations',
      recommendationsDismissed: true,
      bookingId: bookingId ?? null,
      serviceId: serviceId ?? null,
    },
    sessionContext,
  );
}
