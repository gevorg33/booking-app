import type { CommandResult } from './command-completion.types.js';
import {
  buildGiveAiFeedbackDetails,
  buildGiveAiFeedbackSummary,
  parseGiveAiFeedbackFromPrompt,
  resolveGiveAiFeedbackClientAction,
  resolveGiveAiFeedbackLocale,
} from './ai-give-ai-feedback.util.js';
import { t } from '../../common/i18n/messages.js';

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

export async function handleGiveAiFeedbackLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const locale = resolveGiveAiFeedbackLocale(params);
  const parsed = parseGiveAiFeedbackFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'give_ai_feedback',
      t(locale, 'assistant.feedbackClarifyWhatWasWrong'),
      { clarify: true },
    );
  }

  if (!parsed.rating) {
    return failure(
      'give_ai_feedback',
      t(locale, 'assistant.feedbackClarifyHelpfulOrNot'),
      { clarify: true, aspect: parsed.aspect },
    );
  }

  const needsReasonChips = parsed.rating === 'down' && !parsed.reason;
  const clientAction = resolveGiveAiFeedbackClientAction(
    parsed.rating,
    parsed.reason,
  );
  const details = buildGiveAiFeedbackDetails(params, parsed, locale);
  const sessionContext =
    clientAction === 'submitAssistantFeedback'
      ? { assistantFeedbackSubmitted: 'true' }
      : undefined;

  return success(
    'give_ai_feedback',
    buildGiveAiFeedbackSummary(
      parsed.rating,
      parsed.reason,
      needsReasonChips,
      locale,
    ),
    details,
    sessionContext,
  );
}
