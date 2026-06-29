import type { AiTranslateFn } from './ai-assistant-i18n';
import { buildGuideTopicAskPrompt } from './dashboard-guide-corpus.util';

export type OnboardingAiStep = 'type' | 'review' | 'schedule' | 'link' | 'done';

/** Setup playbook topic per onboarding step (ai-guide-1.3.5). */
export const ONBOARDING_STEP_GUIDE_TOPIC: Readonly<Record<OnboardingAiStep, string>> = {
  type: 'dashboard.ai.getting-started',
  review: 'dashboard.core.employees',
  schedule: 'dashboard.core.schedule',
  link: 'dashboard.ai.getting-started',
  done: 'dashboard.ai.dashboard',
};

const ONBOARDING_GUIDE_PROMPT_KEYS: Record<OnboardingAiStep, readonly string[]> = {
  type: ['explainGettingStarted', 'howDoIConfigureBusiness', 'walkThroughOnboarding'],
  review: ['howDoIAddService', 'explainServiceCatalog', 'howDoIAddStaff'],
  schedule: ['howDoISetupWeeklySchedule', 'walkThroughScheduleTemplates', 'explainGettingStarted'],
  link: ['howDoICompleteSetup', 'whereIsProductGuide', 'walkThroughOnboarding'],
  done: ['whatCanIDoHere', 'howDoIReadReports', 'explainGuideCenter'],
};

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

function guidePrompt(t: AiTranslateFn, key: string): string {
  return t(`ai.guidePrompts.${key}`);
}

export function resolveOnboardingGuideTopicId(step: OnboardingAiStep): string {
  return ONBOARDING_STEP_GUIDE_TOPIC[step] ?? ONBOARDING_STEP_GUIDE_TOPIC.type;
}

/** Guide-first setup playbooks for onboarding command bar (ai-guide-1.3.5). */
export function buildOnboardingGuideExamples(step: OnboardingAiStep, t: AiTranslateFn): string[] {
  const keys = ONBOARDING_GUIDE_PROMPT_KEYS[step] ?? ONBOARDING_GUIDE_PROMPT_KEYS.type;
  const topicId = resolveOnboardingGuideTopicId(step);
  return [
    guidePrompt(t, keys[0] ?? 'walkThroughOnboarding'),
    buildGuideTopicAskPrompt(topicId, t),
    guidePrompt(t, keys[2] ?? keys[1] ?? 'whereIsProductGuide'),
  ];
}

export function resolveOnboardingCommandBarExamples(
  step: OnboardingAiStep,
  t: AiTranslateFn,
  guideMode = false,
): string[] {
  const guideExamples = buildOnboardingGuideExamples(step, t);
  if (guideMode) return guideExamples;
  const actionExamples = getOnboardingCommandBarExamples(step, t);
  return [...guideExamples, actionExamples[0]].filter(Boolean).slice(0, 4);
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
  keys.add('ai.guidePrompts.walkThroughTopic');
  for (const key of Object.values(ONBOARDING_GUIDE_PROMPT_KEYS).flat()) {
    keys.add(`ai.guidePrompts.${key}`);
  }
  return [...keys];
}
