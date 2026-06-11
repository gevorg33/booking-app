export type BillingLoyaltyDashboardPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: 'open_billing_settings' | 'summarize_loyalty_program';
  expectedParams?: Record<string, unknown>;
};

export const OPEN_BILLING_SETTINGS_PROMPTS = [
  {
    id: 'billing-open-settings-en',
    prompt: 'Open billing settings',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-manage-subscription-en',
    prompt: 'Manage subscription and billing portal',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-what-plan-en',
    prompt: 'What plan am I on',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-upgrade-plan-en',
    prompt: 'Upgrade my subscription plan',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-payment-method-en',
    prompt: 'Open invoice and payment method settings',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-portal-link-en',
    prompt: 'Show billing portal link',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-downgrade-en',
    prompt: 'Downgrade subscription plan in billing',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-manage-seats-en',
    prompt: 'Manage billing and seat limits',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-subscription-settings-en',
    prompt: 'Open subscription settings',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-view-payment-en',
    prompt: 'View payment method settings',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'billing-access-portal-en',
    prompt: 'Access billing portal for our account',
    expectedAction: 'open_billing_settings' as const,
  },
] as const;

export const SUMMARIZE_LOYALTY_PROGRAM_PROMPTS = [
  {
    id: 'loyalty-summarize-en',
    prompt: 'Summarize loyalty program',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-how-works-en',
    prompt: 'How does loyalty work',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-explain-settings-en',
    prompt: 'Explain loyalty program settings',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-overview-en',
    prompt: 'Loyalty points overview for the business',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-summary-en',
    prompt: 'Give me loyalty program summary',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-earn-points-en',
    prompt: 'How do customers earn loyalty points',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-rewards-setup-en',
    prompt: 'Summarize our loyalty rewards setup',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-explain-points-en',
    prompt: 'Explain how loyalty points work here',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-program-overview-en',
    prompt: 'Loyalty program overview',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-rules-en',
    prompt: 'What are the loyalty program rules',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'loyalty-manager-summary-en',
    prompt: 'Summarize loyalty settings for managers',
    expectedAction: 'summarize_loyalty_program' as const,
  },
] as const;

export const BILLING_LOYALTY_RESCUE_SCENARIOS = [
  {
    id: 'misclass-billing-as-plan-limits',
    prompt: 'Open billing settings',
    misclassifiedAction: 'explain_plan_limits',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'misclass-loyalty-as-balance',
    prompt: 'Summarize loyalty program',
    misclassifiedAction: 'loyalty_points_balance',
    expectedAction: 'summarize_loyalty_program' as const,
  },
  {
    id: 'unknown-billing',
    prompt: 'Manage subscription and billing portal',
    misclassifiedAction: 'unknown',
    expectedAction: 'open_billing_settings' as const,
  },
  {
    id: 'unknown-loyalty',
    prompt: 'How does loyalty work',
    misclassifiedAction: 'unknown',
    expectedAction: 'summarize_loyalty_program' as const,
  },
] as const;

export const BILLING_LOYALTY_EN_SCENARIO_IDS = [
  ...OPEN_BILLING_SETTINGS_PROMPTS.map((row) => row.id),
  ...SUMMARIZE_LOYALTY_PROGRAM_PROMPTS.map((row) => row.id),
] as const;

export const BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES: BillingLoyaltyDashboardPromptFixture[] =
  [...OPEN_BILLING_SETTINGS_PROMPTS, ...SUMMARIZE_LOYALTY_PROGRAM_PROMPTS];
