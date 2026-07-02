export type ExplainAnalyticsConsentAspect =
  | 'why_consent'
  | 'turn_off_tracking'
  | 'what_is_tracked'
  | 'consent_prompt'
  | 'how_it_works';

export type ExplainAnalyticsConsentFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_analytics_consent';
  rescueReason: 'analytics_consent';
  aspect?: ExplainAnalyticsConsentAspect;
};

export const CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES = `- explain_analytics_consent: READ — customer asks about the consumer app analytics consent banner (analyticsConsent* / AppAnalyticsBootstrap): why usage tracking is requested, what is collected, or how to decline/turn off tracking. Triggers: why are you asking about analytics, turn off usage tracking, anonymous usage data, decline analytics. NOT explain_push_permission (OS push), NOT dashboard analytics reports, NOT provider app analytics, NOT generic website cookie policy unrelated to this app banner.`;

export const EXPLAIN_ANALYTICS_CONSENT_PROMPTS: readonly ExplainAnalyticsConsentFixture[] =
  [
    {
      id: 'why-asking-analytics-customer',
      prompt: 'Why are you asking about analytics?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'why_consent',
    },
    {
      id: 'turn-off-tracking-customer',
      prompt: 'Turn off usage tracking',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'turn_off_tracking',
    },
    {
      id: 'stop-tracking-customer',
      prompt: 'Stop tracking my app usage',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'turn_off_tracking',
    },
    {
      id: 'what-data-collected-customer',
      prompt: 'What usage data do you collect?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'what_is_tracked',
    },
    {
      id: 'anonymous-analytics-customer',
      prompt: 'Is analytics anonymous?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'what_is_tracked',
    },
    {
      id: 'decline-what-happens-customer',
      prompt: 'What happens if I tap Decline on analytics?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'turn_off_tracking',
    },
    {
      id: 'analytics-banner-customer',
      prompt: 'Why is there an analytics banner at the bottom?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'consent_prompt',
    },
    {
      id: 'personal-data-customer',
      prompt: 'Do you collect personal data in analytics?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'what_is_tracked',
    },
    {
      id: 'change-choice-later-customer',
      prompt: 'Can I change my analytics choice later?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'how_it_works',
    },
    {
      id: 'usage-tracking-meaning-customer',
      prompt: 'What is usage tracking?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'why_consent',
    },
    {
      id: 'accept-analytics-customer',
      prompt: 'What does Accept on the analytics prompt do?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'consent_prompt',
    },
    {
      id: 'how-consent-works-customer',
      prompt: 'How does analytics consent work?',
      surface: 'customer',
      expectedAction: 'explain_analytics_consent',
      rescueReason: 'analytics_consent',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown',
    prompt: 'Why are you asking about analytics?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_analytics_consent' as const,
  },
  {
    id: 'misclassified-push',
    prompt: 'Turn off usage tracking',
    misclassifiedAction: 'explain_push_permission',
    expectedAction: 'explain_analytics_consent' as const,
  },
  {
    id: 'misclassified-product-guide',
    prompt: 'What usage data do you collect?',
    misclassifiedAction: 'product_guide',
    expectedAction: 'explain_analytics_consent' as const,
  },
] as const;

export const EXPLAIN_ANALYTICS_CONSENT_BOUNDARY_PROMPTS = [
  {
    id: 'push-permission',
    prompt: "Why didn't I get a notification?",
    surface: 'customer' as const,
  },
  {
    id: 'dashboard-analytics',
    prompt: 'Show me salon revenue analytics',
    surface: 'dashboard' as const,
  },
  {
    id: 'provider-analytics',
    prompt: 'Why is the provider app tracking my shifts?',
    surface: 'provider' as const,
  },
] as const;
