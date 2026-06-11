import {
  STAFF_OPERATIONS_EN_SCENARIO_IDS,
  STAFF_OPERATIONS_PROMPT_FIXTURES,
} from './ai-staff-operations.fixtures.js';
import { STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS } from './ai-staff-operations-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type StaffOperationsLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export function listStaffOperationsLocaleParityGaps(): StaffOperationsLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of STAFF_OPERATIONS_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const row of STAFF_OPERATIONS_PROMPT_FIXTURES) {
    const slot = byEnId.get(row.id);
    if (slot && !slot.intent) slot.intent = row.expectedAction;
  }

  const gaps: StaffOperationsLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}
