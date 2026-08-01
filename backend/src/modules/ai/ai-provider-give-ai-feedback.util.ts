/** ai-cmd-provider-5.24.3 — provider mirror of the customer `give_ai_feedback` action (ai-give-ai-feedback.util.ts). */

export type ProviderGiveAiFeedbackAspect =
  | 'negative'
  | 'positive'
  | 'reason_given'
  | 'generic';

export type ProviderGiveAiFeedbackRating = 'up' | 'down';

export type ProviderGiveAiFeedbackReason =
  | 'wrong_action'
  | 'wrong_date'
  | 'wrong_client'
  | 'wrong_service'
  | 'did_not_understand';

export const PROVIDER_FEEDBACK_UP_LABEL = 'Helpful';
export const PROVIDER_FEEDBACK_DOWN_LABEL = 'Not helpful';
export const PROVIDER_FEEDBACK_THANKS =
  'Thanks — this helps improve the provider assistant.';

export const PROVIDER_FEEDBACK_REASON_WRONG_ACTION = 'Wrong action';
export const PROVIDER_FEEDBACK_REASON_WRONG_DATE = 'Wrong date';
export const PROVIDER_FEEDBACK_REASON_WRONG_CLIENT = 'Wrong client';
export const PROVIDER_FEEDBACK_REASON_WRONG_SERVICE = 'Wrong service';
export const PROVIDER_FEEDBACK_REASON_DID_NOT_UNDERSTAND = "Didn't understand";

export const PROVIDER_ASSISTANT_FEEDBACK_REASON_OPTIONS = [
  { id: 'wrong_action', label: PROVIDER_FEEDBACK_REASON_WRONG_ACTION },
  { id: 'wrong_date', label: PROVIDER_FEEDBACK_REASON_WRONG_DATE },
  { id: 'wrong_client', label: PROVIDER_FEEDBACK_REASON_WRONG_CLIENT },
  { id: 'wrong_service', label: PROVIDER_FEEDBACK_REASON_WRONG_SERVICE },
  {
    id: 'did_not_understand',
    label: PROVIDER_FEEDBACK_REASON_DID_NOT_UNDERSTAND,
  },
] as const;

// e2e-bug.293 — UI chip labels "Thumbs up" / "Thumbs down" (+ emoji).
const POSITIVE_CUE =
  /\b(that\s+was\s+helpful|(?<!\bnot\s)helpful|good\s+answer|great\s+answer|correct\s+answer|that\s+worked|thanks\s+that\s+helped|thumbs?\s*-?\s*up)\b|👍/iu;

