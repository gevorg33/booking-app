export type PrivacyDeletePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'privacy_delete';
  rescueReason: 'privacy_delete';
};

export const CUSTOMER_PRIVACY_DELETE_CLASSIFIER_RULES = `- privacy_delete: MUTATE — signed-in customer requests GDPR erasure / right-to-be-forgotten for their own account. Triggers: delete|erase|remove|forget|anonymize + my + data|account|information|profile; delete my account; right to be forgotten. Requires session customerId. NOT explain_data_rights (read questions — "Can I delete my account data?"), NOT delete_customer_data / admin_delete_customer_data (dashboard admin erasure for a named customer).`;

export const PRIVACY_DELETE_PROMPTS: readonly PrivacyDeletePromptFixture[] = [
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

export const PRIVACY_DELETE_RESCUE_SCENARIOS = [
  {
    id: 'delete-steal-explain-data-rights',
    prompt: 'Delete my account',
    misclassifiedAction: 'explain_data_rights',
    expectedAction: 'privacy_delete' as const,
  },
  {
    id: 'delete-steal-unknown',
    prompt: 'Erase my personal data',
    misclassifiedAction: 'unknown',
    expectedAction: 'privacy_delete' as const,
  },
] as const;
