import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from './ai-switch-salon-tenant-multilingual.fixtures.js';
import {
  SWITCH_SALON_TENANT_PROMPTS,
  type SwitchSalonTenantPromptFixture,
} from './ai-switch-salon-tenant.fixtures.js';
import {
  extractSalonHintFromPrompt,
  normalizeSalonMatchText,
} from './ai-saved-salons.shared.js';

export const SWITCH_SALON_TENANT_INTENTS = ['switch_salon_tenant'] as const;

export type SwitchSalonTenantIntent =
  (typeof SWITCH_SALON_TENANT_INTENTS)[number];

export {
  CUSTOMER_SWITCH_SALON_TENANT_CLASSIFIER_RULES,
  SWITCH_SALON_TENANT_PROMPTS,
  SWITCH_SALON_TENANT_RESCUE_SCENARIOS,
} from './ai-switch-salon-tenant.fixtures.js';
export { SWITCH_SALON_TENANT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-switch-salon-tenant-multilingual.fixtures.js';

const SWITCH_SALON_CUE =
  /\b(go back to|switch to|open|return to|take me to|change salon to|jump to|back to|switch tenant to|переключ|вернуться|открыть|վերադառն|փոխել.{0,12}salon)\b/i;

const GENERIC_OTHER_SALON_CUE =
  /\b(other salon|salon i visited|salon i booked|another salon|usual salon)\b/i;

function matchSwitchSalonTenantScenario(
  prompt: string,
):
  | SwitchSalonTenantPromptFixture
  | (typeof SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of SWITCH_SALON_TENANT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasSwitchSalonTenantCue(prompt: string): boolean {
  if (matchSwitchSalonTenantScenario(prompt)) return true;
  if (
    SWITCH_SALON_CUE.test(prompt) &&
    /\b(salon|spa|tenant|demo-|glow|bliss)\b/i.test(prompt)
  ) {
    return true;
  }
  return GENERIC_OTHER_SALON_CUE.test(prompt);
}

const SAVED_SALON_LIST_ONLY_CUE =
  /\b(show|list|recent|saved|visited|pinned|remembered|where are).{0,24}\b(salons?|places?|tenants?)\b/i;

export function isSwitchSalonTenantPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (SAVED_SALON_LIST_ONLY_CUE.test(text) && !SWITCH_SALON_CUE.test(text)) {
    return false;
  }
  if (matchSwitchSalonTenantScenario(text)) return true;
  if (SWITCH_SALON_CUE.test(text)) return true;
  return GENERIC_OTHER_SALON_CUE.test(text);
}

export function isSwitchSalonTenantIntent(
  action: string,
): action is SwitchSalonTenantIntent {
  return (SWITCH_SALON_TENANT_INTENTS as readonly string[]).includes(action);
}

export interface ParsedSwitchSalonTenant {
  salonName?: string;
  salonSlug?: string;
}

export function parseSwitchSalonTenantFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSwitchSalonTenant | null {
  if (!isSwitchSalonTenantPrompt(prompt)) return null;

  const scenario = matchSwitchSalonTenantScenario(prompt);
  const salonName =
    (typeof params.salonName === 'string'
      ? params.salonName.trim()
      : undefined) ??
    scenario?.salonName ??
    extractSalonHintFromPrompt(prompt);
  const salonSlug =
    (typeof params.salonSlug === 'string'
      ? params.salonSlug.trim()
      : undefined) ??
    (scenario && 'salonSlug' in scenario ? scenario.salonSlug : undefined) ??
    (salonName && /^[a-z0-9-]+$/i.test(salonName) ? salonName : undefined);

  return {
    ...(salonName ? { salonName } : {}),
    ...(salonSlug ? { salonSlug: normalizeSalonMatchText(salonSlug) } : {}),
  };
}

export function rescueSwitchSalonTenantIntent(
  prompt: string,
  action: string,
): { action: SwitchSalonTenantIntent; rescueReason: string } | null {
  if (isSwitchSalonTenantIntent(action)) return null;
  if (!parseSwitchSalonTenantFromPrompt(prompt)) return null;
  return {
    action: 'switch_salon_tenant',
    rescueReason: 'switch_salon_tenant',
  };
}

export function buildSwitchSalonTenantNavigate(targetSlug: string): {
  path: 'salon';
  query: { slug: string };
} {
  return { path: 'salon', query: { slug: targetSlug } };
}

export function buildSwitchSalonTenantPickerNavigate(): {
  path: 'tenant_switch';
  query: Record<string, string>;
} {
  return { path: 'tenant_switch', query: {} };
}
