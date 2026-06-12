import {
  PROVIDER_ONBOARDING_COMPOUND_PROMPTS,
  PROVIDER_ONBOARDING_EN_SCENARIO_IDS,
} from './ai-provider-onboarding-compound.fixtures.js';
import { PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS } from './ai-provider-onboarding-compound-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderOnboardingLocaleParityGap = {
  enScenarioId: string;
  missingLocales: AiEvalLocale[];
};

export function listProviderOnboardingLocaleParityGaps(): ProviderOnboardingLocaleParityGap[] {
  const byEnId = new Map<string, { hy: boolean; ru: boolean }>();
  for (const enScenarioId of PROVIDER_ONBOARDING_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false });
  }
  for (const row of PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }
  const gaps: ProviderOnboardingLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId, missingLocales });
  }
  return gaps;
}

export function countProviderOnboardingEnScenarios(): number {
  return PROVIDER_ONBOARDING_COMPOUND_PROMPTS.length;
}
