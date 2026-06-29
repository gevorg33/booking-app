import { getAiPageSuggestionGroups, type AiPageSuggestionGroup } from '@/lib/ai-orchestration';
import {
  getOnboardingPageSuggestionGroups,
  type OnboardingAiStep,
} from '@/lib/ai-onboarding.util';
import type {
  AiTranslateFn,
  AssistantExampleTenantInput,
} from '@/lib/ai-assistant-i18n';

export type ResolveAiPagePanelGroupsInput = {
  route: string;
  onboardingStep?: OnboardingAiStep;
  suggestions?: string[];
  tenant?: AssistantExampleTenantInput | null;
  t: AiTranslateFn;
};

/** Pure resolver for AiPagePanel suggestion groups (Sprint 18 page coverage). */
export function resolveAiPagePanelGroups(
  input: ResolveAiPagePanelGroupsInput,
): AiPageSuggestionGroup[] {
  const { route, onboardingStep, suggestions, tenant, t } = input;
  if (route === '/dashboard/onboarding' && onboardingStep) {
    return getOnboardingPageSuggestionGroups(onboardingStep, t);
  }
  if (route) {
    return getAiPageSuggestionGroups(route, t, tenant);
  }
  if (suggestions?.length) {
    return [{ id: 'commands', label: t('ai.quickCommands'), items: suggestions }];
  }
  return [];
}

export function aiPagePanelHasSuggestions(groups: AiPageSuggestionGroup[]): boolean {
  return groups.some((g) => g.items.length > 0);
}
