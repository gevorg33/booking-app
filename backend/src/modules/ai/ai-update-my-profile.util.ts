import {
  UPDATE_MY_PROFILE_PROMPTS,
  type UpdateMyProfileField,
  type UpdateMyProfilePromptFixture,
} from './ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-update-my-profile-multilingual.fixtures.js';

export const UPDATE_MY_PROFILE_INTENTS = ['update_my_profile'] as const;

export type UpdateMyProfileIntent = (typeof UPDATE_MY_PROFILE_INTENTS)[number];

export type ParsedUpdateMyProfile = {
  field: UpdateMyProfileField;
  name?: string;
  phone?: string;
  email?: string;
};

const UPDATE_MUTATE_CUE =
  /\b(change|update|edit|set|fix|correct)\b.{0,30}\bmy\b.{0,30}\b(name|phone|number|email|profile|details|account|contact)\b|\b(change|update|edit|set)\b.{0,20}\b(name|phone|email)\b/i;

const HOW_TO_CUE =
  /\b(how\s+do\s+i|how\s+can\s+i|how\s+to|where\s+do\s+i|walk\s+me\s+through|show\s+me\s+how)\b/i;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;

const HY_RU_UPDATE_CUE =
  /փոխել.{0,20}(հեռախոս|անուն|email)|թարմաց.{0,20}անուն|խմբագր.{0,20}email|изменить.{0,25}(номер|телефон|email|имя)|обновить.{0,20}(имя|email)/iu;

function matchUpdateMyProfileScenario(
  prompt: string,
): UpdateMyProfilePromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of UPDATE_MY_PROFILE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function normalizeProfilePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function inferUpdateMyProfileField(
  prompt: string,
): UpdateMyProfileField {
  const scenario = matchUpdateMyProfileScenario(prompt);
  if (scenario?.field) return scenario.field;
  if (/\b(email|contact\s+email)\b/i.test(prompt)) return 'email';
  if (/\b(phone|number|mobile|cell)\b/i.test(prompt)) return 'phone';
  if (/\bname\b/i.test(prompt)) return 'name';
  return 'profile';
}

export function extractProfileNameFromPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchUpdateMyProfileScenario(prompt);
  if (scenario?.name) return scenario.name;
  const match = prompt.match(
    /\b(?:name|called)\b.{0,10}\b(?:to|as)\b\s+(.+?)(?:$|[?.!])/i,
  );
  const value = match?.[1]?.trim();
  return value && value.length >= 2 ? value : undefined;
}

export function extractProfileEmailFromPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchUpdateMyProfileScenario(prompt);
  if (scenario?.email) return scenario.email.toLowerCase();
  return prompt.match(EMAIL_PATTERN)?.[0]?.trim().toLowerCase();
}

export function extractProfilePhoneFromPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchUpdateMyProfileScenario(prompt);
  if (scenario?.phone) return scenario.phone;
  const phoneRaw = prompt.match(PHONE_PATTERN)?.[0];
  if (!phoneRaw) return undefined;
  const normalized = normalizeProfilePhone(phoneRaw);
  return normalized.length >= 7 ? normalized : undefined;
}