const NEGATIVE_CUE =
  /\b(that\s+was\s+wrong|wrong|incorrect|not\s+helpful|bad\s+answer|mistake|that\s+is\s+wrong|answer\s+was\s+incorrect|not\s+what\s+i\s+(?:meant|wanted)|(?:was\s+)?not\s+my\s+intent|wasn'?t\s+my\s+intent|thumbs?\s*-?\s*down)\b|👎/iu;

/** e2e-bug.300 — shorthand vote; whole-prompt only (mirror customer/public). */
const PLUS_ONE_FEEDBACK_PROMPT =
  /^(?:\+1|\+\s*1|plus\s*(?:one|1))\s*[!.]?$/iu;
const MINUS_ONE_FEEDBACK_PROMPT =
  /^(?:-1|-\s*1|minus\s*(?:one|1))\s*[!.]?$/iu;

const WRONG_DATE_CUE = /\bwrong\s+date|wrong\s+day|picked\s+the\s+wrong\s+date\b/i;

const WRONG_SERVICE_CUE = /\bwrong\s+service|wrong\s+treatment\b/i;

const WRONG_CLIENT_CUE =
  /\bwrong\s+client|picked\s+the\s+wrong\s+client|that'?s\s+not\s+my\s+client\b/i;

const WRONG_ACTION_CUE = /\bwrong\s+action\b/i;

const DID_NOT_UNDERSTAND_CUE =
  /\b(did(?:n't| not)\s+understand|didn't\s+get\s+that|misunderstood\s+me|wasn'?t\s+my\s+intent|was\s+not\s+my\s+intent|not\s+my\s+intent|not\s+what\s+i\s+meant)\b/i;

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function parseGiveProviderAiFeedbackReason(
  prompt: string,
  params: Record<string, unknown> = {},
): ProviderGiveAiFeedbackReason | undefined {
  const fromParams = readString(params.feedbackReason);
  if (
    fromParams === 'wrong_action' ||
    fromParams === 'wrong_date' ||
    fromParams === 'wrong_client' ||
    fromParams === 'wrong_service' ||
    fromParams === 'did_not_understand'
  ) {
    return fromParams;
  }

  if (WRONG_DATE_CUE.test(prompt)) return 'wrong_date';
  if (WRONG_SERVICE_CUE.test(prompt)) return 'wrong_service';
  if (WRONG_CLIENT_CUE.test(prompt)) return 'wrong_client';
  if (WRONG_ACTION_CUE.test(prompt)) return 'wrong_action';
  if (DID_NOT_UNDERSTAND_CUE.test(prompt)) return 'did_not_understand';
  return undefined;
}

export function parseGiveProviderAiFeedbackRating(
  prompt: string,
  params: Record<string, unknown> = {},
  reason?: ProviderGiveAiFeedbackReason,
): ProviderGiveAiFeedbackRating | undefined {
  const fromParams = readString(params.feedbackRating);
  if (fromParams === 'up' || fromParams === 'down') return fromParams;
  // Negatives first — bare "helpful" must not steal "Not helpful" (e2e-bug.243)
  // e2e-bug.300 — anchored -1 / +1.
  if (
    reason ||
    MINUS_ONE_FEEDBACK_PROMPT.test(prompt.trim()) ||
    NEGATIVE_CUE.test(prompt) ||
    /\bnot\s+helpful\b/i.test(prompt)
  ) {
    return 'down';
  }
  if (PLUS_ONE_FEEDBACK_PROMPT.test(prompt.trim()) || POSITIVE_CUE.test(prompt)) {
    return 'up';
  }
  return undefined;
}

export function parseGiveProviderAiFeedbackAspect(
  prompt: string,
  params: Record<string, unknown> = {},
  reason?: ProviderGiveAiFeedbackReason,
  rating?: ProviderGiveAiFeedbackRating,
): ProviderGiveAiFeedbackAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'negative' ||
    fromParams === 'positive' ||
    fromParams === 'reason_given' ||
    fromParams === 'generic'
  ) {
    return fromParams;
  }
  if (reason) return 'reason_given';
  if (rating === 'up') return 'positive';
  if (rating === 'down') return 'negative';
  if (
    MINUS_ONE_FEEDBACK_PROMPT.test(prompt.trim()) ||
    NEGATIVE_CUE.test(prompt) ||
    /\bnot\s+helpful\b/i.test(prompt)
  ) {
    return 'negative';
  }
  if (PLUS_ONE_FEEDBACK_PROMPT.test(prompt.trim()) || POSITIVE_CUE.test(prompt)) {
    return 'positive';
  }
  return 'generic';
}

export function isGiveProviderAiFeedbackPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (/\b(mark|set|update|block|cancel|reschedule|check\s+in)\b/i.test(text)) {
    return false;
  }

  if (/^that\s+was\s+wrong\b/i.test(text)) return true;
  if (/^wrong\s+client\s+picked\b/i.test(text)) return true;
  if (/^wrong\s+date\s+picked\b/i.test(text)) return true;
  if (/^wrong\s+service\b/i.test(text)) return true;
  if (/^wrong\s+action\b/i.test(text)) return true;
  if (/^that\s+wasn'?t\s+my\s+intent\b/i.test(text)) return true;
  if (/^that\s+was\s+not\s+my\s+intent\b/i.test(text)) return true;
  if (/^not\s+my\s+intent\b/i.test(text)) return true;
  if (/^not\s+helpful\b/i.test(text)) return true;
  if (/^bad\s+answer\b/i.test(text)) return true;
  if (/^that\s+was\s+helpful\b/i.test(text)) return true;
  if (/^good\s+answer\b/i.test(text)) return true;
  // e2e-bug.300 — shorthand +1 / -1 (whole prompt only).
  if (PLUS_ONE_FEEDBACK_PROMPT.test(text) || MINUS_ONE_FEEDBACK_PROMPT.test(text)) {
    return true;
  }

  return (
    POSITIVE_CUE.test(text) ||
    NEGATIVE_CUE.test(text) ||
    WRONG_DATE_CUE.test(text) ||
    WRONG_SERVICE_CUE.test(text) ||
    WRONG_CLIENT_CUE.test(text) ||
    WRONG_ACTION_CUE.test(text) ||
    DID_NOT_UNDERSTAND_CUE.test(text)
  );
}

export function parseGiveProviderAiFeedbackFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  aspect: ProviderGiveAiFeedbackAspect;
  rating?: ProviderGiveAiFeedbackRating;
  reason?: ProviderGiveAiFeedbackReason;
} | null {
  if (!isGiveProviderAiFeedbackPrompt(prompt)) return null;
  const reason = parseGiveProviderAiFeedbackReason(prompt, params);
  const rating = parseGiveProviderAiFeedbackRating(prompt, params, reason);
  return {
    aspect: parseGiveProviderAiFeedbackAspect(prompt, params, reason, rating),
    ...(rating ? { rating } : {}),
    ...(reason ? { reason } : {}),
  };
}

