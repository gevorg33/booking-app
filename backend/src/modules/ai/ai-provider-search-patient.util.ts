import { SEARCH_PATIENT_PROMPT_SCENARIOS } from './ai-provider-search-patient.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.19.1 — search/lookup patients by name or phone across the clinic. */
export function isSearchPatientPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\bfind\s+patient\b/i.test(lower)) return true;
  if (/\blookup\b.*\b(patient|phone)\b/i.test(lower)) return true;
  if (/\bsearch\s+(?:for\s+)?patients?\b/i.test(lower)) return true;
  if (
    /\b(find|search|lookup)\b/i.test(lower) &&
    /\bphone\s+ending\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(որոնել|փնտրել)/i.test(prompt) &&
    /հիվանդ/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(найти|поиск|искать)/i.test(prompt) &&
    /(пациент)/i.test(prompt)
  ) {
    return true;
  }

  return SEARCH_PATIENT_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function extractPatientSearchQueryFromPrompt(
  prompt: string,
): string | null {
  const named = prompt.match(/\bfind\s+patient\s+([\w][\w\s'-]{1,60})/i);
  if (named?.[1]) return named[1].trim().replace(/[.?!]+$/, '');

  const phoneEnding = prompt.match(
    /\bphone\s+ending\s+(?:in\s+|with\s+)?(\d{2,10})/i,
  );
  if (phoneEnding?.[1]) return phoneEnding[1].trim();

  const lookupBy = prompt.match(
    /\blookup\s+(?:by\s+)?(?:phone|name)\s+([\w][\w\s'-]{1,60})/i,
  );
  if (lookupBy?.[1]) return lookupBy[1].trim().replace(/[.?!]+$/, '');

  const searchFor = prompt.match(
    /\bsearch\s+(?:for\s+)?patients?\s+(?:named\s+)?([\w][\w\s'-]{1,60})/i,
  );
  if (searchFor?.[1]) return searchFor[1].trim().replace(/[.?!]+$/, '');

  return null;
}

export function rescueSearchPatientIntent(
  prompt: string,
  action: string,
): { action: 'search_patient'; rescueReason: string } | null {
  if (action === 'search_patient') return null;
  if (!isSearchPatientPrompt(prompt)) return null;
  return { action: 'search_patient', rescueReason: 'search_patient' };
}

export function formatPatientSearchResultsText(
  query: string,
  patients: Array<{ name: string; phone: string | null; email: string | null }>,
): string {
  if (!patients.length) {
    return `No patients match "${query}".`;
  }
  const lines = patients
    .slice(0, 8)
    .map((p) => `• ${p.name}${p.phone ? ` — ${p.phone}` : ''}`);
  return `${patients.length} patient${patients.length === 1 ? '' : 's'} match "${query}":\n${lines.join('\n')}`;
}
