import type { CommandResult } from './command-completion.types.js';
import {
  assembleAnalyticsConsentSummary,
  parseExplainAnalyticsConsentFromPrompt,
  resolveConsumerAnalyticsConsentExplainContext,
  shouldDeclineConsumerAnalyticsConsent,
} from './ai-explain-analytics-consent.util.js';

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

export async function handleExplainAnalyticsConsentLogic(
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainAnalyticsConsentFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_analytics_consent',
      'Ask about analytics consent (e.g. "Why are you asking about analytics?" or "Turn off usage tracking").',
      { clarify: true },
    );
  }

  const ctx = resolveConsumerAnalyticsConsentExplainContext(params);
  const summary = assembleAnalyticsConsentSummary(parsed.aspect, ctx);
  const declineTracking = shouldDeclineConsumerAnalyticsConsent(
    parsed.aspect,
    ctx,
  );

  return success('explain_analytics_consent', summary, {
    aspect: parsed.aspect,
    consentState: ctx.consentState,
    consentPending: ctx.consentPending,
    trackingEnabled: ctx.trackingEnabled,
    consumerAnalyticsConsent: true,
    ...(declineTracking
      ? { clientAction: 'declineConsumerAnalyticsConsent' }
      : {}),
  });
}
