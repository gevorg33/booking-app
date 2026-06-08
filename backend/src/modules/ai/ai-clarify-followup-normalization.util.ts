import {
  containsNonEnglishScript,
  looksLikeTransliteration,
} from './ai-prompt-i18n.js';
import {
  normalizePromptForClassifier,
  splitMixedScriptBoundaries,
} from './ai-prompt-normalization.util.js';
import {
  CLARIFY_FOLLOWUP_DATE_REPLACEMENTS,
  CLARIFY_FOLLOWUP_TIME_REPLACEMENTS,
} from './ai-clarify-followup-normalization.fixtures.js';

export interface ClarifyFollowUpNormalizationResult {
  normalized: string;
  expansions: string[];
}

const DATE_FIELDS = new Set(['date', 'dateFrom', 'dateTo']);
const TIME_FIELDS = new Set(['timeSlot', 'timeFrom', 'timeTo']);
const ENTITY_FIELDS = new Set([
  'employeeName',
  'serviceName',
  'customerName',
  'templateName',
]);

function applyReplacementList(
  text: string,
  replacements: ReadonlyArray<{ pattern: RegExp; value: string; label: string }>,
  expansions: string[],
): string {
  let result = text;
  for (const { pattern, value, label } of replacements) {
    const next = result.replace(pattern, value);
    if (next !== result) {
      result = next;
      expansions.push(label);
    }
  }
  return result;
}

function normalizeRussianSpokenHour(text: string, expansions: string[]): string {
  return text.replace(
    /\b(\d{1,2})\s*(?:час(?:а|ов)?)\s*(утра|дня|вечера)\b/giu,
    (match, hour: string, part: string) => {
      let hour24 = parseInt(hour, 10);
      if (/вечера/i.test(part) && hour24 < 12) hour24 += 12;
      if (/утра/i.test(part) && hour24 === 12) hour24 = 0;
      const formatted = `${String(hour24).padStart(2, '0')}:00`;
      expansions.push(`clarify-time: ru spoken ${match.trim()}→${formatted}`);
      return formatted;
    },
  );
}

/** Map hy/ru/translit date/time phrases to canonical tokens for parsing (n99-1.6). */
export function normalizeClarifyLocaleDateTimePhrase(text: string): string {
  const expansions: string[] = [];
  let normalized = text.trim().replace(/\s+/g, ' ');
  normalized = applyReplacementList(normalized, CLARIFY_FOLLOWUP_DATE_REPLACEMENTS, expansions);
  normalized = normalizeRussianSpokenHour(normalized, expansions);
  normalized = applyReplacementList(normalized, CLARIFY_FOLLOWUP_TIME_REPLACEMENTS, expansions);
  return normalized.replace(/\s+/g, ' ').trim();
}

/** Field-aware normalization — entity names keep script; dates/times canonicalize. */
export function normalizeClarifyFieldAnswer(field: string, answer: string): string {
  const trimmed = answer.trim();
  if (!trimmed) return trimmed;

  if (ENTITY_FIELDS.has(field)) {
    return splitMixedScriptBoundaries(trimmed).text;
  }

  const enNormalized = shouldApplyEnglishVoiceNormalization(trimmed)
    ? normalizePromptForClassifier(trimmed).normalized
    : trimmed.replace(/\s+/g, ' ').trim();
  const localeNormalized = normalizeClarifyLocaleDateTimePhrase(enNormalized);

  if (DATE_FIELDS.has(field)) {
    if (/\btomorrow\b/i.test(localeNormalized)) return 'tomorrow';
    if (/\btoday\b/i.test(localeNormalized)) return 'today';
    if (/\byesterday\b/i.test(localeNormalized)) return 'yesterday';
    const iso = localeNormalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) return iso[1]!;
    return localeNormalized
      .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
      .trim();
  }

  if (TIME_FIELDS.has(field)) {
    const timeMatch = localeNormalized.match(/\b(\d{1,2}:\d{2})\b/);
    if (timeMatch) return timeMatch[1]!;
    const compact = localeNormalized.match(/\b(\d{1,2})\s*(am|pm)\b/i);
    if (compact) {
      return normalizePromptForClassifier(compact[0]).normalized;
    }
    return localeNormalized;
  }

  return enNormalized;
}

function shouldApplyEnglishVoiceNormalization(text: string): boolean {
  if (containsNonEnglishScript(text)) return false;
  if (looksLikeTransliteration(text)) return true;
  return /[a-z]/i.test(text);
}

/** Preserve hy/ru merged prompt text; apply acc-3.7 for EN/translit voice typos. */
export function normalizeClarifyFollowUpForMerge(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;
  let normalized = shouldApplyEnglishVoiceNormalization(trimmed)
    ? normalizePromptForClassifier(trimmed).normalized
    : trimmed.replace(/\s+/g, ' ');
  if (shouldApplyEnglishVoiceNormalization(trimmed)) {
    normalized = normalizeClarifyLocaleDateTimePhrase(normalized);
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

/** n99-1.6 — voice/typo tolerant clarify follow-up normalization (extends acc-3.7). */
export function normalizeClarifyFollowUpAnswer(prompt: string): string {
  return normalizeClarifyFollowUpForMerge(prompt);
}

/** Normalize structured clarify memory values before param merge. */
export function normalizeClarifyFollowUpAnswers(
  answers: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [field, value] of Object.entries(answers)) {
    if (!value.trim()) continue;
    normalized[field] = normalizeClarifyFieldAnswer(field, value);
  }
  return normalized;
}

/** Validation path — field hint optional for single-field free text. */
export function normalizeClarifyAnswerForValidation(
  answer: string,
  field?: string,
): string {
  if (field) {
    return normalizeClarifyFieldAnswer(field, answer);
  }
  const merged = normalizeClarifyFollowUpForMerge(answer);
  return normalizeClarifyLocaleDateTimePhrase(merged);
}

export function buildClarifyFollowUpNormalizationResult(
  prompt: string,
): ClarifyFollowUpNormalizationResult {
  const normalized = normalizeClarifyFollowUpAnswer(prompt);
  const upgrade = normalizePromptForClassifier(prompt.trim());
  return {
    normalized,
    expansions: upgrade.expansions,
  };
}

export { CLARIFY_FOLLOWUP_NORMALIZATION_SCENARIOS } from './ai-clarify-followup-normalization.fixtures.js';
