import {
  PRIVACY_EXPORT_PROMPTS,
  type PrivacyExportPromptFixture,
} from './ai-privacy-export.fixtures.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';
import {
  isPrivacyExportPrompt,
  isPrivacySelfServiceMutateCommand,
} from './ai-customer-crm.util.js';

export const PRIVACY_EXPORT_INTENTS = ['privacy_export'] as const;

export type PrivacyExportIntent = (typeof PRIVACY_EXPORT_INTENTS)[number];

export {
  CUSTOMER_PRIVACY_EXPORT_CLASSIFIER_RULES,
  PRIVACY_EXPORT_PROMPTS,
  PRIVACY_EXPORT_RESCUE_SCENARIOS,
} from './ai-privacy-export.fixtures.js';
export { PRIVACY_GDPR_MULTILINGUAL_CLASSIFIER_RULES } from './ai-privacy-gdpr-multilingual.fixtures.js';

function matchPrivacyExportScenario(
  prompt: string,
):
  | PrivacyExportPromptFixture
  | (typeof PRIVACY_GDPR_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of PRIVACY_EXPORT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of PRIVACY_GDPR_MULTILINGUAL_SCENARIOS) {
    if (scenario.expectedAction !== 'privacy_export') continue;
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isPrivacyExportIntent(
  action: string,
): action is PrivacyExportIntent {
  return (PRIVACY_EXPORT_INTENTS as readonly string[]).includes(action);
}

export function isPrivacyExportCustomerPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (!isPrivacySelfServiceMutateCommand(text)) return false;
  if (matchPrivacyExportScenario(text)) return true;
  return isPrivacyExportPrompt(text);
}

export function rescuePrivacyExportIntent(
  prompt: string,
  action: string,
): { action: PrivacyExportIntent; rescueReason: string } | null {
  if (isPrivacyExportIntent(action)) return null;
  if (!isPrivacyExportCustomerPrompt(prompt)) return null;
  return { action: 'privacy_export', rescueReason: 'privacy_export' };
}

export function buildPrivacyExportNavigate(): {
  path: 'account';
  query: { section: string; privacyAction: string };
} {
  return {
    path: 'account',
    query: { section: 'privacy', privacyAction: 'export' },
  };
}

export function buildPrivacyExportSignInNavigate(): {
  path: 'login';
  query: { reason: string };
} {
  return { path: 'login', query: { reason: 'privacy_export' } };
}
