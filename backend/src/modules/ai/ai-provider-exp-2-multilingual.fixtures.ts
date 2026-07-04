import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from './ai-provider-exp-2.fixtures.js';
import type { ProviderExp2Intent } from './ai-provider-exp-2.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderExp2MultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderExp2Intent;
  rescueReason: ProviderExp2Intent;
  paramsPartial?: Record<string, unknown>;
};

/** EN rows that already ship HY/RU siblings in the main fixture table. */
export const PROVIDER_EXP_2_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'my-stats-week-en': {
    hy: 'my-stats-hy',
    ru: 'my-stats-ru',
  },
  'team-floor-status-en': {
    hy: 'team-floor-hy',
    ru: 'team-floor-ru',
  },
  'check-in-client-en': {
    hy: 'check-in-client-hy',
    ru: 'check-in-client-ru',
  },
  'running-late-10-en': {
    hy: 'running-late-hy',
    ru: 'running-late-ru',
  },
};

const MY_STATS_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'my-stats-month-en': {
    hy: 'Ինչպե՞ս եմ այս ամիս',
    ru: 'Как у меня дела в этом месяце?',
  },
  'my-stats-utilization-en': {
    hy: 'Իմ օգտագործումը և եկամուտը այս շաբաթ',
    ru: 'Моя загрузка и выручка за эту неделю',
  },
  'my-stats-team-en': {
    hy: 'Թիմի ցուցանիշները այս շաբաթ',
    ru: 'Статистика команды за неделю',
    paramsPartial: { scope: 'team' },
  },
  'my-stats-performance-en': {
    hy: 'Ամփոփիր իմ աշխատանքի ցուցանիշները այս շաբաթ',
    ru: 'Подведи мои показатели работы за эту неделю',
  },
  'my-stats-reviews-en': {
    hy: 'Իմ ցուցանիշները՝ ներառյալ կարծիքները այս ամիս',
    ru: 'Моя статистика с отзывами за этот месяц',
  },
};

const TEAM_FLOOR_I18N: Record<string, { hy: string; ru: string }> = {
  'team-floor-waiting-en': {
    hy: 'Ով է սպասում թիմի հարկում',
    ru: 'Кто ждёт на зале команды?',
  },
  'team-floor-board-en': {
    hy: 'Տես հարկի տախտակը բոլոր մատուցիչների համար',
    ru: 'Покажи доску зала для всех провайдеров',
  },
  'team-floor-in-service-en': {
    hy: 'Ով է հիմա սպասարկման մեջ հարկում',
    ru: 'Кто сейчас в работе на зале?',
  },
  'team-floor-counts-en': {
    hy: 'Հարկի կարգավիճակի հաշվարկներն այսօր',
    ru: 'Сводка статусов зала на сегодня',
  },
};

const CHECK_IN_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'check-in-arrived-en': {
    hy: 'Jane-ը եկավ — գրանցել',
    ru: 'Jane приехала — отметить приход',
    paramsPartial: { customerName: 'Jane' },
  },
  'check-in-mark-en': {
    hy: 'Նշել Sam-ին որպես գրանցված',
    ru: 'Отметить Sam как пришедшего',
    paramsPartial: { customerName: 'Sam' },
  },
};

const RUNNING_LATE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'running-late-client-en': {
    hy: 'Նշել Maria-ին որպես ուշացող',
    ru: 'Отметить, что Maria опаздывает',
    paramsPartial: { customerName: 'Maria' },
  },
  'running-late-minutes-en': {
    hy: '15 րոպե ուշ եմ իմ 14:00 հաճախորդի համար',
    ru: 'Опаздываю на 15 минут к клиенту в 14:00',
    paramsPartial: { minutesLate: 15 },
  },
  'running-late-notify-en': {
    hy: 'Ասա հաճախորդին, որ ուշ եմ',
    ru: 'Сообщи клиенту, что я опаздываю',
  },
};

const READY_NOW_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'ready-now-client-en': {
    hy: 'Նշիր Maria-ին որպես պատրաստ հիմա',
    ru: 'Отметь готовность клиента Maria',
    paramsPartial: { customerName: 'Maria' },
  },
  'ready-now-self-en': {
    hy: 'Ես պատրաստ եմ հաջորդ հաճախորդի համար',
    ru: 'Я готов к следующему клиенту',
  },
  'ready-to-be-seen-en': {
    hy: 'Պատրաստ եմ ընդունվելու',
    ru: 'Готов к приёму',
  },
};

