import { CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES } from './ai-explain-rtl-layout.fixtures.js';
import { EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS } from './ai-explain-rtl-layout-multilingual.fixtures.js';
import type { ExplainRtlLayoutAspect } from './ai-explain-rtl-layout.fixtures.js';
import { isGiveAiFeedbackPrompt } from './ai-give-ai-feedback.util.js';

export { CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES };

/** Stylesheet that mirrors assistant bubbles when dir=rtl (adopt-5.6). */
export const ADOPTION_A11Y_STYLESHEET = 'adoption-a11y.css';

export const RTL_READING_DIRECTION_LABEL = 'Right-to-left (RTL)';

export const LTR_READING_DIRECTION_LABEL = 'Left-to-right (LTR)';

export const EXPLAIN_RTL_LAYOUT_INTENTS = ['explain_rtl_layout'] as const;

export type ExplainRtlLayoutIntent =
  (typeof EXPLAIN_RTL_LAYOUT_INTENTS)[number];

export type DocumentDirection = 'ltr' | 'rtl';

const WHY_RIGHT_CUE = new RegExp(
  String.raw`\b(why\s+is\s+(?:text|typing|everything)\s+on\s+the\s+right|text\s+on\s+the\s+right|everything\s+on\s+the\s+right\s+side|typing\s+on\s+the\s+right)\b|ինչու\s+է\s+տեքստը\s+աջ|почему\s+текст\s+справа`,
  'iu',
);

const ASSISTANT_BUBBLES_CUE = new RegExp(
  String.raw`\b(chat\s+bubbles?\s+flipped|layout\s+looks\s+backwards|assistant\s+on\s+the\s+wrong\s+side|messages?\s+mirrored|text\s+alignment\s+looks\s+wrong)\b|խոսակցության\s+պղպռակ|наоборот|переверн`,
  'iu',
);

const LOCALE_DIRECTION_CUE = new RegExp(
  String.raw`\b(what\s+is\s+rtl|right\s+to\s+left|reading\s+direction|is\s+armenian\s+right\s+to\s+left|is\s+russian\s+right\s+to\s+left)\b|rtl\s+ինչ|что\s+такое\s+rtl|направление\s+чтения`,
  'iu',
);

const LOGICAL_CSS_CUE = new RegExp(
  String.raw`\b(logical\s+css|padding-inline|rtl-safe)\b`,
  'iu',
);

const GENERIC_RTL_CUE = new RegExp(
  String.raw`\b(explain\s+rtl\s+layout|text\s+alignment\s+looks\s+wrong|rtl\s+layout)\b`,
  'iu',
);

const RTL_LOCALE_PREFIXES = ['ar', 'he', 'fa', 'ur', 'ps', 'ku'] as const;

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
): (typeof EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS)[number] | null {
  const trimmed = prompt.trim();
  return (
    EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

export function resolveDocumentDirection(
  params: Record<string, unknown> = {},
): DocumentDirection {
  const explicit =
    readString(params.documentDirection) ?? readString(params.dir);
  if (explicit === 'rtl' || explicit === 'ltr') return explicit;

  const locale = readString(params.locale)?.toLowerCase() ?? 'en';
  if (RTL_LOCALE_PREFIXES.some((prefix) => locale.startsWith(prefix))) {
    return 'rtl';
  }
  return 'ltr';
}

/**
 * Prefer explicit params.locale (after request/session threading), then
 * `_requestLocale` if a caller set it without overlapping update_my_locale.
 * e2e-bug.85 — never rely on the classifier to invent locale from the prompt.
 */
export function resolveRtlLayoutLocale(
  params: Record<string, unknown> = {},
): string {
  return readString(params.locale) ?? readString(params._requestLocale) ?? 'en';
}

/** Merge request/session locale into handler params (customer + public). */
export function mergeExplainRtlLayoutRequestLocale(
  params: Record<string, unknown> = {},
  requestLocale?: string,
): Record<string, unknown> {
  return {
    ...params,
    locale:
      readString(params.locale) ??
      readString(requestLocale) ??
      readString(params._requestLocale),
  };
}

export function isExplainRtlLayoutIntent(
  action: string,
): action is ExplainRtlLayoutIntent {
  return (EXPLAIN_RTL_LAYOUT_INTENTS as readonly string[]).includes(action);
}

export function parseExplainRtlLayoutAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): ExplainRtlLayoutAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'why_right_aligned' ||
    fromParams === 'assistant_messages' ||
    fromParams === 'locale_direction' ||
    fromParams === 'logical_css' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  if (WHY_RIGHT_CUE.test(prompt)) return 'why_right_aligned';
  if (ASSISTANT_BUBBLES_CUE.test(prompt)) return 'assistant_messages';
  if (LOCALE_DIRECTION_CUE.test(prompt)) return 'locale_direction';
  if (LOGICAL_CSS_CUE.test(prompt)) return 'logical_css';
  if (GENERIC_RTL_CUE.test(prompt)) return 'generic';
  return 'generic';
}

