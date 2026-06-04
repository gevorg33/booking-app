/**
 * Detection helpers for multilingual AI commands (Armenian, Russian, transliteration).
 * Normalization is performed by AiPromptNormalizationService (LLM), not manual phrase maps.
 */

/** Armenian or Cyrillic script. */
export function containsNonEnglishScript(text: string): boolean {
  return /[\u0530-\u058F\u0400-\u04FF]/.test(text);
}

/** Latin letters that are not basic ASCII (accented Latin still counts as "needs help"). */
export function containsExtendedLatin(text: string): boolean {
  return /[^\x00-\x7F]/.test(text) && !containsNonEnglishScript(text);
}

/** Common hy/ru words typed in Latin without Armenian/Cyrillic letters. */
const TRANSLITERATION_HINT =
  /\b(aysor|vagh[ay]?|vax[ay]?|erek|chaxord|tsarayutyun|amsagrum|chegharke?l|azat|ogtagortum|sevodnya|zavtra|vchera|kklient|usluga|zapis|otmen|skolko|pokazhi|zapolni|grafik|raspisanie)\b/i;

export function looksLikeTransliteration(text: string): boolean {
  if (containsNonEnglishScript(text)) return false;
  return TRANSLITERATION_HINT.test(text);
}

/** Whether to run the automated normalization pipeline before intent classification. */
export function needsMultilingualNormalization(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return false;
  return (
    containsNonEnglishScript(trimmed) ||
    containsExtendedLatin(trimmed) ||
    looksLikeTransliteration(trimmed)
  );
}

export const CLASSIFIER_MULTILINGUAL_RULES = `Multilingual commands: Users may write in Armenian, Russian, English, or Latin transliteration. Interpret the same operational intents (book, cancel, show appointments, fill slots, reschedule, utilization, waitlist, etc.). Extract employeeName, customerName, and serviceName exactly as written in the user message (fuzzy-match to Available lists). Use DD/MM/YYYY for dates and HH:mm 24h for times.`;

/** Context block for classify_intent when the prompt was normalized or is non-English. */
export function buildMultilingualClassifierContext(
  original: string,
  normalized: string,
  method: 'passthrough' | 'llm' | 'fallback',
): string | null {
  if (!needsMultilingualNormalization(original) && original === normalized) {
    return null;
  }
  if (method === 'llm' && normalized !== original) {
    return `User command (original): "${original}"\nNormalized for classification: "${normalized}"`;
  }
  return `User command (may be Armenian/Russian/transliteration): "${original}"`;
}
