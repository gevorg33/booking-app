import { SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS } from '../provider-mobile/provider-time-off.fixtures.js';
import type { ProviderTimeOffListIntent } from './ai-provider-time-off.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderTimeOffListMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderTimeOffListIntent;
  rescueReason: string;
};

/** Classifier guidance for hy/ru provider time-off list (acc-2.4). */
export const PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider time-off list (prov-exp-7.2):
  - list_my_time_off_requests: hy «հաստատվա՞ծ է արդյոք իմ vacation request-ը», «ցույց տուր իմ pending PTO requests-ը», «ինչ status ունի իմ time off request-ը»; ru «одобрили ли мой запрос на отпуск», «покажи мои pending PTO заявки», «какой статус у моего time off запроса». NOT request_time_off (submit new PTO).`;

export const PROVIDER_TIME_OFF_LIST_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const TIME_OFF_LIST_I18N: Record<string, { hy: string; ru: string }> = {
  'list-status': {
    hy: 'Հաստատվա՞ծ է արդյոք իմ vacation request-ը',
    ru: 'Одобрили ли мой запрос на отпуск',
  },
  'pending-pto': {
    hy: 'Ցույց տուր իմ pending PTO requests-ը',
    ru: 'Покажи мои pending PTO заявки',
  },
  'time-off-status': {
    hy: 'Ինչ status ունի իմ time off request-ը',
    ru: 'Какой статус у моего time off запроса',
  },
  'my-time-off-requests': {
    hy: 'Ցույց տուր իմ time off request-ները',
    ru: 'У меня отпуск — покажи статус запроса',
  },
};

function buildProviderTimeOffListMultilingualScenarios(): ProviderTimeOffListMultilingualScenario[] {
  const rows: ProviderTimeOffListMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(TIME_OFF_LIST_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'list_my_time_off_requests',
        rescueReason: 'my_time_off_list',
      });
    }
  }

  return rows;
}

export const PROVIDER_TIME_OFF_LIST_EN_SCENARIO_IDS: string[] =
  SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS.map((row) => row.id);

export const PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS: ProviderTimeOffListMultilingualScenario[] =
  buildProviderTimeOffListMultilingualScenarios();
