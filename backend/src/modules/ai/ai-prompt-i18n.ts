import { CHECK_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-check-and-book-multilingual.fixtures.js';
import { BUSINESS_CURRENCY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-currency-multilingual.fixtures.js';
import { BUSINESS_LANGUAGES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-languages-multilingual.fixtures.js';
import { BUSINESS_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-date-format-multilingual.fixtures.js';
import { BUSINESS_DATE_FORMAT_PREVIEW_AUDIT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-date-format-preview-audit-multilingual.fixtures.js';
import { DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-date-input-provider-format-multilingual.fixtures.js';
import { BUSINESS_TAX_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-tax-multilingual.fixtures.js';
import { BUSINESS_COMPLIANCE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-business-compliance-multilingual.fixtures.js';
import { STACKED_TAX_MULTILINGUAL_CLASSIFIER_RULES } from './ai-stacked-tax-multilingual.fixtures.js';
import { NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-notification-date-format-multilingual.fixtures.js';
import { PACKAGE_LOCALIZED_NAMES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-package-localized-names-multilingual.fixtures.js';
import { TOUR_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-calendar-multilingual.fixtures.js';
import { RECOMMENDATION_PRODUCT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-recommendation-product-multilingual.fixtures.js';
import { RECOMMENDATION_ANALYTICS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-recommendation-analytics-multilingual.fixtures.js';
import { CLINIC_TEST_ORDER_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-test-order-multilingual.fixtures.js';
import { CLINIC_TEST_RESULT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-test-result-multilingual.fixtures.js';
import { CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import { CLINIC_PATIENT_CHART_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-patient-chart-multilingual.fixtures.js';
import { PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-clinic-collection-multilingual.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-consumer-clinic-test-results-multilingual.fixtures.js';
import { CLINIC_V2_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-v2-6-multilingual.fixtures.js';
import { CLINIC_COMPOUND_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-compound-multilingual.fixtures.js';
import { CLINIC_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-service-multilingual.fixtures.js';
import { CLINIC_LAB_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-lab-booking-multilingual.fixtures.js';
import { TOUR_CONSUMER_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-consumer-multilingual.fixtures.js';
import { TOUR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-service-multilingual.fixtures.js';
import { SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-service-discovery-multilingual.fixtures.js';

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
  for (const char of text) {
    if (char.codePointAt(0)! > 0x7f) {
      return !containsNonEnglishScript(text);
    }
  }
  return false;
}

/** Common hy/ru words typed in Latin without Armenian/Cyrillic letters. */
const TRANSLITERATION_HINT =
  /\b(aysor|vagh@?|vax[ay]?|erek|chaxord|tsarayutyun|amsagrum|chegharke?l|azat|ogtagortum|sevodnya|zavtra|vchera|kklient|usluga|zapis|otmen|skolko|pokazhi|zapolni|grafik|raspisanie|svobodn|dostupn|zabroniruy|blizhaysh|skoreysh|vecherom|kto|dlya)\b/i;

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

export const CLASSIFIER_MULTILINGUAL_RULES = `Multilingual commands: Users may write in Armenian, Russian, English, or Latin transliteration. Interpret the same operational intents (book, cancel, show appointments, fill slots, reschedule, utilization, waitlist, etc.). Extract employeeName, customerName, and serviceName exactly as written in the user message (fuzzy-match to Available lists). Use DD/MM/YYYY for dates and HH:mm 24h for times.

${CHECK_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_CURRENCY_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_TAX_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_COMPLIANCE_MULTILINGUAL_CLASSIFIER_RULES}

${STACKED_TAX_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_LANGUAGES_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES}

${BUSINESS_DATE_FORMAT_PREVIEW_AUDIT_MULTILINGUAL_CLASSIFIER_RULES}

${NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES}

${DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CLASSIFIER_RULES}

${PACKAGE_LOCALIZED_NAMES_MULTILINGUAL_CLASSIFIER_RULES}

${TOUR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}

${SERVICE_DISCOVERY_MULTILINGUAL_CLASSIFIER_RULES}

${TOUR_CONSUMER_MULTILINGUAL_CLASSIFIER_RULES}

${TOUR_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES}

${RECOMMENDATION_PRODUCT_MULTILINGUAL_CLASSIFIER_RULES}

${RECOMMENDATION_ANALYTICS_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_TEST_ORDER_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_TEST_RESULT_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_PATIENT_CHART_MULTILINGUAL_CLASSIFIER_RULES}

${PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES}

${CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_V2_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_COMPOUND_MULTILINGUAL_CLASSIFIER_RULES}

${CLINIC_LAB_BOOKING_MULTILINGUAL_CLASSIFIER_RULES}`;

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
