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

export function parseUpdateMyProfileFromPrompt(
  prompt: string,
): ParsedUpdateMyProfile | null {
  if (!isUpdateMyProfilePrompt(prompt)) return null;
  const field = inferUpdateMyProfileField(prompt);
  return {
    field,
    ...(extractProfileNameFromPrompt(prompt)
      ? { name: extractProfileNameFromPrompt(prompt) }
      : {}),
    ...(extractProfilePhoneFromPrompt(prompt)
      ? { phone: extractProfilePhoneFromPrompt(prompt) }
      : {}),
    ...(extractProfileEmailFromPrompt(prompt)
      ? { email: extractProfileEmailFromPrompt(prompt) }
      : {}),
  };
}

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

export function buildUpdateMyProfileSummary(
  parsed: ParsedUpdateMyProfile,
): string {
  const fieldLabel =
    parsed.field === 'phone'
      ? 'phone number'
      : parsed.field === 'email'
        ? 'email'
        : parsed.field === 'name'
          ? 'name'
          : 'profile details';
  const parts = [
    `Open Account to update your ${fieldLabel}.`,
    'Profile edits are saved in the app — chat cannot persist profile changes until the profile API ships.',
  ];
  if (parsed.name) parts.push(`You mentioned the name "${parsed.name}".`);
  if (parsed.phone) parts.push(`You mentioned phone ${parsed.phone}.`);
  if (parsed.email) parts.push(`You mentioned email ${parsed.email}.`);
  return parts.join(' ');
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
  const parsed = parseUpdateMyProfileFromPrompt(prompt);
  if (!parsed) return params;
  return {
    ...params,
    field: parsed.field,
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.phone ? { phone: parsed.phone } : {}),
    ...(parsed.email ? { email: parsed.email } : {}),
  };
}