const SUGGEST_CANCEL_NOTE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'suggest-cancel-note-en': {
    hy: 'Կազմիր չեղարկման նշում Jane-ի համար',
    ru: 'Составь заметку об отмене для Jane',
    paramsPartial: { customerName: 'Jane' },
  },
  'suggest-cancel-note-generic-en': {
    hy: 'Առաջարկիր չեղարկման պատճառ այս ամրագրման համար',
    ru: 'Предложи причину отмены для этой записи',
  },
};

const REQUEST_CLIENT_REVIEW_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'request-client-review-en': {
    hy: 'Խնդրիր Jane-ին թողնել կարծիք',
    ru: 'Попроси отзыв у Jane',
    paramsPartial: { customerName: 'Jane' },
  },
  'request-review-generic-en': {
    hy: 'Խնդրիր հաճախորդից կարծիք թողնել',
    ru: 'Попроси клиента оставить отзыв',
  },
};

const LIST_REASSIGN_OPTIONS_I18N: Record<string, { hy: string; ru: string }> =
  {
    'list-reassign-options-en': {
      hy: 'Ո՞վ է ազատ ստանձնելու այս ամրագրումը փոխարենը',
      ru: 'Кто ещё свободен принять эту запись вместо меня?',
    },
    'reassign-options-generic-en': {
      hy: 'Վերանշանակման տարբերակներ այս ամրագրման համար',
      ru: 'Варианты переназначения для этой записи',
    },
  };

const REASSIGN_BOOKING_SAME_DAY_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'reassign-booking-same-day-en': {
    hy: 'Վերանշանակիր սա Maria-ին',
    ru: 'Переназначь это на Maria',
    paramsPartial: { employeeName: 'Maria' },
  },
};

function pushExp2MultilingualRows(
  rows: ProviderExp2MultilingualScenario[],
  enScenarioId: string,
  expectedAction: ProviderExp2Intent,
  i18n: { hy: string; ru: string; paramsPartial?: Record<string, unknown> },
): void {
  for (const locale of ['hy', 'ru'] as const) {
    rows.push({
      id: `${enScenarioId}-${locale}`,
      enScenarioId,
      locale,
      prompt: locale === 'hy' ? i18n.hy : i18n.ru,
      expectedAction,
      rescueReason: expectedAction,
      ...(i18n.paramsPartial ? { paramsPartial: i18n.paramsPartial } : {}),
    });
  }
}

function buildProviderExp2MultilingualScenarios(): ProviderExp2MultilingualScenario[] {
  const rows: ProviderExp2MultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(MY_STATS_I18N)) {
    pushExp2MultilingualRows(rows, enScenarioId, 'my_stats', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(TEAM_FLOOR_I18N)) {
    pushExp2MultilingualRows(rows, enScenarioId, 'team_floor_status', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(CHECK_IN_I18N)) {
    pushExp2MultilingualRows(rows, enScenarioId, 'check_in_client', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(RUNNING_LATE_I18N)) {
    pushExp2MultilingualRows(rows, enScenarioId, 'mark_running_late', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(READY_NOW_I18N)) {
    pushExp2MultilingualRows(rows, enScenarioId, 'mark_ready_now', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(
    SUGGEST_CANCEL_NOTE_I18N,
  )) {
    pushExp2MultilingualRows(rows, enScenarioId, 'suggest_cancel_note', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(
    REQUEST_CLIENT_REVIEW_I18N,
  )) {
    pushExp2MultilingualRows(
      rows,
      enScenarioId,
      'request_client_review',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    LIST_REASSIGN_OPTIONS_I18N,
  )) {
    pushExp2MultilingualRows(rows, enScenarioId, 'list_reassign_options', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(
    REASSIGN_BOOKING_SAME_DAY_I18N,
  )) {
    pushExp2MultilingualRows(
      rows,
      enScenarioId,
      'reassign_booking_same_day',
      i18n,
    );
  }

  return rows;
}

export const PROVIDER_EXP_2_EN_SCENARIO_IDS: string[] =
  PROVIDER_EXP_2_PROMPT_SCENARIOS.filter((row) => row.id.endsWith('-en')).map(
    (row) => row.id,
  );

export const PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS: ProviderExp2MultilingualScenario[] =
  buildProviderExp2MultilingualScenarios();
