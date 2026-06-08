import {
  ABBREVIATION_REPLACEMENTS,
  DATE_WORD_REPLACEMENTS,
  SPELL_CORRECTIONS,
  SPOKEN_HOUR_WORDS,
} from './ai-prompt-normalization.fixtures.js';

export interface PromptNormalizationUpgrade {
  normalized: string;
  expansions: string[];
}

const MIXED_SCRIPT_SPLIT_PATTERNS: ReadonlyArray<RegExp> = [
  /([\u0530-\u058F\u0400-\u04FF])([A-Za-z0-9])/g,
  /([A-Za-z0-9])([\u0530-\u058F\u0400-\u04FF])/g,
];

/** Insert spaces at Latin ↔ Armenian/Cyrillic boundaries (acc-3.7). */
export function splitMixedScriptBoundaries(text: string): {
  text: string;
  adjusted: boolean;
} {
  let split = text;
  for (const pattern of MIXED_SCRIPT_SPLIT_PATTERNS) {
    split = split.replace(pattern, '$1 $2');
  }
  split = split.replace(/\s+/g, ' ').trim();
  return { text: split, adjusted: split !== text };
}

function applyRegexReplacements(
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

/** Correct common booking typos on whole words (acc-3.7). */
export function applySpellCorrections(
  text: string,
  expansions: string[],
): string {
  return text.replace(/\b[\w'-]+\b/g, (token) => {
    const lower = token.toLowerCase();
    const corrected = SPELL_CORRECTIONS[lower];
    if (!corrected || corrected === lower) {
      return token;
    }
    expansions.push(`spell: ${lower}→${corrected}`);
    if (token[0] === token[0]?.toUpperCase()) {
      return corrected.charAt(0).toUpperCase() + corrected.slice(1);
    }
    return corrected;
  });
}

/** Normalize spoken hour + am/pm to 24h HH:mm (acc-3.7). */
export function normalizeSpokenTimes(text: string, expansions: string[]): string {
  const pattern =
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(am|pm)\b/gi;

  return text.replace(pattern, (match, hourWord: string, ampm: string) => {
    const hour = SPOKEN_HOUR_WORDS[hourWord.toLowerCase()];
    if (!hour) return match;
    let hour24 = hour;
    if (/pm/i.test(ampm) && hour < 12) hour24 = hour + 12;
    if (/am/i.test(ampm) && hour === 12) hour24 = 0;
    const formatted = `${String(hour24).padStart(2, '0')}:00`;
    expansions.push(`time: ${match.trim()}→${formatted}`);
    return formatted;
  });
}

/** acc-3.7 — spell-correction, abbreviation expansion, number/date words, mixed-script split. */
export function normalizePromptForClassifier(prompt: string): PromptNormalizationUpgrade {
  let normalized = prompt.trim().replace(/\s+/g, ' ');
  const expansions: string[] = [];

  const mixed = splitMixedScriptBoundaries(normalized);
  if (mixed.adjusted) {
    normalized = mixed.text;
    expansions.push('mixed-script: split script boundaries');
  }

  normalized = applySpellCorrections(normalized, expansions);
  normalized = applyRegexReplacements(normalized, ABBREVIATION_REPLACEMENTS, expansions);
  normalized = normalizeSpokenTimes(normalized, expansions);
  normalized = applyRegexReplacements(normalized, DATE_WORD_REPLACEMENTS, expansions);

  return { normalized, expansions: [...new Set(expansions)] };
}

export function buildNormalizationClassifierContext(
  expansions: string[],
): string | null {
  if (expansions.length === 0) return null;
  return `Normalized phrasing (acc-3.7): ${expansions.join('; ')}`;
}
