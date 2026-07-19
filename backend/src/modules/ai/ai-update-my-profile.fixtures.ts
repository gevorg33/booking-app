export type UpdateMyProfileField = 'name' | 'phone' | 'email' | 'profile';

export type UpdateMyProfilePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'update_my_profile';
  rescueReason: 'update_my_profile';
  field?: UpdateMyProfileField;
  name?: string;
  phone?: string;
  email?: string;
};

export const CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES = `- update_my_profile: MUTATE — signed-in customer updates name or phone via PATCH me/profile when a new value is given. Email changes are not supported (say so plainly; do not navigate to Account profile editing — that UI does not exist). Triggers: "Change my phone number", "Update my name", "Edit my email", "Update my profile". Requires session customerId. NOT my_profile (read-only view), NOT guide_user_flow (how do I update), NOT privacy_export/privacy_delete, NOT dashboard update_customer.`;

export const UPDATE_MY_PROFILE_PROMPTS: readonly UpdateMyProfilePromptFixture[] =
  [
    {
      id: 'change-phone-customer',
      prompt: 'Change my phone number',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'update-name-customer',
      prompt: 'Update my name',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'name',
    },
    {
      id: 'edit-email-customer',
      prompt: 'Edit my email',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'email',
    },
    {
      id: 'change-phone-with-value-customer',
      prompt: 'Change my phone number to 555-123-4567',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
      phone: '5551234567',
    },
    {
      id: 'update-name-with-value-customer',
      prompt: 'Update my name to Jane Doe',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'name',
      name: 'Jane Doe',
    },
    {
      id: 'fix-email-customer',
      prompt: 'Fix my email address',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'email',
    },
    {
      id: 'set-profile-phone-customer',
      prompt: 'Set my profile phone number',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'correct-account-phone-customer',
      prompt: 'Correct my phone on my account',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'update-profile-details-customer',
      prompt: 'Update my profile details',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'profile',
    },
    {
      id: 'change-account-name-customer',
      prompt: 'Change my account name',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'name',
    },
    {
      id: 'edit-profile-phone-customer',
      prompt: 'Edit my phone in my profile',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'update-contact-email-customer',
      prompt: 'Update my contact email to jane@example.com',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'email',
      email: 'jane@example.com',
    },
  ];

export const UPDATE_MY_PROFILE_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-my-profile',
    prompt: 'Change my phone number',
    misclassifiedAction: 'my_profile',
    expectedAction: 'update_my_profile' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Update my name',
    misclassifiedAction: 'unknown',
    expectedAction: 'update_my_profile' as const,
  },
  {
    id: 'misclassified-guide-user-flow',
    prompt: 'Update my name to Jane Doe',
    misclassifiedAction: 'guide_user_flow',
    expectedAction: 'update_my_profile' as const,
  },
  {
    id: 'misclassified-my-profile-email',
    prompt: 'Edit my email',
    misclassifiedAction: 'my_profile',
    expectedAction: 'update_my_profile' as const,
  },
] as const;
