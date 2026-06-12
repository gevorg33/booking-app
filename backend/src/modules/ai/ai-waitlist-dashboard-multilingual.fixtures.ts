import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { WaitlistDashboardIntent } from './ai-waitlist-dashboard.util.js';
import {
  LIST_WAITLIST_ENTRIES_PROMPTS,
  OFFER_WAITLIST_SLOT_PROMPTS,
  WAITLIST_DASHBOARD_EN_SCENARIO_IDS,
} from './ai-waitlist-dashboard.fixtures.js';

export type WaitlistDashboardMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: WaitlistDashboardIntent;
  rescueReason: WaitlistDashboardIntent;
  paramsPartial?: Record<string, unknown>;
};

const LIST_I18N: Record<string, { hy: string; ru: string }> = {
  'waitlist-list-entries-en': {
    hy: 'Ցույց տուր waitlist entries',
    ru: 'Покажи waitlist entries',
  },
  'waitlist-list-customers-en': {
    hy: 'Ցուցակագրիր waitlist customers',
    ru: 'Список waitlist customers',
  },
  'waitlist-who-on-en': {
    hy: 'Ով է waitlist-ում',
    ru: 'Кто в waitlist',
  },
  'waitlist-display-clients-en': {
    hy: 'Ցուցադրիր waitlist clients',
    ru: 'Отобрази waitlist clients',
  },
  'waitlist-list-everyone-en': {
    hy: 'Ցուցակագրիր բոլորին waitlist-ում',
    ru: 'Список всех в waitlist',
  },
  'waitlist-show-people-en': {
    hy: 'Ցույց տուր waitlist people CRM-ում',
    ru: 'Покажи waitlist people в CRM',
  },
  'waitlist-list-today-en': {
    hy: 'Ցուցակագրիր waitlist entries այսօր',
    ru: 'Список waitlist entries на сегодня',
  },
  'waitlist-who-customers-en': {
    hy: 'Ովեր են մեր waitlist customers-ը',
    ru: 'Кто наши waitlist customers',
  },
  'waitlist-show-all-en': {
    hy: 'Ցույց տուր բոլոր waitlist clients-ը',
    ru: 'Покажи всех waitlist clients',
  },
  'waitlist-tag-customers-en': {
    hy: 'Ցուցակագրիր customers waitlist tag-ով',
    ru: 'Список customers с waitlist tag',
  },
  'waitlist-display-crm-en': {
    hy: 'Ցուցադրիր waitlist entries CRM-ում',
    ru: 'Отобрази waitlist entries в CRM',
  },
};

const OFFER_I18N: Record<string, { hy: string; ru: string }> = {
  'waitlist-offer-friday-en': {
    hy: 'Առաջարկիր Friday 2pm gap waitlist-ին',
    ru: 'Предложи Friday 2pm gap waitlist',
  },
  'waitlist-notify-cancelled-en': {
    hy: 'Տեղեկացրու waitlist Maria-ի cancelled slot-ի մասին Friday 2pm',
    ru: 'Уведоми waitlist об отмене Maria Friday 2pm',
  },
  'waitlist-message-open-en': {
    hy: 'Հաղորդագրություն waitlist customers Friday 3pm open slot-ի մասին',
    ru: 'Сообщи waitlist customers об open slot Friday 3pm',
  },
  'waitlist-contact-friday-en': {
    hy: 'Կապ հաստատիր waitlist-ի հետ Friday 3pm opening-ի մասին',
    ru: 'Свяжись с waitlist про Friday 3pm opening',
  },
  'waitlist-offer-tomorrow-en': {
    hy: 'Առաջարկիր waitlist-ին 10am slot վաղը',
    ru: 'Предложи waitlist слот 10am завтра',
  },
  'waitlist-reach-gevorg-en': {
    hy: 'Կապ հաստատիր waitlist Gevorg-ի 2pm gap Friday',
    ru: 'Свяжись с waitlist про gap Gevorg 2pm Friday',
  },
  'waitlist-notify-appointment-en': {
    hy: 'Տեղեկացրու waitlist open appointment Friday 2pm',
    ru: 'Уведоми waitlist об open appointment Friday 2pm',
  },
  'waitlist-offer-cancelled-en': {
    hy: 'Առաջարկիր cancelled slot waitlist customers-ին',
    ru: 'Предложи cancelled slot waitlist customers',
  },
  'waitlist-message-tuesday-en': {
    hy: 'Հաղորդագրություն waitlist Tuesday 14:00 gap-ի մասին',
    ru: 'Сообщи waitlist про gap Tuesday 14:00',
  },
  'waitlist-contact-anna-en': {
    hy: 'Կապ հաստատիր waitlist available slot Anna 11am Friday',
    ru: 'Свяжись с waitlist про slot Anna 11am Friday',
  },
  'waitlist-offer-2pm-en': {
    hy: 'Առաջարկիր open slot Friday 2pm waitlist-ին',
    ru: 'Предложи open slot Friday 2pm waitlist',
  },
};

const ALL_I18N: Record<string, { hy: string; ru: string }> = {
  ...LIST_I18N,
  ...OFFER_I18N,
};

const EN_BY_ID = new Map(
  [...LIST_WAITLIST_ENTRIES_PROMPTS, ...OFFER_WAITLIST_SLOT_PROMPTS].map(
    (row) => [row.id, row],
  ),
);

function buildWaitlistMultilingualScenarios(): WaitlistDashboardMultilingualScenario[] {
  const rows: WaitlistDashboardMultilingualScenario[] = [];
  for (const enScenarioId of WAITLIST_DASHBOARD_EN_SCENARIO_IDS) {
    const i18n = ALL_I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: enRow.expectedAction,
        rescueReason: enRow.expectedAction,
        ...('expectedParams' in enRow && enRow.expectedParams
          ? { paramsPartial: enRow.expectedParams }
          : {}),
      });
    }
  }
  return rows;
}

export const WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS =
  buildWaitlistMultilingualScenarios();