export function isExplainRtlLayoutPrompt(prompt: string): boolean {
  if (isGiveAiFeedbackPrompt(prompt)) return false;
  if (matchMultilingualScenario(prompt)) return true;

  const text = prompt.trim();
  if (!text) return false;

  if (/^why\s+is\s+text\s+on\s+the\s+right\b/i.test(text)) return true;
  if (/^why\s+is\s+everything\s+on\s+the\s+right\s+side\b/i.test(text))
    return true;
  if (/^why\s+does\s+the\s+layout\s+look\s+backwards\b/i.test(text))
    return true;
  if (/^why\s+are\s+chat\s+bubbles\s+flipped\b/i.test(text)) return true;
  if (/^what\s+is\s+rtl\b/i.test(text)) return true;
  if (/^why\s+is\s+this\s+right\s+to\s+left\b/i.test(text)) return true;
  if (/^explain\s+rtl\s+layout\b/i.test(text)) return true;
  if (/^why\s+is\s+the\s+assistant\s+on\s+the\s+wrong\s+side/i.test(text)) {
    return true;
  }
  if (/^text\s+alignment\s+looks\s+wrong\b/i.test(text)) return true;
  if (/^why\s+is\s+typing\s+on\s+the\s+right\b/i.test(text)) return true;
  if (/^is\s+armenian\s+right\s+to\s+left\b/i.test(text)) return true;
  if (/^explain\s+the\s+reading\s+direction\b/i.test(text)) return true;

  return (
    WHY_RIGHT_CUE.test(text) ||
    ASSISTANT_BUBBLES_CUE.test(text) ||
    LOCALE_DIRECTION_CUE.test(text) ||
    LOGICAL_CSS_CUE.test(text) ||
    GENERIC_RTL_CUE.test(text)
  );
}

export function parseExplainRtlLayoutFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  aspect: ExplainRtlLayoutAspect;
  documentDirection: DocumentDirection;
  locale: string;
} | null {
  if (!isExplainRtlLayoutPrompt(prompt)) return null;
  return {
    aspect: parseExplainRtlLayoutAspect(prompt, params),
    documentDirection: resolveDocumentDirection(params),
    locale: resolveRtlLayoutLocale(params),
  };
}

export function rescueExplainRtlLayoutIntent(
  prompt: string,
  action: string,
): { action: ExplainRtlLayoutIntent; rescueReason: string } | null {
  if (isExplainRtlLayoutIntent(action)) return null;
  if (!isExplainRtlLayoutPrompt(prompt)) return null;
  return {
    action: 'explain_rtl_layout',
    rescueReason: 'explain_rtl_layout',
  };
}

export function buildExplainRtlLayoutGuidance(
  aspect: ExplainRtlLayoutAspect,
  documentDirection: DocumentDirection,
  locale: string,
): { summaryParts: string[]; nextSteps: string[]; hint: string } {
  const isRtl = documentDirection === 'rtl';
  const directionLabel = isRtl
    ? RTL_READING_DIRECTION_LABEL
    : LTR_READING_DIRECTION_LABEL;
  const nextSteps: string[] = [];

  if (
    aspect === 'locale_direction' ||
    aspect === 'generic' ||
    aspect === 'all'
  ) {
    const localeNote =
      locale === 'hy' || locale === 'ru' || locale === 'en'
        ? `${locale.toUpperCase()} uses left-to-right reading in this app.`
        : `Your locale (${locale}) sets the page reading direction.`;
    return {
      summaryParts: [
        directionLabel,
        localeNote,
        'Spacing follows reading direction so layouts stay readable in both LTR and RTL.',
      ],
      nextSteps: [
        'Change language in app or browser settings if the direction looks unexpected.',
        'Assistant bubbles mirror automatically when the page is in right-to-left mode.',
      ],
      hint: directionLabel,
    };
  }

  if (aspect === 'assistant_messages') {
    const bubbleHint = isRtl
      ? 'In RTL mode, your messages align left and assistant replies align right so the thread reads naturally.'
      : 'In LTR mode, your messages align right and assistant replies align left.';
    nextSteps.push(
      'Check language and reading-direction settings if chat bubbles look mirrored.',
      'Switch back to your preferred language if bubbles look mirrored by mistake.',
    );
    return {
      summaryParts: [bubbleHint, directionLabel],
      nextSteps,
      hint: bubbleHint,
    };
  }

  if (aspect === 'logical_css') {
    return {
      summaryParts: [
        'Spacing uses direction-aware margins and padding so layout follows reading direction.',
        directionLabel,
      ],
      nextSteps: [
        'Text size and touch targets stay usable when you change language or direction.',
      ],
      hint: 'Direction-aware spacing follows reading direction.',
    };
  }

  const alignmentHint = isRtl
    ? 'Text starts on the right because the page is in right-to-left (RTL) mode for languages like Arabic or Hebrew.'
    : 'English, Armenian, and Russian read left-to-right — assistant text normally starts on the left. If everything looks right-aligned, your device or browser may have RTL direction enabled.';
  nextSteps.push(
    `Open language settings and confirm locale (${locale}) and direction (${documentDirection}).`,
    'Buttons and focus outlines stay easy to use in both reading directions.',
  );

  return {
    summaryParts: [alignmentHint, directionLabel],
    nextSteps,
    hint: alignmentHint,
  };
}

/** Customer-visible strings from RTL guidance (summary, hint, next steps). */
export function collectExplainRtlLayoutCustomerFacingText(guidance: {
  summaryParts: string[];
  nextSteps: string[];
  hint: string;
}): string[] {
  return [
    ...guidance.summaryParts,
    guidance.hint,
    ...guidance.nextSteps,
  ].filter((part) => typeof part === 'string' && part.trim().length > 0);
}

/** e2e-bug.86 — customer copy must never mention internal stylesheet/CSS selectors. */
export function explainRtlLayoutCustomerTextLeaksInternalCss(
  text: string,
): boolean {
  return (
    /\badoption-a11y(?:\.css)?\b/i.test(text) ||
    /\.consumer-ai-msg\b/i.test(text) ||
    /\[dir=["']rtl["']\]/i.test(text)
  );
}
