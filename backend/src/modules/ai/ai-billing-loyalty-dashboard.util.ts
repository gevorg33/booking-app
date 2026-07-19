/** Dashboard billing + loyalty read intents (ai-cmd-ext-2.9–2.10). */

import { BILLING_LOYALTY_MULTILINGUAL_SCENARIOS } from './ai-billing-loyalty-dashboard-multilingual.fixtures.js';
import {
  isListPackagesPrompt,
  isListSubscriptionPlansPrompt,
} from './ai-catalog.util.js';
import { isExplainMySubscriptionPrompt } from './ai-explain-my-subscription.util.js';
import {
  isSuggestUpgradePrompt,
  isToggleAnnualBillingPrompt,
} from './ai-marketing-growth.util.js';
import { isConfigureLoyaltySettingsPrompt } from './ai-configure-loyalty-settings.util.js';

export const BILLING_LOYALTY_DASHBOARD_READ_INTENTS = [
  'open_billing_settings',
  'summarize_loyalty_program',
] as const;

export const BILLING_LOYALTY_DASHBOARD_INTENTS = [
  ...BILLING_LOYALTY_DASHBOARD_READ_INTENTS,
] as const;

export type BillingLoyaltyDashboardIntent =
  (typeof BILLING_LOYALTY_DASHBOARD_INTENTS)[number];

export const BILLING_LOYALTY_DASHBOARD_CLASSIFIER_RULES = `- open_billing_settings: READ — explain current subscription plan, billing portal link, and seat limits. Use for "open billing settings", "what plan am I on", "manage subscription". Dashboard/business SaaS billing only. NOT explain_my_subscription (customer "visits left on my plan" / membership credits), NOT explain_plan_limits alone when user asks to open/manage billing UI.
- summarize_loyalty_program: READ — summarize business loyalty program settings and enrolled customer counts. Use for "how does loyalty work", "summarize loyalty program", "loyalty points overview". NOT loyalty_points_balance (customer self-service balance).`;

export const BILLING_LOYALTY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian dashboard billing + loyalty (ai-cmd-ext-2.9–2.10):
  - open_billing_settings: hy «բացիր billing settings», «ինչ plan ենք», «կառավարիր subscription portal»; ru «открой billing settings», «какой у нас plan», «управляй subscription portal». NOT explain_plan_limits when user wants billing UI.
  - summarize_loyalty_program: hy «ամփոփիր loyalty program-ը», «ինչպես է աշխատում loyalty-ն»; ru «суммируй loyalty program», «как работает loyalty». NOT loyalty_points_balance (customer balance).`;

export function isBillingLoyaltyDashboardIntent(
  action: string,
): action is BillingLoyaltyDashboardIntent {
  return (BILLING_LOYALTY_DASHBOARD_INTENTS as readonly string[]).includes(
    action,
  );
}

function matchLocale(prompt: string, pattern: RegExp): boolean {
  return pattern.test(prompt) || pattern.test(prompt.toLowerCase());
}

export function isOpenBillingSettingsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isSummarizeLoyaltyProgramPrompt(prompt)) return false;
  // e2e-bug.129 — "How many visits left on my plan?" is customer membership
  // explain, not dashboard billing portal ("my plan" alone is too broad).
  if (isExplainMySubscriptionPrompt(prompt)) return false;
  if (isListSubscriptionPlansPrompt(prompt) || isListPackagesPrompt(prompt)) {
    return false;
  }
  if (isSuggestUpgradePrompt(prompt) || isToggleAnnualBillingPrompt(prompt)) {
    return false;
  }
  if (/(?:собери|сбор|зачист|հավաքիր|ավլիր)/iu.test(prompt)) return false;

  if (
    matchLocale(
      lower,
      /(?:բացիր|կառավարիր|բիլինգ|բաժանորդագրություն|վճարում)/u,
    ) &&
    /(?:billing|subscription|plan|portal|invoice|payment|բաժանորդագրություն|վճարում)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:открой|управля|биллинг|подписк|платеж|счет)/u) &&
    /(?:billing|subscription|plan|portal|invoice|payment|подписк|платеж)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\bwhat\s+plan\s+(?:am\s+I\s+on|are\s+we\s+on)\b/i.test(prompt)) {
    return true;
  }
  // Business SaaS plan — require billing/portal context, not bare "my plan"
  // (customer membership visits-left phrasing).
  if (
    /\b(?:current|my)\s+(?:subscription\s+)?plan\b/i.test(prompt) &&
    /\b(?:billing|portal|seats?|invoice|saas|stripe|upgrade|downgrade|settings)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return (
    /\b(?:billing|subscription|plan|invoice|payment\s+method)\b/i.test(
      prompt,
    ) &&
    /\b(?:open|manage|settings|portal|upgrade|downgrade|view|access|show)\b/i.test(
      prompt,
    )
  );
}

export function isSummarizeLoyaltyProgramPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isConfigureLoyaltySettingsPrompt(prompt)) return false;
  if (/\b(?:my\s+points|balance|redeem)\b/i.test(prompt)) return false;

  if (
    matchLocale(lower, /(?:loyalty|լոյալթի|лояльн)/u) &&
    matchLocale(
      lower,
      /(?:program|settings|overview|summarize|summary|explain|rules|earn|rewards|աշխատում|ամփոփ|կանոն|работает|суммируй|настройк|програм|обзор)/u,
    )
  ) {
    return true;
  }

  return (
    /\bloyalty\b/i.test(prompt) &&
    (/\b(?:program|settings|overview|summarize|summary|explain|rules|earn|rewards)\b/i.test(
      prompt,
    ) ||
      /\bhow\s+(?:does\s+loyalty|do\s+customers\s+earn)\b/i.test(prompt))
  );
}

function matchBillingLoyaltyMultilingualScenario(prompt: string) {
  for (const scenario of BILLING_LOYALTY_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt === prompt) return scenario;
  }
  return null;
}

export function rescueBillingLoyaltyDashboardIntent(
  prompt: string,
  action: string,
): { action: BillingLoyaltyDashboardIntent; rescueReason: string } | null {
  const multilingual = matchBillingLoyaltyMultilingualScenario(prompt);
  if (multilingual && action !== multilingual.expectedAction) {
    return {
      action: multilingual.expectedAction,
      rescueReason: multilingual.rescueReason,
    };
  }

  if (
    isOpenBillingSettingsPrompt(prompt) &&
    action !== 'open_billing_settings'
  ) {
    return {
      action: 'open_billing_settings',
      rescueReason: 'open_billing_settings',
    };
  }
  if (
    isSummarizeLoyaltyProgramPrompt(prompt) &&
    action !== 'summarize_loyalty_program'
  ) {
    return {
      action: 'summarize_loyalty_program',
      rescueReason: 'summarize_loyalty_program',
    };
  }
  return null;
}

export function enrichBillingLoyaltyRescueParams(
  _action: BillingLoyaltyDashboardIntent,
  params: Record<string, unknown>,
  _prompt: string,
): Record<string, unknown> {
  return { ...params };
}
