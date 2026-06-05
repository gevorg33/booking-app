/**
 * Detection helpers for multilingual AI commands (Armenian, Russian, transliteration).
 * Non-English prompts are passed through to classify_intent with a context hint (no extra LLM normalize step).
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

/** Whether the prompt needs a multilingual classifier context hint before intent classification. */
export function needsMultilingualNormalization(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return false;
  return (
    containsNonEnglishScript(trimmed) ||
    containsExtendedLatin(trimmed) ||
    looksLikeTransliteration(trimmed)
  );
}

export type RecognizedServiceTermLocale = 'hy' | 'ru' | 'latin';

export interface RecognizedServiceTypeTerm {
  term: string;
  locale: RecognizedServiceTermLocale;
}

/** Common Armenian service-type words in dashboard commands. */
const ARMENIAN_SERVICE_TERMS =
  /(?:կտրում|մասաժ|դիմահարդարում|հարդարման|մանիկյուր|պեդիկյուր|օրաթերթապատում|գունավորում)/giu;

/** Common Russian service-type words in dashboard commands. */
const RUSSIAN_SERVICE_TERMS =
  /(?:стрижк(?:а|и|у|е|ой)?|массаж(?:а|у|е|и)?|маникюр(?:а|у|е)?|педикюр(?:а|у|е)?|окрашивание|окрашивания|укладк(?:а|и|у|е)?|бров(?:и|ей)?|ресниц)/giu;

/** Latin catalog names often embedded in hy/ru prompts. */
const LATIN_CATALOG_SERVICE_TERMS =
  /\b(?:facemassage|haircut|manicure|pedicure|massage|hot\s+stone\s+massage)\b/gi;

function collectServiceTermMatches(
  text: string,
  pattern: RegExp,
  locale: RecognizedServiceTermLocale,
): RecognizedServiceTypeTerm[] {
  const matches: RecognizedServiceTypeTerm[] = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const term = match[0]?.trim();
    if (term) matches.push({ term, locale });
  }
  return matches;
}

/** Extract Armenian, Russian, or Latin service-type tokens mentioned in a command. */
export function recognizeServiceTypeTerms(
  prompt: string,
): RecognizedServiceTypeTerm[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const seen = new Set<string>();
  const results: RecognizedServiceTypeTerm[] = [];
  for (const entry of [
    ...collectServiceTermMatches(trimmed, ARMENIAN_SERVICE_TERMS, 'hy'),
    ...collectServiceTermMatches(trimmed, RUSSIAN_SERVICE_TERMS, 'ru'),
    ...collectServiceTermMatches(trimmed, LATIN_CATALOG_SERVICE_TERMS, 'latin'),
  ]) {
    const key = `${entry.locale}:${entry.term.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(entry);
  }
  return results;
}

export function promptMentionsServiceType(prompt: string): boolean {
  return recognizeServiceTypeTerms(prompt).length > 0;
}

/** True when the prompt names a service in Armenian or Russian (not only Latin catalog names). */
export function promptMentionsNativeServiceType(prompt: string): boolean {
  return recognizeServiceTypeTerms(prompt).some(
    (entry) => entry.locale === 'hy' || entry.locale === 'ru',
  );
}

export const CLASSIFIER_MULTILINGUAL_RULES = `Multilingual commands: Users may write in Armenian, Russian, English, or Latin transliteration. Interpret the same operational intents (book, cancel, show appointments, fill slots, reschedule, utilization, waitlist, etc.). Extract employeeName, customerName, and serviceName exactly as written in the user message (fuzzy-match to Available lists). Use DD/MM/YYYY for dates and HH:mm 24h for times.`;

/** Context block for classify_intent when the prompt is non-English. */
export function buildMultilingualClassifierContext(
  original: string,
  normalized: string,
  method: 'passthrough' | 'multilingual',
): string | null {
  if (!needsMultilingualNormalization(original) && original === normalized) {
    return null;
  }
  if (method === 'passthrough') {
    return null;
  }
  return `User command (may be Armenian/Russian/transliteration): "${original}"`;
}
