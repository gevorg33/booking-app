import { BUSINESS_DATE_FORMAT_INTENTS } from './ai-business-date-format.util.js';

export const DATE_INPUT_FORMAT_INTENTS = [
  'explain_date_input_format',
  'preview_date_input_parse',
] as const;

export type DateInputFormatIntent = (typeof DATE_INPUT_FORMAT_INTENTS)[number];

const DATE_LITERAL_PATTERN =
  /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}_\d{1,2}_\d{4}/;

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasDateLiteralInPrompt(prompt: string): boolean {
  return DATE_LITERAL_PATTERN.test(prompt);
}

export function hasDateInputContext(prompt: string): boolean {
  if (/\bdate\s+input\b/i.test(prompt)) return true;
  if (/\bcalendar\s+picker\b/i.test(prompt)) return true;
  if (
    /\b(?:typed|typing|type|enter(?:ing)?|manual(?:ly)?|date\s+field|text\s+field)\b/i.test(
      prompt,
    ) &&
    /\b(?:date|dates)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:parse|parsing|parsed|parses)\b/i.test(prompt) &&
    /\b(?:date|input|typed)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    if (
      /(մուտքագր|տիպ|ձեռքով|դաշտ|ամսաթիվ|վերլուծ)/i.test(prompt) &&
      /(ամսաթիվ|մուտք|parse|picker|dateformat)/i.test(prompt)
    ) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (
      /(ввод|ввести|набрать|поле|ручн)/i.test(prompt) &&
      /(дат[аы]?|ввод|parse|picker)/i.test(prompt)
    ) {
      return true;
    }
  }
  return false;
}

export function isPreviewDateInputParsePrompt(prompt: string): boolean {
  if (
    /\b(?:booking|before\s+saving|vs\s+current|alternate)\b/i.test(prompt) &&
    /\b(?:preview|what\s+would|show\s+how|compare)\b/i.test(prompt) &&
    !hasDateLiteralInPrompt(prompt) &&
    !/\b(?:typed|date\s+input|date\s+field)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:how|why|explain|describe|which\s+order|does|happens)\b/i.test(
      prompt,
    ) &&
    !hasDateLiteralInPrompt(prompt) &&
    !/\b(?:preview|iso\s+day|what\s+would|show\s+how)\b/i.test(prompt)
  ) {
    return false;
  }

  const strongPreviewCue =
    /\b(preview|iso\s+day|resolves?|resolve|interpret|what\s+would|show\s+how)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(նախադիտ|որ\s+iso|ինչ\s+կլինի|վերլուծ|ցույց\s+տուր|iso\s+օր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(предпросмотр|какой\s+iso|как\s+будет|разбира)/i.test(prompt));
  const parseWithLiteral =
    (/\b(?:parse|parsed|parses)\b/i.test(prompt) ||
      (containsCyrillicScript(prompt) && /разбира/i.test(prompt)) ||
      (containsArmenianScript(prompt) && /վերլուծ/i.test(prompt))) &&
    hasDateLiteralInPrompt(prompt);

  if (!strongPreviewCue && !parseWithLiteral) return false;

  if (hasDateLiteralInPrompt(prompt)) return true;

  return (
    /\b(?:typed|date\s+input|date\s+string)\b/i.test(prompt) &&
    /\b(?:parse|parsed|preview|resolve|iso)\b/i.test(prompt)
  );
}

export function isExplainDateInputFormatPrompt(prompt: string): boolean {
  if (isPreviewDateInputParsePrompt(prompt)) return false;

  const explainCue =
    /\b(?:how|what|why|explain|describe|does|which\s+order|vs|versus|compared|same|when|happens)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ինչպես|ինչու|ինչ|բացատրիր|նույն|երբ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(как|почему|что|объясни|тот\s+же|когда)/i.test(prompt));

  if (!explainCue) return false;

  if (hasDateInputContext(prompt)) return true;

  if (
    /\b(?:DD\/MM|MM\/DD|disambigu)\b/i.test(prompt) &&
    /\b(?:typed|input|field|parse|enter)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\bwhat\s+happens\b/i.test(prompt) &&
    /\b(?:type|typed|typing)\b/i.test(prompt) &&
    hasDateLiteralInPrompt(prompt)
  ) {
    return true;
  }

  return false;
}

const DATE_STRING_CAPTURE =
  /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}_\d{1,2}_\d{4}/g;

export const DEFAULT_PREVIEW_DATE_STRINGS = ['04/06/2026', '15/08/2026'];

export function parseDateStringsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): string[] {
  const fromParams = params.dateStrings;
  if (Array.isArray(fromParams)) {
    const normalized = fromParams
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);
    if (normalized.length > 0) return normalized;
  }

  const matches = prompt.match(DATE_STRING_CAPTURE) ?? [];
  const unique = [...new Set(matches.map((value) => value.trim()))];
  return unique.length > 0 ? unique : DEFAULT_PREVIEW_DATE_STRINGS;
}

export function rescueDateInputFormatIntent(
  prompt: string,
  action: string,
): { action: DateInputFormatIntent; rescueReason: string } | null {
  if ((BUSINESS_DATE_FORMAT_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (isPreviewDateInputParsePrompt(prompt)) {
    return {
      action: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
    };
  }
  if (isExplainDateInputFormatPrompt(prompt)) {
    return {
      action: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
    };
  }
  return null;
}
