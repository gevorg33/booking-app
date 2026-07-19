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
  'check-in-voice-heres-en': {
    hy: 'Jane-ը եկել է, գրանցիր նրան',
    ru: 'Jane пришла, отметь приход',
  },
  'check-in-voice-go-ahead-en': {
    hy: 'Կարող ես գրանցել Sam-ի ժամանումը',
    ru: 'Можешь отметить приход Sam',
  },
  'check-in-voice-walked-in-en': {
    hy: 'Նա հենց նոր մտավ, խնդրում եմ գրանցիր նրան',
    ru: 'Она только что зашла, пожалуйста отметь её приход',
  },
  'check-in-voice-shorthand-en': {
    hy: 'Maria-ն այստեղ է, նշիր նրա ժամանումը',
    ru: 'Maria приехала',
  },
  'check-in-voice-mark-checked-en': {
    hy: 'Նշիր Emma-ին որպես գրանցված',
    ru: 'Отметь Emma как пришедшую',
  },
  'check-in-voice-shes-here-en': {
    hy: 'Գրանցիր Jane-ին, նա այստեղ է',
    ru: 'Зарегистрируй приход Jane, она здесь',
  },
  'check-in-voice-next-client-en': {
    hy: 'Հաճախորդս հենց նոր եկավ, գրանցիր նրան',
    ru: 'Мой клиент только что пришёл, отметь приход',
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
  'ready-for-next-client-en': {
    hy: 'Պատրաստ եմ հաջորդ հաճախորդի համար',
    ru: 'Готов к следующему клиенту',
  },
  'clear-running-late-en': {
    hy: 'Չեղարկիր ուշացման կարգավիճակը',
    ru: 'Убери статус опоздания',
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

const LIST_TEAM_UNPAID_TODAY_I18N: Record<string, { hy: string; ru: string }> =
  {
    'unpaid-today-floor-en': {
      hy: 'Կա՞ որևէ մեկը հարկում, ով դեռ չի վճարել',
      ru: 'Есть кто-то на зале, кто ещё не оплатил?',
    },
    'unpaid-today-across-team-en': {
      hy: 'Չվճարվածները ամբողջ թիմում',
      ru: 'Неоплаченные по всей команде',
    },
    'unpaid-today-hasnt-paid-en': {
      hy: 'Ո՞վ չի վճարել այսօր',
      ru: 'Кто ещё не оплатил сегодня?',
    },
    'unpaid-today-team-list-en': {
      hy: 'Ցուցակագրիր թիմի չվճարված ամրագրումները այսօր',
      ru: 'Покажи неоплаченные записи команды сегодня',
    },
    'unpaid-today-floor-list-en': {
      hy: 'Ցուցակագրիր չվճարվածները հարկում',
      ru: 'Список неоплаченных на зале',
    },
    'unpaid-today-anyone-outstanding-en': {
      hy: 'Կա՞ որևէ մեկը թիմում, ով դեռ չի վճարել',
      ru: 'Есть кто-то в команде, кто ещё не заплатил?',
    },
    'unpaid-today-check-floor-en': {
      hy: 'Ստուգիր՝ ո՞վ է հարկում չի վճարել',
      ru: 'Проверь, кто на зале не оплатил',
    },
    'unpaid-today-team-outstanding-en': {
      hy: 'Թիմի չվճարված ամրագրումները հենց հիմա',
      ru: 'Неоплаченные записи команды прямо сейчас',
    },
    'unpaid-today-who-owes-en': {
      hy: 'Ո՞վ է հարկում դեռ պարտք այսօր',
      ru: 'Кто на зале ещё должен сегодня?',
    },
    'unpaid-today-not-paid-team-en': {
      hy: 'Ո՞ր թիմի ամրագրումները չեն վճարվել այսօր',
      ru: 'Какие записи команды не оплачены сегодня?',
    },
  };

const EXPLAIN_REVIEWS_INBOX_I18N: Record<string, { hy: string; ru: string }> =
  {
    'reviews-inbox-my-rating-month-en': {
      hy: 'Իմ գնահատականը այս ամիս',
      ru: 'Мой рейтинг за этот месяц',
    },
    'reviews-inbox-bad-review-yesterday-en': {
      hy: 'Վատ կարծիք երեկ — ցուցադրիր',
      ru: 'Плохой отзыв вчера — покажи его',
    },
    'reviews-inbox-my-reviews-en': {
      hy: 'Ցուցադրիր իմ կարծիքները այս ամիս',
      ru: 'Покажи мои отзывы за этот месяц',
    },
    'reviews-inbox-inbox-en': {
      hy: 'Ցուցադրիր իմ բոլոր կարծիքները',
      ru: 'Покажи все мои отзывы',
    },
    'reviews-inbox-low-reviews-week-en': {
      hy: 'Կա՞ ցածր կարծիք այս շաբաթ',
      ru: 'Есть плохие отзывы на этой неделе?',
    },
    'reviews-inbox-recent-reviews-en': {
      hy: 'Իմ վերջին կարծիքները',
      ru: 'Мои последние отзывы',
    },
    'reviews-inbox-did-i-get-bad-en': {
      hy: 'Ստացե՞լ եմ վատ կարծիք այսօր',
      ru: 'Получил ли я плохие отзывы сегодня?',
    },
    'reviews-inbox-team-reviews-month-en': {
      hy: 'Թիմի կարծիքները այս ամիս',
      ru: 'Отзывы команды за этот месяц',
    },
    'reviews-inbox-team-rating-week-en': {
      hy: 'Ո՞րն է մեր թիմի գնահատականը այս շաբաթ',
      ru: 'Какой у нас рейтинг команды на этой неделе?',
    },
    'reviews-inbox-negative-review-en': {
      hy: 'Ցուցադրիր վատ կարծիքները այս շաբաթ',
      ru: 'Покажи плохие отзывы за эту неделю',
    },
    'reviews-inbox-five-star-latest-en': {
      hy: 'Վերջին 5 աստղանի կարծիքները',
      ru: 'Последние отзывы с 5 звёздами',
    },
  };

const EXPLAIN_REQUEST_REVIEW_FLOW_I18N: Record<string, { hy: string; ru: string }> =
  {
    'explain-request-review-flow-how-en': {
      hy: 'Ինչ գործընթաց կա հաճախորդից կարծիք խնդրելու համար',
      ru: 'Как мне попросить отзыв у клиента?',
    },
    'explain-request-review-flow-can-i-en': {
      hy: 'Կարո՞ղ եմ կարծիք խնդրել Jane-ից',
      ru: 'Могу ли я попросить отзыв у Jane?',
    },
  };

const DRAFT_REVIEW_RESPONSE_I18N: Record<string, { hy: string; ru: string }> =
  {
    'draft-review-response-reply-en': {
      hy: 'Օգնիր պատասխանել այս կարծիքին',
      ru: 'Помоги ответить на этот отзыв',
    },
    'draft-review-response-professional-en': {
      hy: 'Գրիր պատասխան այս կարծիքին',
      ru: 'Напиши профессиональный ответ на отзыв',
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
  for (const [enScenarioId, i18n] of Object.entries(
    LIST_TEAM_UNPAID_TODAY_I18N,
  )) {
    pushExp2MultilingualRows(
      rows,
      enScenarioId,
      'list_team_unpaid_today',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    EXPLAIN_REVIEWS_INBOX_I18N,
  )) {
    pushExp2MultilingualRows(rows, enScenarioId, 'explain_reviews_inbox', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(
    EXPLAIN_REQUEST_REVIEW_FLOW_I18N,
  )) {
    pushExp2MultilingualRows(
      rows,
      enScenarioId,
      'explain_request_review_flow',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    DRAFT_REVIEW_RESPONSE_I18N,
  )) {
    pushExp2MultilingualRows(rows, enScenarioId, 'draft_review_response', i18n);
  }

  return rows;
}

export const PROVIDER_EXP_2_EN_SCENARIO_IDS: string[] =
  PROVIDER_EXP_2_PROMPT_SCENARIOS.filter((row) => row.id.endsWith('-en')).map(
    (row) => row.id,
  );

export const PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS: ProviderExp2MultilingualScenario[] =
  buildProviderExp2MultilingualScenarios();
