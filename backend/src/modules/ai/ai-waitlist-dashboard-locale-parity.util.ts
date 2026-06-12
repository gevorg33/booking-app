import {
  WAITLIST_DASHBOARD_EN_SCENARIO_IDS,
  WAITLIST_DASHBOARD_PROMPT_FIXTURES,
} from './ai-waitlist-dashboard.fixtures.js';
import { WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS } from './ai-waitlist-dashboard-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type WaitlistDashboardLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export function listWaitlistDashboardLocaleParityGaps(): WaitlistDashboardLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of WAITLIST_DASHBOARD_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const row of WAITLIST_DASHBOARD_PROMPT_FIXTURES) {
    const slot = byEnId.get(row.id);
    if (slot && !slot.intent) slot.intent = row.expectedAction;
  }

  const gaps: WaitlistDashboardLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({ enScenarioId, intent: slot.intent, missingLocales });
  }
  return gaps;
}
