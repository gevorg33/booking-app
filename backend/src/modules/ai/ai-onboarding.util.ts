/** ai-cmd-dashboard-6.2 — dashboard onboarding wizard AI ops. */

export const DASHBOARD_ONBOARDING_READ_INTENTS = [
  'explain_onboarding_status',
  'recommend_catalog',
] as const;

export const DASHBOARD_ONBOARDING_MUTATE_INTENTS = [
  'set_business_type',
  'apply_onboarding_catalog',
  'apply_onboarding_schedule',
  'skip_onboarding_schedule',
  'apply_onboarding_playbook',
  'complete_onboarding',
] as const;

export const DASHBOARD_ONBOARDING_INTENTS = [
  ...DASHBOARD_ONBOARDING_READ_INTENTS,
  ...DASHBOARD_ONBOARDING_MUTATE_INTENTS,
] as const;

export type OnboardingIntent = (typeof DASHBOARD_ONBOARDING_INTENTS)[number];

const ONBOARDING_INTENT_SET = new Set<string>(DASHBOARD_ONBOARDING_INTENTS);

export function isOnboardingIntent(action: string): action is OnboardingIntent {
  return ONBOARDING_INTENT_SET.has(action);
}

export function isExplainOnboardingStatusPrompt(prompt: string): boolean {
  return /\b(onboarding\s+status|what\s+step\s+(of|in)\s+onboarding|setup\s+status|which\s+business\s+types?)\b/i.test(
    prompt,
  );
}

export function isSetBusinessTypePrompt(prompt: string): boolean {
  return /\bset\s+(my\s+|the\s+)?business\s+type\b|\bwe\s+are\s+a\b|\bi\s+run\s+a\b/i.test(
    prompt,
  );
}

export function isRecommendCatalogPrompt(prompt: string): boolean {
  return /\b(recommend|suggest)\b.*\b(catalog|services|menu)\b/i.test(prompt);
}

export function isApplyOnboardingCatalogPrompt(prompt: string): boolean {
  return /\bapply\b.*\b(recommended\s+)?catalog\b|\buse\s+the\s+recommended\s+catalog\b/i.test(
    prompt,
  );
}

export function isApplyOnboardingSchedulePrompt(prompt: string): boolean {
  return /\bapply\b.*\b(the\s+)?default\s+schedule\b/i.test(prompt) ||
    /\bapply\b.*\bschedule\b.*\bonboarding\b/i.test(prompt);
}

export function isSkipOnboardingSchedulePrompt(prompt: string): boolean {
  return /\bskip\b.*\bschedule\b/i.test(prompt);
}

export function isApplyOnboardingPlaybookPrompt(prompt: string): boolean {
  return /\bapply\b.*\b(vertical\s+)?playbook\b/i.test(prompt);
}

export function isCompleteOnboardingPrompt(prompt: string): boolean {
  return /\b(complete|finish)\b.*\bonboarding\b/i.test(prompt);
}

export function rescueOnboardingIntent(
  prompt: string,
  action: string,
): { action: OnboardingIntent; rescueReason: string } | null {
  if (isOnboardingIntent(action)) return null;

  if (isCompleteOnboardingPrompt(prompt)) {
    return { action: 'complete_onboarding', rescueReason: 'complete' };
  }
  if (isApplyOnboardingPlaybookPrompt(prompt)) {
    return { action: 'apply_onboarding_playbook', rescueReason: 'playbook' };
  }
  if (isSkipOnboardingSchedulePrompt(prompt)) {
    return {
      action: 'skip_onboarding_schedule',
      rescueReason: 'skip_schedule',
    };
  }
  if (isApplyOnboardingSchedulePrompt(prompt)) {
    return {
      action: 'apply_onboarding_schedule',
      rescueReason: 'apply_schedule',
    };
  }
  if (isApplyOnboardingCatalogPrompt(prompt)) {
    return { action: 'apply_onboarding_catalog', rescueReason: 'apply_catalog' };
  }
  if (isRecommendCatalogPrompt(prompt)) {
    return { action: 'recommend_catalog', rescueReason: 'recommend_catalog' };
  }
  if (isSetBusinessTypePrompt(prompt)) {
    return { action: 'set_business_type', rescueReason: 'business_type' };
  }
  if (isExplainOnboardingStatusPrompt(prompt)) {
    return {
      action: 'explain_onboarding_status',
      rescueReason: 'onboarding_status',
    };
  }
  return null;
}
