import {
  buildAiCommandBarExamples,
  type AiExampleTenantContext,
} from '@/lib/ai-assistant-i18n';
import {
  getOnboardingCommandBarExamples,
  type OnboardingAiStep,
} from '@/lib/ai-onboarding.util';
import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';

export type CommandBarExampleVariant = 'dashboard' | 'onboarding';

export function resolveCommandBarExamples(input: {
  variant: CommandBarExampleVariant;
  onboardingStep: OnboardingAiStep;
  tenant: AiExampleTenantContext;
  t: AiTranslateFn;
}): string[] {
  if (input.variant === 'onboarding') {
    return getOnboardingCommandBarExamples(input.onboardingStep, input.t);
  }
  return buildAiCommandBarExamples(input.tenant, input.t);
}
