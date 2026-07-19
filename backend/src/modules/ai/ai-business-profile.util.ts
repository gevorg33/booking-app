/** ai-cmd-dashboard-6.2 — business profile update + dashboard overview read. */

export const DASHBOARD_BUSINESS_PROFILE_READ_INTENTS = [
  'get_dashboard_overview',
] as const;

export const DASHBOARD_BUSINESS_PROFILE_MUTATE_INTENTS = [
  'update_business_profile',
] as const;

export const DASHBOARD_BUSINESS_PROFILE_INTENTS = [
  ...DASHBOARD_BUSINESS_PROFILE_READ_INTENTS,
  ...DASHBOARD_BUSINESS_PROFILE_MUTATE_INTENTS,
] as const;

export type BusinessProfileIntent =
  (typeof DASHBOARD_BUSINESS_PROFILE_INTENTS)[number];

const BUSINESS_PROFILE_INTENT_SET = new Set<string>(
  DASHBOARD_BUSINESS_PROFILE_INTENTS,
);

export function isBusinessProfileIntent(
  action: string,
): action is BusinessProfileIntent {
  return BUSINESS_PROFILE_INTENT_SET.has(action);
}

export function isGetDashboardOverviewPrompt(prompt: string): boolean {
  return /\b(dashboard\s+overview|business\s+overview|overview\s+(of|for)\s+(the|my)\s+business)\b/i.test(
    prompt,
  );
}

export function isUpdateBusinessProfilePrompt(prompt: string): boolean {
  return /\b(update|change|set)\b.*\b(business|salon|company)\b.*\b(name|address|phone|email|description)\b/i.test(
    prompt,
  );
}

export function rescueBusinessProfileIntent(
  prompt: string,
  action: string,
): { action: BusinessProfileIntent; rescueReason: string } | null {
  if (isBusinessProfileIntent(action)) return null;

  if (isGetDashboardOverviewPrompt(prompt)) {
    return { action: 'get_dashboard_overview', rescueReason: 'overview' };
  }
  if (isUpdateBusinessProfilePrompt(prompt)) {
    return {
      action: 'update_business_profile',
      rescueReason: 'update_profile',
    };
  }
  return null;
}
