import {
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS,
  CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS,
} from './ai-clinic-lab-day-close-compound.fixtures.js';
import { CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-day-close-compound-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ClinicLabDayCloseLocaleParityGap = {
  enScenarioId: string;
  missingLocales: AiEvalLocale[];
};

export function listClinicLabDayCloseLocaleParityGaps(): ClinicLabDayCloseLocaleParityGap[] {
  const byEnId = new Map<string, { hy: boolean; ru: boolean }>();
  for (const enScenarioId of CLINIC_LAB_DAY_CLOSE_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false });
  }
  for (const row of CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }
  const gaps: ClinicLabDayCloseLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId, missingLocales });
  }
  return gaps;
}

export function countClinicLabDayCloseEnScenarios(): number {
  return CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS.length;
}
