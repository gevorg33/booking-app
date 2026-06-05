import type { AiTranslateFn } from './ai-assistant-i18n';

export type OnboardingAiStep = 'type' | 'review' | 'schedule' | 'link' | 'done';

const ONBOARDING_PANEL_PROMPT_KEYS: Record<OnboardingAiStep, string[]> = {
  type: [
    'onboardingSuggestCatalog',
    'onboardingDescribeServices',
    'onboardingApplyWeekdayTemplate',
  ],
  review: ['onboardingRefineCatalog', 'onboardingAddPopularServices', 'onboardingAdjustPricing'],
  schedule: ['setupWeekScheduleTeam', 'applyWeekdayTemplateProvider', 'blockLunchAllProviders'],
  link: ['onboardingBookingLinkTips', 'onboardingEmbedBookingWidget'],
  done: ['howManyToday', 'summarizeUtilizationWeek', 'openSlotsThisWeek'],
};

const ONBOARDING_COMMAND_BAR_KEYS: Record<OnboardingAiStep, string[]> = {
  type: ['onboardingSuggestCatalog', 'onboardingDescribeServices', 'setupWeekScheduleTeam'],
  review: ['onboardingRefineCatalog', 'onboardingAddPopularServices', 'listScheduleTemplates'],
  schedule: ['setupWeekScheduleTeam', 'applyWeekdayTemplateProvider', 'blockLunchAllProviders'],
  link: ['onboardingBookingLinkTips', 'howManyToday', 'summarizeUtilizationWeek'],
  done: ['howManyToday', 'summarizeUtilizationWeek', 'top10CustomersPaid'],
};

function prompt(t: AiTranslateFn, key: string): string {
  return t(`ai.prompts.${key}`);
}

export function getOnboardingPageSuggestionGroups(step: OnboardingAiStep, t: AiTranslateFn) {
  const keys = ONBOARDING_PANEL_PROMPT_KEYS[step] ?? ONBOARDING_PANEL_PROMPT_KEYS.type;
  return [
    {
      id: 'guided',
      label: t('onboarding.aiGuidedTitle'),
      items: keys.map((key) => prompt(t, key)),
    },
  ];
}

export function getOnboardingCommandBarExamples(step: OnboardingAiStep, t: AiTranslateFn): string[] {
  const keys = ONBOARDING_COMMAND_BAR_KEYS[step] ?? ONBOARDING_COMMAND_BAR_KEYS.type;
  return keys.map((key) => prompt(t, key));
}

export function onboardingPromptI18nKeys(): string[] {
  const keys = new Set<string>();
  for (const list of Object.values(ONBOARDING_PANEL_PROMPT_KEYS)) {
    list.forEach((k) => keys.add(`ai.prompts.${k}`));
  }
  for (const list of Object.values(ONBOARDING_COMMAND_BAR_KEYS)) {
    list.forEach((k) => keys.add(`ai.prompts.${k}`));
  }
  keys.add('onboarding.aiGuidedTitle');
  keys.add('onboarding.aiGuidedHint');
  keys.add('onboarding.aiAssistantTitle');
  return [...keys];
}
