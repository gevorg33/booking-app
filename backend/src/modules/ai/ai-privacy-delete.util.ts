import {
  PRIVACY_DELETE_PROMPTS,
  type PrivacyDeletePromptFixture,
} from './ai-privacy-delete.fixtures.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from './ai-privacy-gdpr-multilingual.fixtures.js';
import {
  isPrivacyDeletePrompt,
  isPrivacySelfServiceMutateCommand,
} from './ai-customer-crm.util.js';

export const PRIVACY_DELETE_INTENTS = ['privacy_delete'] as const;

export type PrivacyDeleteIntent = (typeof PRIVACY_DELETE_INTENTS)[number];

export {
  CUSTOMER_PRIVACY_DELETE_CLASSIFIER_RULES,
  PRIVACY_DELETE_PROMPTS,
  PRIVACY_DELETE_RESCUE_SCENARIOS,
} from './ai-privacy-delete.fixtures.js';

function matchPrivacyDeleteScenario(
  prompt: string,
):
  | PrivacyDeletePromptFixture
  | (typeof PRIVACY_GDPR_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of PRIVACY_DELETE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of PRIVACY_GDPR_MULTILINGUAL_SCENARIOS) {
    if (scenario.expectedAction !== 'privacy_delete') continue;
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isPrivacyDeleteIntent(
  action: string,
): action is PrivacyDeleteIntent {
  return (PRIVACY_DELETE_INTENTS as readonly string[]).includes(action);
}

export function isPrivacyDeleteCustomerPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (!isPrivacySelfServiceMutateCommand(text)) return false;
  if (matchPrivacyDeleteScenario(text)) return true;
  return isPrivacyDeletePrompt(text);
}

export function rescuePrivacyDeleteIntent(
  prompt: string,
  action: string,
): { action: PrivacyDeleteIntent; rescueReason: string } | null {
  if (isPrivacyDeleteIntent(action)) return null;
  if (!isPrivacyDeleteCustomerPrompt(prompt)) return null;
  return { action: 'privacy_delete', rescueReason: 'privacy_delete' };
}

export function buildPrivacyDeleteNavigate(): {
  path: 'account';
  query: { section: string; privacyAction: string };
} {
  return {
    path: 'account',
    query: { section: 'privacy', privacyAction: 'delete' },
  };
}

export function buildPrivacyDeleteSignInNavigate(): {
  path: 'login';
  query: { reason: string };
} {
  return { path: 'login', query: { reason: 'privacy_delete' } };
}

/** Bare affirmative after a privacy_delete preview (e2e-bug.84 turn 2). */
export function isPrivacyDeleteAffirmativePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  return /^(yes|y|yeah|yep|confirm|confirmed|go\s+ahead|do\s+it|proceed|ok|okay|sure|please\s+do|absolutely)[.!]?$/iu.test(
    text,
  );
}

export function isPrivacyDeletePendingParams(
  params: Record<string, unknown> = {},
): boolean {
  return (
    params.privacyDeletePending === true ||
    params.privacyDeletePending === 'true' ||
    params.requiresConfirmation === true ||
    params.requiresConfirmation === 'true' ||
    params.pendingAction === 'privacy_delete'
  );
}

/**
 * e2e-bug.84 — only execute when confirm is explicit (classifier/session) or
 * the customer affirmed after a pending preview.
 */
export function isPrivacyDeleteConfirmed(
  params: Record<string, unknown> = {},
): boolean {
  return params.confirm === true;
}

export function enrichPrivacyDeleteConfirmFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  if (params.confirm === true) return params;
  if (
    isPrivacyDeletePendingParams(params) &&
    isPrivacyDeleteAffirmativePrompt(prompt)
  ) {
    return { ...params, confirm: true };
  }
  return params;
}

/**
 * Rescue a bare "yes" onto privacy_delete when the prior turn left a pending
 * erasure preview in session/params.
 */
export function rescuePrivacyDeleteConfirmIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown> = {},
): {
  action: PrivacyDeleteIntent;
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isPrivacyDeletePendingParams(params)) return null;
  if (!isPrivacyDeleteAffirmativePrompt(prompt)) return null;
  if (isPrivacyDeleteIntent(action) && params.confirm === true) return null;
  return {
    action: 'privacy_delete',
    rescueReason: 'privacy_delete_confirm',
    params: { ...params, confirm: true },
  };
}
