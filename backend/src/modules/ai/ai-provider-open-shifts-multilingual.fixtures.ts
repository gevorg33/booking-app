import { SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS } from '../provider-mobile/provider-open-shifts.fixtures.js';
import type { ProviderOpenShiftsIntent } from './ai-provider-open-shifts.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderOpenShiftsMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderOpenShiftsIntent;
  rescueReason: string;
};

/** Classifier guidance for hy/ru provider open shifts (acc-2.4). */
export const PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider open shifts / gap waitlist (prov-exp-7.3):
  - suggest_waitlist_for_gap: hy «լրացրու gap-ը 09/06/2026 14:00-15:30 suggest waitlist customers», «suggest waitlist customers իմ 10:00-11:00 gap-ի համար aysor»; ru «заполни gap 09/06/2026 с 14:00 до 15:30 suggest waitlist», «предложи waitlist клиентов для gap 10:00–11:00 сегодня». NOT fill_unused_slots and NOT coordinate_waitlist_offer.`;

export const PROVIDER_OPEN_SHIFTS_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const OPEN_SHIFTS_I18N: Record<string, { hy: string; ru: string }> = {
  'fill-gap-waitlist': {
    hy: 'Լրացրու gap-ը 09/06/2026 14:00-15:30 — suggest waitlist customers',
    ru: 'Заполни gap 09/06/2026 с 14:00 до 15:30 — suggest waitlist customers',
  },
  'waitlist-for-open-slot': {
    hy: 'Suggest waitlist customers իմ 10:00-11:00 gap-ի համար aysor',
    ru: 'Предложи waitlist клиентов для моего gap 10:00–11:00 сегодня',
  },
};

function buildProviderOpenShiftsMultilingualScenarios(): ProviderOpenShiftsMultilingualScenario[] {
  const rows: ProviderOpenShiftsMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(OPEN_SHIFTS_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'suggest_waitlist_for_gap',
        rescueReason: 'fill_gap_waitlist',
      });
    }
  }

  return rows;
}

export const PROVIDER_OPEN_SHIFTS_EN_SCENARIO_IDS: string[] =
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS.map((row) => row.id);

export const PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS: ProviderOpenShiftsMultilingualScenario[] =
  buildProviderOpenShiftsMultilingualScenarios();
