export const PUSH_REGISTRATION_ACTIONS_INTENTS = [
  'register_customer_push',
  'explain_push_registration_status',
] as const;

export type PushRegistrationActionsIntent =
  (typeof PUSH_REGISTRATION_ACTIONS_INTENTS)[number];

export const PUSH_REGISTRATION_ACTIONS_CLASSIFIER_RULES = `- register_customer_push: MUTATE — register this device's native push token with the account after the OS permission prompt was granted (client supplies token/platform programmatically, not typed by the user). Follow-up step after enable_push_notifications once the client obtains a device token. NOT enable_push_notifications (opens the settings screen / triggers the OS prompt, does not itself register a token).
- explain_push_registration_status: READ — check whether push notifications are currently registered on this device. Triggers: "Is push notifications on for my phone?", "Did my push registration work?", "Check my push status". NOT enable_push_notifications (turns it on / navigates to settings), NOT explain_my_notifications (broader notification channel summary).`;

export type PushRegistrationActionsPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: PushRegistrationActionsIntent;
  platform?: 'ios' | 'android';
};

export const PUSH_REGISTRATION_ACTIONS_PROMPTS: readonly PushRegistrationActionsPromptFixture[] =
  [
    {
      id: 'check-push-status',
      prompt: 'Is push notifications on for my phone?',
      expectedAction: 'explain_push_registration_status',
    },
    {
      id: 'check-push-registration-worked',
      prompt: 'Did my push registration work?',
      expectedAction: 'explain_push_registration_status',
    },
  ];
