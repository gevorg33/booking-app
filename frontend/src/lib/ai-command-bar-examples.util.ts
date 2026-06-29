import {
  buildAiCommandBarExamples,
  getLocalizedPageSuggestions,
  type AiExampleTenantContext,
} from '@/lib/ai-assistant-i18n';
import {
  buildCommandBarGuideExamples,
  mixCommandBarFirstOpenExamples,
  resolveCommandBarRoute,
} from '@/lib/ai-command-bar-guide.util';
import {
  resolveOnboardingCommandBarExamples,
  type OnboardingAiStep,
} from '@/lib/ai-onboarding.util';
import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';

export type CommandBarExampleVariant = 'dashboard' | 'onboarding';

export function resolveCommandBarExamples(input: {
  variant: CommandBarExampleVariant;
  onboardingStep: OnboardingAiStep;
  tenant: AiExampleTenantContext;
  t: AiTranslateFn;
  pathname?: string | null;
  guideMode?: boolean;
}): string[] {
  if (input.variant === 'onboarding') {
    return resolveOnboardingCommandBarExamples(
      input.onboardingStep,
      input.t,
      input.guideMode ?? false,
    );
  }

  const route = resolveCommandBarRoute(input.pathname);
  const guideExamples = buildCommandBarGuideExamples(route, input.t);
  const routeActions = getLocalizedPageSuggestions(route, input.t, input.tenant);
  const fallbackActions = buildAiCommandBarExamples(input.tenant, input.t);
  const actionExamples = routeActions.length > 0 ? routeActions : fallbackActions;

  return mixCommandBarFirstOpenExamples({
    route,
    guideExamples,
    actionExamples,
    guideMode: input.guideMode ?? false,
  });
}