export function rescueGiveProviderAiFeedbackIntent(
  prompt: string,
  action: string,
): {
  action: 'give_provider_ai_feedback';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (action === 'give_provider_ai_feedback') return null;
  const parsed = parseGiveProviderAiFeedbackFromPrompt(prompt);
  if (!parsed) return null;
  return {
    action: 'give_provider_ai_feedback',
    rescueReason: 'give_provider_ai_feedback',
    params: {
      ...(parsed.rating ? { feedbackRating: parsed.rating } : {}),
      ...(parsed.reason ? { feedbackReason: parsed.reason } : {}),
      aspect: parsed.aspect,
    },
  };
}

export function buildGiveProviderAiFeedbackSummary(
  rating: ProviderGiveAiFeedbackRating | undefined,
  reason?: ProviderGiveAiFeedbackReason,
  needsReasonChips = false,
): string {
  if (rating === 'up') return PROVIDER_FEEDBACK_THANKS;
  if (reason) return PROVIDER_FEEDBACK_THANKS;
  if (needsReasonChips) {
    return `${PROVIDER_FEEDBACK_DOWN_LABEL} — choose a reason so we can improve the assistant.`;
  }
  return PROVIDER_FEEDBACK_THANKS;
}

export function resolveGiveProviderAiFeedbackClientAction(
  rating: ProviderGiveAiFeedbackRating | undefined,
  reason?: ProviderGiveAiFeedbackReason,
): 'openAssistantFeedback' | 'submitAssistantFeedback' {
  if (rating === 'up') return 'submitAssistantFeedback';
  if (rating === 'down' && reason) return 'submitAssistantFeedback';
  return 'openAssistantFeedback';
}

export function buildGiveProviderAiFeedbackDetails(
  params: Record<string, unknown>,
  parsed: {
    aspect: ProviderGiveAiFeedbackAspect;
    rating?: ProviderGiveAiFeedbackRating;
    reason?: ProviderGiveAiFeedbackReason;
  },
): Record<string, unknown> {
  const rating = parsed.rating;
  const reason = parsed.reason;
  const needsReasonChips = rating === 'down' && !reason;
  const clientAction = resolveGiveProviderAiFeedbackClientAction(
    rating,
    reason,
  );
  const lastAction = readString(params.lastAction);

  return {
    aspect: parsed.aspect,
    ...(rating ? { feedbackRating: rating } : {}),
    ...(reason ? { feedbackReason: reason } : {}),
    feedbackUpLabel: PROVIDER_FEEDBACK_UP_LABEL,
    feedbackDownLabel: PROVIDER_FEEDBACK_DOWN_LABEL,
    feedbackThanks: PROVIDER_FEEDBACK_THANKS,
    feedbackReasonOptions: PROVIDER_ASSISTANT_FEEDBACK_REASON_OPTIONS.map(
      (option) => ({ ...option }),
    ),
    ...(needsReasonChips ? { showReasonChips: true } : {}),
    clientAction,
    assistantFeedback: true,
    ...(lastAction ? { lastAction } : {}),
  };
}

export function handleGiveProviderAiFeedback(
  params: Record<string, unknown> = {},
  prompt?: string,
): {
  success: boolean;
  action: 'give_provider_ai_feedback';
  summary: string;
  details: Record<string, unknown>;
} {
  const parsed = parseGiveProviderAiFeedbackFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return {
      success: false,
      action: 'give_provider_ai_feedback',
      summary:
        'Say whether the last answer was helpful or what was wrong (e.g. "Wrong client picked" or "That wasn\'t my intent").',
      details: { clarify: true },
    };
  }

  if (!parsed.rating) {
    return {
      success: false,
      action: 'give_provider_ai_feedback',
      summary: 'Say if the answer was helpful or not (e.g. "That was helpful" or "Not helpful").',
      details: { clarify: true, aspect: parsed.aspect },
    };
  }

  const needsReasonChips = parsed.rating === 'down' && !parsed.reason;
  const details = buildGiveProviderAiFeedbackDetails(params, parsed);

  return {
    success: true,
    action: 'give_provider_ai_feedback',
    summary: buildGiveProviderAiFeedbackSummary(
      parsed.rating,
      parsed.reason,
      needsReasonChips,
    ),
    details,
  };
}
