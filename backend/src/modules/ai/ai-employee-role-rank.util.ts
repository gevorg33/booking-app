import {
  extractProviderRankServiceCategoryFromPrompt,
  isProviderRankDiscoveryPrompt,
} from './ai-service-rank-discovery.util.js';

const EMPLOYEE_ROLE_OCCUPATIONS = new Set([
  'cosmetologist',
  'dermatologist',
  'esthetician',
  'aesthetician',
  'beautician',
  'barber',
  'manicurist',
  'pedicurist',
  'trichologist',
  'podiatrist',
  'masseur',
  'masseuse',
  'massagist',
  'hairdresser',
  'colorist',
  'nail technician',
  'lash technician',
  'brow technician',
  'makeup artist',
]);

const PROVIDER_ROLE_WORD_PATTERN =
  /\b(?:specialist|stylist|therapist|provider|employee|cosmetologist|dermatologist|esthetician|aesthetician|beautician|barber|manicurist|masseur|masseuse|hairdresser|colorist)s?\b/i;

function normalizeEmployeeRoleTerm(term: string): string {
  const normalized = term
    .trim()
    .toLowerCase()
    .replace(/[?.!]+$/, '');
  if (!normalized) return normalized;
  if (EMPLOYEE_ROLE_OCCUPATIONS.has(normalized)) return normalized;
  if (normalized.endsWith('s')) {
    const singular = normalized.slice(0, -1);
    if (EMPLOYEE_ROLE_OCCUPATIONS.has(singular)) return singular;
    if (/\w+(ologist|iatrist|ician|ist)$/.test(singular)) return singular;
  }
  return normalized;
}

export function isEmployeeRoleOccupation(term: string): boolean {
  const normalized = normalizeEmployeeRoleTerm(term);
  if (!normalized) return false;
  if (EMPLOYEE_ROLE_OCCUPATIONS.has(normalized)) return true;
  return /\b\w+(ologist|iatrist|ician|ist)\b/i.test(normalized);
}

const GENERIC_PROVIDER_ROLE_WORDS = new Set([
  'specialist',
  'specialists',
  'stylist',
  'stylists',
  'therapist',
  'therapists',
  'provider',
  'providers',
  'employee',
  'employees',
  'staff',
]);

function tokenizeEmployeeRoleText(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[\s,+/&]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function meaningfulRoleHintTokens(hint: string): string[] {
  return tokenizeEmployeeRoleText(hint).filter(
    (token) => !GENERIC_PROVIDER_ROLE_WORDS.has(token),
  );
}

function roleTokensMatch(hintTokens: string[], fieldTokens: string[]): boolean {
  if (hintTokens.length === 0 || fieldTokens.length === 0) return false;
  return hintTokens.every((hintToken) =>
    fieldTokens.some(
      (fieldToken) =>
        fieldToken === hintToken ||
        fieldToken.includes(hintToken) ||
        hintToken.includes(fieldToken),
    ),
  );
}

export function employeeRoleMatchesHint(
  role: string | undefined,
  title: string | undefined,
  hint: string,
): boolean {
  const needle = hint.trim().toLowerCase();
  if (!needle) return false;
  const fields = [role, title]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());
  if (fields.length === 0) return false;

  if (
    fields.some((field) => field.includes(needle) || needle.includes(field))
  ) {
    return true;
  }

  const hintTokens = meaningfulRoleHintTokens(needle);
  if (hintTokens.length === 0) return false;

  return fields.some((field) =>
    roleTokensMatch(hintTokens, tokenizeEmployeeRoleText(field)),
  );
}

/** Extract specialist role/title from provider-rank prompts, e.g. "top rated cosmetologist". */
export function extractEmployeeRoleFromPrompt(prompt: string): string | null {
  if (!prompt?.trim() || !isProviderRankDiscoveryPrompt(prompt)) return null;

  const whoAreRanked = prompt.match(
    /\bwho\s+are\s+(?:the\s+)?(?:top|best|highest)[\s-]*(?:rated\s+)?([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\b/i,
  );
  if (whoAreRanked) {
    const term = normalizeEmployeeRoleTerm(whoAreRanked[1]);
    if (isEmployeeRoleOccupation(term)) return term;
    if (/\bspecialists?\b/i.test(term)) return term;
  }

  const ratedTail = prompt.match(
    /\b(?:top|best|highest)[\s-]*(?:rated)?\s+([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\s*$/i,
  );
  if (ratedTail) {
    const term = normalizeEmployeeRoleTerm(ratedTail[1]);
    if (isEmployeeRoleOccupation(term)) return term;
    if (/\bspecialists?\b/i.test(term)) return term;
  }

  const occupation = prompt.match(
    /\b(?:top|best|highest|recommended|suggested)\s+(?:rated\s+)?([a-z]+(?:ologist|iatrist|ician|ist)s?)\s*$/i,
  );
  if (occupation) {
    return normalizeEmployeeRoleTerm(occupation[1]);
  }

  const roleWord = prompt.match(PROVIDER_ROLE_WORD_PATTERN);
  if (
    roleWord &&
    /\b(?:top|best|highest|rated|recommended|suggested)\b/i.test(prompt)
  ) {
    const normalized = normalizeEmployeeRoleTerm(roleWord[0]);
    if (
      normalized !== 'specialist' &&
      normalized !== 'provider' &&
      !GENERIC_PROVIDER_ROLE_WORDS.has(normalized)
    ) {
      return normalized;
    }
  }

  return null;
}

export function enrichEmployeeRoleRankFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;
  const employeeRole = extractEmployeeRoleFromPrompt(prompt);
  if (!employeeRole) return params;

  const serviceCategoryHint =
    (typeof params.serviceCategory === 'string' &&
      params.serviceCategory.trim()) ||
    extractProviderRankServiceCategoryFromPrompt(prompt);
  if (serviceCategoryHint && GENERIC_PROVIDER_ROLE_WORDS.has(employeeRole)) {
    return params;
  }

  const next: Record<string, unknown> = { ...params, employeeRole };
  if (next.serviceCategory === employeeRole) {
    delete next.serviceCategory;
  }
  return next;
}
