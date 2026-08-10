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
import { resolveLocale, t } from '../../common/i18n/messages.js';
import type { AppLocale } from '../../common/i18n/messages.js';

export { CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES };

/** Matches consumer/public `feedbackUp` (EN default; prefer localized helpers). */
export const FEEDBACK_UP_LABEL = 'Helpful';

/** Matches consumer/public `feedbackDown` (EN default; prefer localized helpers). */
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

/** e2e-bug.299 — localized chip/summary copy for give_ai_feedback. */
export function resolveGiveAiFeedbackLocale(
  localeOrParams?: string | Record<string, unknown>,
): AppLocale {
  if (typeof localeOrParams === 'string') {
    return resolveLocale(localeOrParams);
  }
  if (localeOrParams && typeof localeOrParams === 'object') {
    const fromParams =
      typeof localeOrParams.locale === 'string'
        ? localeOrParams.locale
        : undefined;
    return resolveLocale(fromParams);
  }
  return resolveLocale(undefined);
}

export function localizedFeedbackUpLabel(locale?: string): string {
  return t(resolveLocale(locale), 'assistant.feedbackUpLabel');
}

export function localizedFeedbackDownLabel(locale?: string): string {
  return t(resolveLocale(locale), 'assistant.feedbackDownLabel');
}

export function localizedFeedbackThanks(locale?: string): string {
  return t(resolveLocale(locale), 'assistant.feedbackThanks');
}

export function localizedFeedbackReasonOptions(locale?: string): Array<{
  id: string;
  label: string;
}> {
  const loc = resolveLocale(locale);
  return [
    {
      id: 'wrong_action',
      label: t(loc, 'assistant.feedbackReasonWrongAction'),
    },
    { id: 'wrong_date', label: t(loc, 'assistant.feedbackReasonWrongDate') },
    {
      id: 'wrong_person',
      label: t(loc, 'assistant.feedbackReasonWrongPerson'),
    },
    {
      id: 'wrong_service',
      label: t(loc, 'assistant.feedbackReasonWrongService'),
    },
    {
      id: 'did_not_understand',
      label: t(loc, 'assistant.feedbackReasonDidNotUnderstand'),
    },
  ];
}

export function localizedFeedbackReasonSkipLabel(locale?: string): string {
  return t(resolveLocale(locale), 'assistant.feedbackReasonSkip');
}

export const GIVE_AI_FEEDBACK_INTENTS = ['give_ai_feedback'] as const;

export type GiveAiFeedbackIntent = (typeof GIVE_AI_FEEDBACK_INTENTS)[number];

// e2e-bug.265 — bare `helpful` must not match inside "Not helpful"
// (same hardening as provider e2e-bug.243).
// e2e-bug.293 — UI chip labels "Thumbs up" / "Thumbs down" (+ emoji).
const POSITIVE_CUE = new RegExp(
  // e2e-bug.341 — the Armenian alternative must use Է (Eh, U+0537), not the
  // visually-similar Ե (Yech, U+0565); "էր" is the real word for "was", so
  // the typo'd "եր" never matched any real occurrence of "օգտակար էր".
  String.raw`\b(that\s+was\s+helpful|(?<!\bnot\s)helpful|good\s+answer|great\s+answer|correct\s+answer|that\s+worked|thanks\s+that\s+helped|thumbs?\s*-?\s*up)\b|👍|օգտակար\s+էր|(?<!\bне\s)полезно|спасибо.{0,12}помог`,
  'iu',
);

// e2e-bug.324 — Armenian native "not helpful" ("օգտակար չէ" / past "օգտակար
// չէր") must rescue the same as "սխալ էր"; the POSITIVE_CUE "օգտակար եր"
// alternative doesn't overlap since it requires "եր" directly after
// "օգտակար", not "չէ(ր)".
const NEGATIVE_CUE = new RegExp(
  String.raw`\b(that\s+was\s+wrong|wrong|incorrect|not\s+helpful|bad\s+answer|mistake|that\s+is\s+wrong|answer\s+was\s+incorrect|thumbs?\s*-?\s*down)\b|👎|սխալ|օգտակար\s+չէ(?:ր)?|ոչ\s+օգտակար|не\s+полез|неправильн|неверно`,
  'iu',
);

