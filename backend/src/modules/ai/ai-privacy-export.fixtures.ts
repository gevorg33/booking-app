export type PrivacyExportPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'privacy_export';
  rescueReason: 'privacy_export';
};

export const CUSTOMER_PRIVACY_EXPORT_CLASSIFIER_RULES = `- privacy_export: MUTATE — signed-in customer requests a GDPR personal-data export (download/portability). Triggers: export|download + my/personal + data|information|account|profile; GDPR export my data; get my data export. Requires session customerId. NOT explain_data_rights (how/can/what questions — "How can I export my personal data?"), NOT export_customer_data (dashboard admin exports a named customer's data).`;

export const PRIVACY_EXPORT_PROMPTS: readonly PrivacyExportPromptFixture[] = [
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

export const PRIVACY_EXPORT_RESCUE_SCENARIOS = [
  {
    id: 'export-steal-explain-data-rights',
    prompt: 'Export my personal data',
    misclassifiedAction: 'explain_data_rights',
    expectedAction: 'privacy_export' as const,
  },
  {
    id: 'export-steal-unknown',
    prompt: 'Download my data',
    misclassifiedAction: 'unknown',
    expectedAction: 'privacy_export' as const,
  },
] as const;
