import { CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES } from './ai-give-ai-feedback.fixtures.js';
import { GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS } from './ai-give-ai-feedback-multilingual.fixtures.js';
import type {
  GiveAiFeedbackAspect,
  GiveAiFeedbackRating,
  GiveAiFeedbackReason,
} from './ai-give-ai-feedback.fixtures.js';
import { isExplainVoiceInputPrompt } from './ai-explain-voice-input.util.js';
import { isSpeakAssistantReplyPrompt } from './ai-speak-assistant-reply.util.js';
import { resolveLastAssistantReply } from './ai-speak-assistant-reply.util.js';

export { CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES };

/** Matches consumer/public `feedbackUp`. */
export const FEEDBACK_UP_LABEL = 'Helpful';

/** Matches consumer/public `feedbackDown`. */
export const FEEDBACK_DOWN_LABEL = 'Not helpful';

export const FEEDBACK_THANKS = 'Thanks — this helps improve the assistant.';

export const FEEDBACK_REASON_WRONG_ACTION = 'Wrong action';
export const FEEDBACK_REASON_WRONG_DATE = 'Wrong date';
export const FEEDBACK_REASON_WRONG_PERSON = 'Wrong person';
export const FEEDBACK_REASON_WRONG_SERVICE = 'Wrong service';
export const FEEDBACK_REASON_DID_NOT_UNDERSTAND = "Didn't understand";
export const FEEDBACK_REASON_SKIP = 'Skip';

export const ASSISTANT_FEEDBACK_REASON_OPTIONS = [
  { id: 'wrong_action', label: FEEDBACK_REASON_WRONG_ACTION },
  { id: 'wrong_date', label: FEEDBACK_REASON_WRONG_DATE },
  { id: 'wrong_person', label: FEEDBACK_REASON_WRONG_PERSON },
  { id: 'wrong_service', label: FEEDBACK_REASON_WRONG_SERVICE },
  {
    id: 'did_not_understand',
    label: FEEDBACK_REASON_DID_NOT_UNDERSTAND,
  },
] as const;

export const GIVE_AI_FEEDBACK_INTENTS = ['give_ai_feedback'] as const;

export type GiveAiFeedbackIntent = (typeof GIVE_AI_FEEDBACK_INTENTS)[number];

const POSITIVE_CUE = new RegExp(
  String.raw`\b(that\s+was\s+helpful|helpful|good\s+answer|great\s+answer|correct\s+answer|that\s+worked|thanks\s+that\s+helped)\b|օգտակար\s+եր|полезно|спасибо.{0,12}помог`,
  'iu',
);

const NEGATIVE_CUE = new RegExp(
  String.raw`\b(that\s+was\s+wrong|wrong|incorrect|not\s+helpful|bad\s+answer|mistake|that\s+is\s+wrong|answer\s+was\s+incorrect)\b|սխալ|не\s+полез|неправильн|неверно`,
  'iu',
);

const WRONG_DATE_CUE = new RegExp(
  String.raw`\bwrong\s+date|wrong\s+day|picked\s+the\s+wrong\s+date\b|սխալ\s+ամսաթիվ|неверная\s+дата|не\s+та\s+дата`,
  'iu',
);

const WRONG_SERVICE_CUE = new RegExp(
  String.raw`\bwrong\s+service|wrong\s+treatment\b|սխալ\s+ծառայություն|неверная\s+услуга|не\s+та\s+услуга`,
  'iu',
);

const WRONG_PERSON_CUE = new RegExp(
  String.raw`\bwrong\s+(?:person|stylist|provider|therapist)|picked\s+the\s+wrong\s+stylist\b|սխալ\s+անձ|неверный\s+(?:человек|мастер)|не\s+тот\s+мастер`,
  'iu',
);

const WRONG_ACTION_CUE = new RegExp(
  String.raw`\bwrong\s+action\b|սխալ\s+գործողություն|неверное\s+действие`,
  'iu',
);

