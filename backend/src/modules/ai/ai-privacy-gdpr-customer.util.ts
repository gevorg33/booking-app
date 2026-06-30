import {
  isPrivacyDeletePrompt,
  isPrivacyExportPrompt,
  isPrivacySelfServiceMutateCommand,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';

export const CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES = `- privacy_export: MUTATE — signed-in customer requests a GDPR personal-data export (download/portability). Triggers: export|download + my/personal + data|information|account|profile; GDPR export my data; get my data export. Requires session customerId. NOT explain_data_rights (how/can/what questions — "How can I export my personal data?"), NOT export_customer_data (dashboard admin exports a named customer's data).
- privacy_delete: MUTATE — signed-in customer requests GDPR erasure / right-to-be-forgotten for their own account. Triggers: delete|erase|remove|forget|anonymize + my + data|account|information|profile; delete my account; right to be forgotten. Requires session customerId. NOT explain_data_rights (read questions — "Can I delete my account data?"), NOT delete_customer_data / admin_delete_customer_data (dashboard admin erasure for a named customer).`;

export type PrivacyGdprCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'privacy_export' | 'privacy_delete';
  rescueReason: 'privacy_export' | 'privacy_delete';
};

export const PRIVACY_EXPORT_PROMPTS: readonly PrivacyGdprCustomerPromptFixture[] =
  [
    {
      id: 'export-personal-data-customer',
      prompt: 'Export my personal data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'download-my-data-customer',
      prompt: 'Download my data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'export-account-data-customer',
      prompt: 'Export my account data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'download-copy-information-customer',
      prompt: 'Download a copy of my information',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'gdpr-export-data-customer',
      prompt: 'GDPR export my data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'give-me-data-export-customer',
      prompt: 'Give me my data export',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'want-export-personal-info-customer',
      prompt: 'I want to export my personal information',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'export-all-data-customer',
      prompt: 'Export all my data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'download-personal-data-customer',
      prompt: 'Download my personal data please',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'export-profile-data-customer',
      prompt: 'Export my profile data',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'get-data-export-customer',
      prompt: 'Get my data export',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
    {
      id: 'send-data-download-customer',
      prompt: 'Send me my data download',
      surface: 'customer',
      expectedAction: 'privacy_export',
      rescueReason: 'privacy_export',
    },
  ];

export const PRIVACY_DELETE_PROMPTS: readonly PrivacyGdprCustomerPromptFixture[] =
  [
    {
      id: 'delete-account-data-customer',
      prompt: 'Delete my account data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'delete-my-account-customer',
      prompt: 'Delete my account',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'erase-personal-data-customer',
      prompt: 'Erase my personal data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'remove-my-account-customer',
      prompt: 'Remove my account',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'delete-personal-information-customer',
      prompt: 'Delete my personal information',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'gdpr-delete-data-customer',
      prompt: 'GDPR delete my data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'right-to-be-forgotten-customer',
      prompt: 'Right to be forgotten — delete my data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'anonymize-account-customer',
      prompt: 'Anonymize my account',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'forget-personal-data-customer',
      prompt: 'Forget my personal data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'delete-all-data-customer',
      prompt: 'Delete all my data',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'remove-data-permanently-customer',
      prompt: 'Remove my data permanently',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
    {
      id: 'want-delete-account-customer',
      prompt: 'I want to delete my account',
      surface: 'customer',
      expectedAction: 'privacy_delete',
      rescueReason: 'privacy_delete',
    },
  ];

export const PRIVACY_GDPR_CUSTOMER_PROMPTS: readonly PrivacyGdprCustomerPromptFixture[] =
  [...PRIVACY_EXPORT_PROMPTS, ...PRIVACY_DELETE_PROMPTS];

const PRIVACY_GDPR_ACTIONS = new Set<PrivacyGdprCustomerPromptFixture['expectedAction']>(
  ['privacy_export', 'privacy_delete'],
);

export function rescuePrivacyGdprCustomerIntent(
  prompt: string,
  action: string,
): {
  action: PrivacyGdprCustomerPromptFixture['expectedAction'];
  rescueReason: string;
} | null {
  const rescued = rescueCustomerCrmIntent(prompt, action);
  if (rescued && PRIVACY_GDPR_ACTIONS.has(rescued.action as PrivacyGdprCustomerPromptFixture['expectedAction'])) {
    return {
      action: rescued.action as PrivacyGdprCustomerPromptFixture['expectedAction'],
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectPrivacyGdprCustomerAction(
  prompt: string,
): PrivacyGdprCustomerPromptFixture['expectedAction'] | null {
  if (!isPrivacySelfServiceMutateCommand(prompt)) return null;
  if (isPrivacyDeletePrompt(prompt)) return 'privacy_delete';
  if (isPrivacyExportPrompt(prompt)) return 'privacy_export';
  return null;
}
