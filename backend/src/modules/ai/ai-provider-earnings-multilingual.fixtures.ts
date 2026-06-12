import { PROVIDER_EARNINGS_PROMPT_SCENARIOS } from './ai-provider-earnings.fixtures.js';
import type { ProviderEarningsIntent } from './ai-provider-earnings.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderEarningsMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderEarningsIntent;
  rescueReason: ProviderEarningsIntent;
};

/** EN rows that already ship HY/RU siblings in the main fixture table. */
export const PROVIDER_EARNINGS_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'appt-count-tomorrow-en': {
    hy: 'appt-count-hy',
    ru: 'appt-count-ru',
  },
  'revenue-last-week-en': {
    hy: 'revenue-hy',
    ru: 'revenue-ru',
  },
};

const APPT_COUNT_I18N: Record<string, { hy: string; ru: string }> = {
  'appt-count-today-en': {
    hy: 'Քանի ամրագրում ունեմ այսօր',
    ru: 'Сколько у меня записей сегодня?',
  },
  'appt-count-last-week-en': {
    hy: 'Քանի ամրագրում ունեմ անցած շաբաթ',
    ru: 'Сколько у меня записей за прошлую неделю?',
  },
  'appt-count-range-en': {
    hy: 'Քանի ամրագրում ունեմ 1 հունիսից 15 հունիս',
    ru: 'Сколько у меня записей с 1 июня по 15 июня?',
  },
  'appt-count-specific-day-en': {
    hy: 'Քանի ամրագրում ունեմ 12 հունիս',
    ru: 'Сколько у меня записей 12 июня?',
  },
  'appt-count-next-week-en': {
    hy: 'Քանի հաճախորդ ունեմ հաջորդ շաբաթ',
    ru: 'Сколько клиентов у меня на следующей неделе?',
  },
  'appt-count-this-month-en': {
    hy: 'Քանի ամրագրում ունեմ այս ամիս',
    ru: 'Сколько у меня записей в этом месяце?',
  },
  'appt-count-question-en': {
    hy: 'Կա՞ իմ ամրագրումներ վաղը',
    ru: 'Есть ли у меня записи на завтра?',
  },
};

const REVENUE_I18N: Record<string, { hy: string; ru: string }> = {
  'revenue-today-en': {
    hy: 'Քանի եմ վաստակել այսօր',
    ru: 'Сколько я заработал сегодня?',
  },
  'revenue-tomorrow-en': {
    hy: 'Որքան է իմ վաստակը վաղը',
    ru: 'Какой у меня доход завтра?',
  },
  'revenue-last-month-en': {
    hy: 'Իմ զուտ եկամուտը անցած ամիս',
    ru: 'Мой чистый доход за прошлый месяц',
  },
  'revenue-range-en': {
    hy: 'Քանի եմ վաստակել 1 հունիսից 15 հունիս',
    ru: 'Сколько я заработал с 1 июня по 15 июня?',
  },
  'revenue-this-month-en': {
    hy: 'Քանի եմ վաստակել այս ամիս',
    ru: 'Сколько я заработал в этом месяце?',
  },
  'revenue-net-en': {
    hy: 'Ամփոփիր իմ զուտ վաստակը հարկից հետո այս շաբաթ',
    ru: 'Подведи мой чистый заработок после налогов за эту неделю',
  },
  'revenue-commission-en': {
    hy: 'Քանի գումար է իմ բաժինը վճարված ամրագրումներից այսօր',
    ru: 'Сколько я заработал с оплаченных записей сегодня?',
  },
};

function buildProviderEarningsMultilingualScenarios(): ProviderEarningsMultilingualScenario[] {
  const rows: ProviderEarningsMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(APPT_COUNT_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'summarize_my_appointments',
        rescueReason: 'summarize_my_appointments',
      });
    }
  }

  for (const [enScenarioId, i18n] of Object.entries(REVENUE_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'summarize_my_revenue',
        rescueReason: 'summarize_my_revenue',
      });
    }
  }

  return rows;
}

export const PROVIDER_EARNINGS_EN_SCENARIO_IDS: string[] =
  PROVIDER_EARNINGS_PROMPT_SCENARIOS.filter((row) => row.id.endsWith('-en')).map(
    (row) => row.id,
  );

export const PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS: ProviderEarningsMultilingualScenario[] =
  buildProviderEarningsMultilingualScenarios();
