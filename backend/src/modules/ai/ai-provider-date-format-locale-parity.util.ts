import {
  PROVIDER_DATE_FORMAT_EN_SCENARIO_IDS,
  PROVIDER_DATE_FORMAT_LEGACY_LOCALE_SIBLING_IDS,
  PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-date-format-multilingual.fixtures.js';
import { MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS } from './ai-date-input-provider-format-multilingual.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderDateFormatLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export function listProviderDateFormatLocaleParityGaps(): ProviderDateFormatLocaleParityGap[] {
  const dateInputIds = new Set(
    MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS.map((row) => row.id),
  );
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of PROVIDER_DATE_FORMAT_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const [enScenarioId, legacy] of Object.entries(
    PROVIDER_DATE_FORMAT_LEGACY_LOCALE_SIBLING_IDS,
  )) {
    const slot = byEnId.get(enScenarioId);
    if (!slot) continue;
    if (dateInputIds.has(legacy.hy)) slot.hy = true;
    if (dateInputIds.has(legacy.ru)) slot.ru = true;
    if (!slot.intent) {
      slot.intent =
        enScenarioId.startsWith('configure') ||
        enScenarioId.includes('push') ||
        enScenarioId.includes('fcm') ||
        enScenarioId.includes('24h')
          ? 'configure_provider_push_date_format'
          : 'explain_provider_date_display';
    }
  }

  const gaps: ProviderDateFormatLocaleParityGap[] = [];
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