/**
 * e2e-bug.300 — shorthand vote "+1" / "-1". Whole-prompt only so booking math
 * ("party of +1", "1+1", "+10 guests") is not stolen.
 * e2e-bug.326 — allow a short "thanks"/"thx"/"ty" wrapper on either side
 * (`"+1 thanks"`, `"thanks +1"`) and the fullwidth `＋1`/`－1` variants,
 * while staying whole-prompt-anchored so booking math is still excluded.
 */
const VOTE_WRAPPER = String.raw`(?:thanks?|thx|ty)`;
const PLUS_ONE_FEEDBACK_PROMPT = new RegExp(
  String.raw`^(?:${VOTE_WRAPPER}[\s,!.]*)?(?:\+\s*1|＋\s*1|plus\s*(?:one|1))(?:[\s,!.]*${VOTE_WRAPPER})?[\s!.]*$`,
  'iu',
);
const MINUS_ONE_FEEDBACK_PROMPT = new RegExp(
  String.raw`^(?:${VOTE_WRAPPER}[\s,!.]*)?(?:-\s*1|－\s*1|minus\s*(?:one|1))(?:[\s,!.]*${VOTE_WRAPPER})?[\s!.]*$`,
  'iu',
);

export function isPlusOneFeedbackPrompt(prompt: string): boolean {
  return PLUS_ONE_FEEDBACK_PROMPT.test(prompt.trim());
}

export function isMinusOneFeedbackPrompt(prompt: string): boolean {
  return MINUS_ONE_FEEDBACK_PROMPT.test(prompt.trim());
}

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
  // Negatives first — bare "helpful" must not steal "Not helpful" (e2e-bug.265)
  // e2e-bug.300 — anchored -1 before +1.
  if (
    reason ||
    isMinusOneFeedbackPrompt(prompt) ||
    NEGATIVE_CUE.test(prompt) ||
    /\bnot\s+helpful\b/i.test(prompt)
  ) {
    return 'down';
  }
  if (isPlusOneFeedbackPrompt(prompt) || POSITIVE_CUE.test(prompt)) return 'up';
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
  if (
    isMinusOneFeedbackPrompt(prompt) ||
    NEGATIVE_CUE.test(prompt) ||
    /\bnot\s+helpful\b/i.test(prompt)
  ) {
    return 'negative';
  }
  if (isPlusOneFeedbackPrompt(prompt) || POSITIVE_CUE.test(prompt)) {
    return 'positive';
  }
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
  // e2e-bug.293 — chip-label synonyms (also covered by POSITIVE/NEGATIVE_CUE).
  if (/^thumbs?\s*-?\s*up\b/i.test(text) || text === '👍') return true;
  if (/^thumbs?\s*-?\s*down\b/i.test(text) || text === '👎') return true;
  // e2e-bug.300 — shorthand +1 / -1 (whole prompt only).
  if (isPlusOneFeedbackPrompt(text) || isMinusOneFeedbackPrompt(text)) {
    return true;
  }
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
  locale?: string,
): string {
  const loc = resolveLocale(locale);
  if (rating === 'up') return t(loc, 'assistant.feedbackThanks');
  if (reason) return t(loc, 'assistant.feedbackThanks');
  if (needsReasonChips) {
    return t(loc, 'assistant.feedbackDownChooseReason');
  }
  return t(loc, 'assistant.feedbackThanks');
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
  locale?: string,
): Record<string, unknown> {
  const rating = parsed.rating;
  const reason = parsed.reason;
  const needsReasonChips = rating === 'down' && !reason;
  const clientAction = resolveGiveAiFeedbackClientAction(rating, reason);
  const lastAssistantReply = resolveLastAssistantReply(params);
  const lastAction = readString(params.lastAction);
  const loc = resolveGiveAiFeedbackLocale(locale ?? params);

  return {
    aspect: parsed.aspect,
    ...(rating ? { feedbackRating: rating } : {}),
    ...(reason ? { feedbackReason: reason } : {}),
    feedbackUpLabel: localizedFeedbackUpLabel(loc),
    feedbackDownLabel: localizedFeedbackDownLabel(loc),
    feedbackThanks: localizedFeedbackThanks(loc),
    feedbackReasonSkipLabel: localizedFeedbackReasonSkipLabel(loc),
    feedbackReasonOptions: localizedFeedbackReasonOptions(loc),
    ...(needsReasonChips ? { showReasonChips: true } : {}),
    clientAction,
    assistantFeedback: true,
    ...(lastAssistantReply ? { lastAssistantReply } : {}),
    ...(lastAction ? { lastAction } : {}),
  };
}
