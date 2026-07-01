import {
  CUSTOMER_PRIVACY_EXPORT_CLASSIFIER_RULES,
  PRIVACY_EXPORT_PROMPTS,
} from './ai-privacy-export.fixtures.js';
import {
  CUSTOMER_PRIVACY_DELETE_CLASSIFIER_RULES,
  PRIVACY_DELETE_PROMPTS,
} from './ai-privacy-delete.fixtures.js';
import {
  isPrivacyDeletePrompt,
  isPrivacyExportPrompt,
  isPrivacySelfServiceMutateCommand,
} from './ai-customer-crm.util.js';
import { rescuePrivacyExportIntent } from './ai-privacy-export.util.js';
import { rescuePrivacyDeleteIntent } from './ai-privacy-delete.util.js';

export const CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES = `${CUSTOMER_PRIVACY_EXPORT_CLASSIFIER_RULES}
${CUSTOMER_PRIVACY_DELETE_CLASSIFIER_RULES}`;

export type PrivacyGdprCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'privacy_export' | 'privacy_delete';
  rescueReason: 'privacy_export' | 'privacy_delete';
};

export { PRIVACY_EXPORT_PROMPTS, PRIVACY_DELETE_PROMPTS };

export const PRIVACY_GDPR_CUSTOMER_PROMPTS: readonly PrivacyGdprCustomerPromptFixture[] =
  [...PRIVACY_EXPORT_PROMPTS, ...PRIVACY_DELETE_PROMPTS];

export function rescuePrivacyGdprCustomerIntent(
  prompt: string,
  action: string,
): {
  action: PrivacyGdprCustomerPromptFixture['expectedAction'];
  rescueReason: string;
} | null {
  return (
    rescuePrivacyDeleteIntent(prompt, action) ??
    rescuePrivacyExportIntent(prompt, action)
  );
}

export function detectPrivacyGdprCustomerAction(
  prompt: string,
): PrivacyGdprCustomerPromptFixture['expectedAction'] | null {
  if (!isPrivacySelfServiceMutateCommand(prompt)) return null;
  if (isPrivacyDeletePrompt(prompt)) return 'privacy_delete';
  if (isPrivacyExportPrompt(prompt)) return 'privacy_export';
  return null;
}
