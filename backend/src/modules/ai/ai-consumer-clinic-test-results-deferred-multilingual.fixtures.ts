import {
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';
import type { ConsumerClinicTestResultsIntent } from './ai-consumer-clinic-test-results.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ConsumerClinicTestResultsDeferredMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ConsumerClinicTestResultsIntent;
  rescueReason: ConsumerClinicTestResultsIntent;
  paramsPartial?: Record<string, unknown>;
};

/** Classifier guidance for hy/ru customer My Results (acc-2.4 deferred). */
export const CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian customer My Results (logged-in consumer app):
  - list_my_test_results: hy «ցույց տուր իմ լաբ արդյունքները», «բացիր My Results», «կա՞ թողարկված արդյունք իմ հաշվում»; ru «покажи мои лабораторные результаты», «открой мои результаты», «есть ли готовые результаты в аккаунте». NOT list_my_appointments.
  - explain_result_status: hy «ինչ նշանակում ունի թողարկվածը», «ինչու CBC-ն դեռ pending է»; ru «что означает выпущено», «почему CBC ещё не готов». NOT explain_checkout_tax.`;

const LIST_I18N: Record<string, { hy: string; ru: string }> = {
  'show-lab-results': {
    hy: 'Ցույց տուր իմ լաբորատոր թեստի արդյունքները',
    ru: 'Покажи мои лабораторные результаты анализов',
  },
  'list-my-results': {
    hy: 'Ցուցակավորիր իմ թեստի արդյունքները',
    ru: 'Покажи список моих результатов анализов',
  },
  'my-results-account': {
    hy: 'Ի՞նչ լաբ արդյունքներ ունեմ իմ հաշվում',
    ru: 'Какие лабораторные результаты есть в моём аккаунте',
  },
  'released-results': {
    hy: 'Ցույց տուր իմ թողարկված լաբ արդյունքները',
    ru: 'Покажи мои выпущенные лабораторные результаты',
  },
  'open-my-results': {
    hy: 'Բացիր իմ լաբ արդյունքները',
    ru: 'Открой мои лабораторные результаты',
  },
  'account-results': {
    hy: 'Ի՞նչ արդյունքներ կան My Results-ում',
    ru: 'Какие результаты есть в разделе Мои результаты',
  },
  'see-test-results': {
    hy: 'Կարո՞ղ եմ տեսնել իմ թեստի արդյունքները',
    ru: 'Могу ли я посмотреть свои результаты анализов',
  },
  'lab-results-account': {
    hy: 'Իմ լաբ արդյունքները իմ հաշվում',
    ru: 'Мои лабораторные результаты в аккаунте',
  },
  'check-my-results': {
    hy: 'Ստուգիր իմ լաբ թեստի արդյունքները',
    ru: 'Проверь мои лабораторные результаты анализов',
  },
};

const EXPLAIN_I18N: Record<string, { hy: string; ru: string }> = {
  'released-meaning': {
    hy: 'Ի՞նչ նշանակություն ունի թողարկվածը իմ լաբ արդյունքների համար',
    ru: 'Что означает выпущено для моих лабораторных результатов',
  },
  'why-not-ready': {
    hy: 'Ինչու՞ դեռ չեմ տեսնում իմ CBC արդյունքները',
    ru: 'Почему я ещё не вижу результаты CBC',
  },
  'pending-meaning': {
    hy: 'Ի՞նչ նշանակում ունի pending-ը թեստի արդյունքների համար',
    ru: 'Что означает pending для результатов анализов',
  },
  'when-available': {
    hy: 'Ե՞րբ կլինեն հասանելի իմ լաբ արդյունքները',
    ru: 'Когда будут доступны мои лабораторные результаты',
  },
  'still-processing': {
    hy: 'Ինչու՞ է իմ թեստը դեռ մշակման մեջ',
    ru: 'Почему мой анализ всё ещё обрабатывается',
  },
  'explain-status': {
    hy: 'Բացատրիր իմ լաբ արդյունքի կարգավիճակը',
    ru: 'Объясни статус моего лабораторного результата',
  },
  'reviewed-meaning': {
    hy: 'Ի՞նչ նշանակում ունի reviewed-ը մինչև արդյունքների թողարկումը',
    ru: 'Что означает reviewed до выпуска результатов',
  },
  'waiting-results': {
    hy: 'Ինչու՞ են իմ արդյունքները դեռ սպասման մեջ',
    ru: 'Почему мои результаты всё ещё в ожидании',
  },
  'lipid-status': {
    hy: 'Որո՞նք է lipid panel արդյունքի կարգավիճակը',
    ru: 'Какой статус у результата lipid panel',
  },
  'not-showing': {
    hy: 'Ինչու՞ չեն ցուցադրվում իմ լաբ արդյունքները հավելվածում',
    ru: 'Почему мои лабораторные результаты не показываются в приложении',
  },
  'processing-meaning': {
    hy: 'Ի՞նչ նշանակում ունի, երբ լաբ արդյունքը դեռ processing է',
    ru: 'Что значит, когда лабораторный результат ещё processing',
  },
  'ready-vs-released': {
    hy: 'Ե՞րբ են թեստի արդյունքները նշվում որպես released',
    ru: 'Когда результаты анализов помечаются как released',
  },
};

function buildDeferredMultilingualScenarios(): ConsumerClinicTestResultsDeferredMultilingualScenario[] {
  const rows: ConsumerClinicTestResultsDeferredMultilingualScenario[] = [];

  for (const entry of LIST_MY_TEST_RESULTS_PROMPTS) {
    const i18n = LIST_I18N[entry.id];
    if (!i18n) {
      throw new Error(`Missing HY/RU list prompts for ${entry.id}`);
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'list_my_test_results',
        rescueReason: 'list_my_test_results',
      });
    }
  }

  for (const entry of EXPLAIN_RESULT_STATUS_PROMPTS) {
    const i18n = EXPLAIN_I18N[entry.id];
    if (!i18n) {
      throw new Error(`Missing HY/RU explain prompts for ${entry.id}`);
    }
    const paramsPartial: Record<string, unknown> = {};
    if ('status' in entry && entry.status) {
      paramsPartial.status = entry.status;
    }
    if ('testName' in entry && entry.testName) {
      paramsPartial.testName = entry.testName;
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'explain_result_status',
        rescueReason: 'explain_result_status',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      });
    }
  }

  return rows;
}

export const CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_EN_SCENARIO_IDS: string[] = [
  ...LIST_MY_TEST_RESULTS_PROMPTS.map((row) => row.id),
  ...EXPLAIN_RESULT_STATUS_PROMPTS.map((row) => row.id),
];

export const CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS: ConsumerClinicTestResultsDeferredMultilingualScenario[] =
  buildDeferredMultilingualScenarios();
