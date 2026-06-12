import {
  PROVIDER_TEAM_WHOS_NEXT_EN_SCENARIO_IDS,
  PROVIDER_TEAM_WHOS_NEXT_LEGACY_LOCALE_SIBLING_IDS,
  PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-team-whos-next-multilingual.fixtures.js';
import { SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS } from '../provider-mobile/provider-team-whos-next.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderTeamWhosNextLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export function listProviderTeamWhosNextLocaleParityGaps(): ProviderTeamWhosNextLocaleParityGap[] {
  const scenarioIds = new Set<string>(
    SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS.map((row) => row.id),
  );
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of PROVIDER_TEAM_WHOS_NEXT_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const [enScenarioId, legacy] of Object.entries(
    PROVIDER_TEAM_WHOS_NEXT_LEGACY_LOCALE_SIBLING_IDS,
  )) {
    const slot = byEnId.get(enScenarioId);
    if (!slot) continue;
    if (scenarioIds.has(legacy.hy)) slot.hy = true;
    if (scenarioIds.has(legacy.ru)) slot.ru = true;
    if (!slot.intent) {
      slot.intent = 'team_whos_next';
    }
  }

  const gaps: ProviderTeamWhosNextLocaleParityGap[] = [];
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
