import {
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS,
  CLINIC_LAB_REVIEW_EN_SCENARIO_IDS,
} from './ai-clinic-lab-review-compound.fixtures.js';
import { CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-review-compound-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ClinicLabReviewLocaleParityGap = {
  enScenarioId: string;
  missingLocales: AiEvalLocale[];
};

export function listClinicLabReviewLocaleParityGaps(): ClinicLabReviewLocaleParityGap[] {
  const byEnId = new Map<string, { hy: boolean; ru: boolean }>();
  for (const enScenarioId of CLINIC_LAB_REVIEW_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false });
  }
  for (const row of CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }
  const gaps: ClinicLabReviewLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId, missingLocales });
  }
  return gaps;
}

export function countClinicLabReviewEnScenarios(): number {
  return CLINIC_LAB_REVIEW_COMPOUND_PROMPTS.length;
}
