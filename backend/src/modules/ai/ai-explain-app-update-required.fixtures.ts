export type ExplainAppUpdateRequiredAspect =
  | 'why_update'
  | 'skip_nudge'
  | 'kill_switch'
  | 'update_required'
  | 'update_nudge'
  | 'how_it_works';

export type ExplainAppUpdateRequiredFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_app_update_required';
  rescueReason: 'app_update_gate';
  aspect?: ExplainAppUpdateRequiredAspect;
};

export const CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES = `- explain_app_update_required: READ — customer asks about the consumer app version gate (AppVersionGate / appGate*): why an update is required, kill switch block, soft update nudge, or skipping "Not now". Triggers: why must I update the app, skip this update, update required screen, app version blocked. NOT explain_offline_mode (network offline), NOT provider explain_app_update_gate (provider app), NOT generic OS update help.`;

export const EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS: readonly ExplainAppUpdateRequiredFixture[] =
  [
    {
      id: 'why-must-update-customer',
      prompt: 'Why must I update the app?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'why_update',
    },
    {
      id: 'skip-this-update-customer',
      prompt: 'Skip this update',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'skip_nudge',
    },
    {
      id: 'not-now-update-customer',
      prompt: 'What happens if I tap Not now on the update banner?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'skip_nudge',
    },
    {
      id: 'update-required-screen-customer',
      prompt: 'Why am I blocked on the update required screen?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'update_required',
    },
    {
      id: 'cant-book-old-version-customer',
      prompt: "Why can't I book on this app version?",
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'update_required',
    },
    {
      id: 'kill-switch-customer',
      prompt: 'Why does it say this app version is unavailable?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'kill_switch',
    },
    {
      id: 'temporarily-unavailable-customer',
      prompt: 'The app says temporarily unavailable — what does that mean?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'kill_switch',
    },
    {
      id: 'new-version-banner-customer',
      prompt: 'Why is there a banner about a newer version?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'update_nudge',
    },
    {
      id: 'dismiss-update-nudge-customer',
      prompt: 'Can I dismiss the update nudge?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'skip_nudge',
    },
    {
      id: 'app-store-update-customer',
      prompt: 'Why is it asking me to update in the app store?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'why_update',
    },
    {
      id: 'min-version-customer',
      prompt: 'What is the minimum supported app version?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'how_it_works',
    },
    {
      id: 'version-gate-how-customer',
      prompt: 'How does the app update gate work?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown',
    prompt: 'Why must I update the app?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_app_update_required' as const,
  },
  {
    id: 'misclassified-offline',
    prompt: 'Skip this update',
    misclassifiedAction: 'explain_offline_mode',
    expectedAction: 'explain_app_update_required' as const,
  },
  {
    id: 'misclassified-product-guide',
    prompt: 'Why am I blocked on the update required screen?',
    misclassifiedAction: 'product_guide',
    expectedAction: 'explain_app_update_required' as const,
  },
] as const;

export const EXPLAIN_APP_UPDATE_REQUIRED_BOUNDARY_PROMPTS = [
  {
    id: 'offline-mode',
    prompt: 'Why does it say offline?',
    surface: 'customer' as const,
  },
  {
    id: 'provider-update-gate',
    prompt: 'Why must I update the provider app?',
    surface: 'provider' as const,
  },
  {
    id: 'ios-system-update',
    prompt: 'How do I update iOS on my phone?',
    surface: 'customer' as const,
  },
] as const;