export function isUpdateMyProfilePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchUpdateMyProfileScenario(text)) return true;
  if (HOW_TO_CUE.test(text)) return false;
  if (
    /\b(show|view|open|see|what(?:'s|\s+is))\b/i.test(text) &&
    /\b(profile|account)\b/i.test(text)
  ) {
    return false;
  }
  if (HY_RU_UPDATE_CUE.test(text)) return true;
  return UPDATE_MUTATE_CUE.test(text);
}

export function isUpdateMyProfileIntent(
  action: string,
): action is UpdateMyProfileIntent {
  return (UPDATE_MY_PROFILE_INTENTS as readonly string[]).includes(action);
}

/** e2e-bug.441 — a supplied value, trimmed, or undefined. */
function readProfileParam(
  params: Record<string, unknown>,
  key: 'name' | 'phone' | 'email',
): string | undefined {
  const raw = params[key];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/**
 * e2e-bug.441 — `params` was not read at all, so a caller that stated the new
 * name or phone had it silently dropped and only what the regexes found in the
 * message was ever saved.
 *
 * Two rules, both matching `parseConfigureOpenaiIntegrationFromPrompt` and
 * `parseClaimGiftCardBalanceFromPrompt`:
 *
 * 1. a supplied value **wins** over one extracted from the message — that is
 *    what "explicitly stated" means;
 * 2. explicit params satisfy the prompt gate on their own, so a value supplied
 *    against a message the regexes do not recognise is still honoured.
 */
export function parseUpdateMyProfileFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedUpdateMyProfile | null {
  const name = readProfileParam(params, 'name') ?? extractProfileNameFromPrompt(prompt);
  const phone =
    readProfileParam(params, 'phone') ?? extractProfilePhoneFromPrompt(prompt);
  const email =
    readProfileParam(params, 'email') ?? extractProfileEmailFromPrompt(prompt);

  const hasExplicitParams = Boolean(
    readProfileParam(params, 'name') ??
      readProfileParam(params, 'phone') ??
      readProfileParam(params, 'email'),
  );
  if (!isUpdateMyProfilePrompt(prompt) && !hasExplicitParams) return null;

  // The message decides the field when it names one; otherwise a supplied
  // value does, so "update my profile" + `phone` reports the phone rather than
  // the generic 'profile'.
  const inferred = inferUpdateMyProfileField(prompt);
  const field =
    inferred !== 'profile'
      ? inferred
      : name
        ? 'name'
        : phone
          ? 'phone'
          : email
            ? 'email'
            : inferred;

  return {
    field,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };
}

/** @deprecated Account has no profile-edit UI (e2e-bug.40); keep for legacy callers/tests. */
export function buildUpdateMyProfileNavigate(parsed: ParsedUpdateMyProfile): {
  path: 'account';
  query: Record<string, string>;
} {
  const query: Record<string, string> = { section: 'profile' };
  if (parsed.field && parsed.field !== 'profile') {
    query.field = parsed.field;
  }
  return { path: 'account', query };
}

/** e2e-bug.40 — email has no API and Account has no profile-edit section. */
export function buildUpdateMyProfileEmailUnsupportedSummary(
  parsed: ParsedUpdateMyProfile,
): string {
  const parts = [
    "Email changes aren't supported yet — your login email can't be updated in the app or chat.",
  ];
  if (parsed.email) {
    parts.push(`You mentioned ${parsed.email}.`);
  }
  parts.push(
    'I can update your name or phone number if you tell me the new value.',
  );
  return parts.join(' ');
}

export function buildUpdateMyProfileMissingValueSummary(
  parsed: ParsedUpdateMyProfile,
): string {
  if (parsed.field === 'phone') {
    return 'Tell me the new phone number to save (for example: "Change my phone to 555-123-4567").';
  }
  if (parsed.field === 'name') {
    return 'Tell me the new name to save (for example: "Update my name to Jane Doe").';
  }
  return "Say what to update — your name or phone number. Email changes aren't supported yet.";
}

export function buildUpdateMyProfileSummary(
  parsed: ParsedUpdateMyProfile,
): string {
  if (parsed.field === 'email' || parsed.email) {
    return buildUpdateMyProfileEmailUnsupportedSummary(parsed);
  }
  return buildUpdateMyProfileMissingValueSummary(parsed);
}

export function rescueUpdateMyProfileIntent(
  prompt: string,
  action: string,
): {
  action: 'update_my_profile';
  rescueReason: string;
} | null {
  if (action === 'update_my_profile') return null;
  if (!isUpdateMyProfilePrompt(prompt)) return null;
  return {
    action: 'update_my_profile',
    rescueReason: 'update_my_profile',
  };
}

export function enrichUpdateMyProfileParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseUpdateMyProfileFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    field: parsed.field,
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.phone ? { phone: parsed.phone } : {}),
    ...(parsed.email ? { email: parsed.email } : {}),
  };
}
