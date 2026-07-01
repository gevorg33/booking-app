import type { CommandResult } from './command-completion.types.js';
import {
  buildGiveAiFeedbackDetails,
  buildGiveAiFeedbackSummary,
  parseGiveAiFeedbackFromPrompt,
  resolveGiveAiFeedbackClientAction,
} from './ai-give-ai-feedback.util.js';

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
  const parsed = parseGiveAiFeedbackFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'give_ai_feedback',
      'Say whether the last answer was helpful or what was wrong (e.g. "That was wrong" or "Wrong date picked").',
      { clarify: true },
    );
  }

  if (!parsed.rating) {
    return failure(
      'give_ai_feedback',
      'Say if the answer was helpful or not (e.g. "That was helpful" or "Not helpful").',
      { clarify: true, aspect: parsed.aspect },
    );
  }

  const needsReasonChips = parsed.rating === 'down' && !parsed.reason;
  const clientAction = resolveGiveAiFeedbackClientAction(
    parsed.rating,
    parsed.reason,
  );
  const details = buildGiveAiFeedbackDetails(params, parsed);
  const sessionContext =
    clientAction === 'submitAssistantFeedback'
      ? { assistantFeedbackSubmitted: 'true' }
      : undefined;

  return success(
    'give_ai_feedback',
    buildGiveAiFeedbackSummary(parsed.rating, parsed.reason, needsReasonChips),
    details,
    sessionContext,
  );
}