const DID_NOT_UNDERSTAND_CUE = new RegExp(
  String.raw`\b(did(?:n't| not)\s+understand|didn't\s+get\s+that|misunderstood\s+me)\b|չհասկաց|не\s+понял`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
): (typeof GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function parseGiveAiFeedbackReason(
  prompt: string,
  params: Record<string, unknown> = {},
): GiveAiFeedbackReason | undefined {
  const fromParams = readString(params.feedbackReason);
  if (
    fromParams === 'wrong_action' ||
    fromParams === 'wrong_date' ||
    fromParams === 'wrong_person' ||
    fromParams === 'wrong_service' ||
    fromParams === 'did_not_understand'
  ) {
    return fromParams;
  }

  if (WRONG_DATE_CUE.test(prompt)) return 'wrong_date';
  if (WRONG_SERVICE_CUE.test(prompt)) return 'wrong_service';
  if (WRONG_PERSON_CUE.test(prompt)) return 'wrong_person';
  if (WRONG_ACTION_CUE.test(prompt)) return 'wrong_action';
  if (DID_NOT_UNDERSTAND_CUE.test(prompt)) return 'did_not_understand';
  return undefined;
}

export function parseGiveAiFeedbackRating(
  prompt: string,
  params: Record<string, unknown> = {},
  reason?: GiveAiFeedbackReason,
): GiveAiFeedbackRating | undefined {
  const fromParams = readString(params.feedbackRating);
  if (fromParams === 'up' || fromParams === 'down') return fromParams;
  if (POSITIVE_CUE.test(prompt)) return 'up';
  if (reason || NEGATIVE_CUE.test(prompt)) return 'down';
  return undefined;
}

export function isGiveAiFeedbackIntent(
  action: string,
): action is GiveAiFeedbackIntent {
  return (GIVE_AI_FEEDBACK_INTENTS as readonly string[]).includes(action);
}

export function parseGiveAiFeedbackAspect(
  prompt: string,
  params: Record<string, unknown> = {},
  reason?: GiveAiFeedbackReason,
  rating?: GiveAiFeedbackRating,
): GiveAiFeedbackAspect {
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
  if (POSITIVE_CUE.test(prompt)) return 'positive';
  if (NEGATIVE_CUE.test(prompt)) return 'negative';
  return 'generic';
}

export function isGiveAiFeedbackPrompt(prompt: string): boolean {
  if (isSpeakAssistantReplyPrompt(prompt)) return false;
  if (isExplainVoiceInputPrompt(prompt)) return false;
  if (
    /\b(wrong\s+side|text\s+alignment|chat\s+bubbles?|rtl|reading\s+direction|right\s+to\s+left|text\s+on\s+the\s+right|layout\s+looks\s+backwards)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (matchMultilingualScenario(prompt)) return true;

  const text = prompt.trim();
  if (!text) return false;

  if (/^that\s+was\s+wrong\b/i.test(text)) return true;
  if (/^wrong\s+date\s+picked\b/i.test(text)) return true;
  if (/^wrong\s+service\b/i.test(text)) return true;
  if (/^wrong\s+person\s+picked\b/i.test(text)) return true;
  if (/^wrong\s+action\b/i.test(text)) return true;
  if (/^you\s+didn't\s+understand\s+me\b/i.test(text)) return true;
  if (/^not\s+helpful\b/i.test(text)) return true;
  if (/^bad\s+answer\b/i.test(text)) return true;
  if (/^that\s+was\s+helpful\b/i.test(text)) return true;
  if (/^good\s+answer\b/i.test(text)) return true;
  if (/^you\s+picked\s+the\s+wrong\s+stylist\b/i.test(text)) return true;
  if (/\bbooking\s+answer\s+was\s+incorrect\b/i.test(text)) return true;

  return (
    POSITIVE_CUE.test(text) ||
    NEGATIVE_CUE.test(text) ||
    WRONG_DATE_CUE.test(text) ||
    WRONG_SERVICE_CUE.test(text) ||
    WRONG_PERSON_CUE.test(text) ||
    WRONG_ACTION_CUE.test(text) ||
    DID_NOT_UNDERSTAND_CUE.test(text)
  );
}

export function parseGiveAiFeedbackFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  aspect: GiveAiFeedbackAspect;
  rating?: GiveAiFeedbackRating;
  reason?: GiveAiFeedbackReason;
} | null {
  if (!isGiveAiFeedbackPrompt(prompt)) return null;
  const reason = parseGiveAiFeedbackReason(prompt, params);
  const rating = parseGiveAiFeedbackRating(prompt, params, reason);
  return {
    aspect: parseGiveAiFeedbackAspect(prompt, params, reason, rating),
    ...(rating ? { rating } : {}),
    ...(reason ? { reason } : {}),
  };
}

export function rescueGiveAiFeedbackIntent(
  prompt: string,
  action: string,
): { action: GiveAiFeedbackIntent; rescueReason: string } | null {
  if (isGiveAiFeedbackIntent(action)) return null;
  if (!isGiveAiFeedbackPrompt(prompt)) return null;
  return {
    action: 'give_ai_feedback',
    rescueReason: 'give_ai_feedback',
  };
}

export function buildGiveAiFeedbackSummary(
  rating: GiveAiFeedbackRating | undefined,
  reason?: GiveAiFeedbackReason,
  needsReasonChips = false,
): string {
  if (rating === 'up') return FEEDBACK_THANKS;
  if (reason) return FEEDBACK_THANKS;
  if (needsReasonChips) {
    return `${FEEDBACK_DOWN_LABEL} — choose a reason so we can improve the assistant.`;
  }
  return FEEDBACK_THANKS;
}

export function resolveGiveAiFeedbackClientAction(
  rating: GiveAiFeedbackRating | undefined,
  reason?: GiveAiFeedbackReason,
): 'openAssistantFeedback' | 'submitAssistantFeedback' {
  if (rating === 'up') return 'submitAssistantFeedback';
  if (rating === 'down' && reason) return 'submitAssistantFeedback';
  return 'openAssistantFeedback';
}

export function buildGiveAiFeedbackDetails(
  params: Record<string, unknown>,
  parsed: {
    aspect: GiveAiFeedbackAspect;
    rating?: GiveAiFeedbackRating;
    reason?: GiveAiFeedbackReason;
  },
): Record<string, unknown> {
  const rating = parsed.rating;
  const reason = parsed.reason;
  const needsReasonChips = rating === 'down' && !reason;
  const clientAction = resolveGiveAiFeedbackClientAction(rating, reason);
  const lastAssistantReply = resolveLastAssistantReply(params);
  const lastAction = readString(params.lastAction);

  return {
    aspect: parsed.aspect,
    ...(rating ? { feedbackRating: rating } : {}),
    ...(reason ? { feedbackReason: reason } : {}),
    feedbackUpLabel: FEEDBACK_UP_LABEL,
    feedbackDownLabel: FEEDBACK_DOWN_LABEL,
    feedbackThanks: FEEDBACK_THANKS,
    feedbackReasonSkipLabel: FEEDBACK_REASON_SKIP,
    feedbackReasonOptions: ASSISTANT_FEEDBACK_REASON_OPTIONS.map((option) => ({
      ...option,
    })),
    ...(needsReasonChips ? { showReasonChips: true } : {}),
    clientAction,
    assistantFeedback: true,
    ...(lastAssistantReply ? { lastAssistantReply } : {}),
    ...(lastAction ? { lastAction } : {}),
  };
}
