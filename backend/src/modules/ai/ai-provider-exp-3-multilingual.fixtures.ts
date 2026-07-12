import { PROVIDER_EXP_3_PROMPT_SCENARIOS } from './ai-provider-exp-3.fixtures.js';
import type { ProviderExp3Intent } from './ai-provider-exp-3.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderExp3MultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderExp3Intent;
  rescueReason: string;
  paramsPartial?: Record<string, unknown>;
};

export const PROVIDER_EXP_3_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const RETAIL_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'add-retail-product-en': {
    hy: 'Ավելացրու shampoo այս ամրագրությանը',
    ru: 'Добавь shampoo к этой записи',
  },
  'add-retail-my-appointment-en': {
    hy: 'Ավելացրու retail product Jane-ի appointment-ին',
    ru: 'Добавь retail product к записи Jane',
    paramsPartial: { customerName: 'Jane' },
  },
  'add-retail-named-en': {
    hy: 'Վաճառիր conditioner իմ booking-ում',
    ru: 'Продай conditioner на моей записи',
  },
  'add-retail-attach-en': {
    hy: 'Ավելացրու retail product այս appointment-ին',
    ru: 'Добавь retail product к этой записи',
  },
};

const MESSAGE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'send-message-running-late-en': {
    hy: 'SMS ուղարկիր Jane-ին, որ ուշ եմ',
    ru: 'Отправь SMS Jane, что я опаздываю',
    paramsPartial: { customerName: 'Jane' },
  },
  'send-message-template-en': {
    hy: 'Ուղարկիր confirming tomorrow template-ը իմ client-ին',
    ru: 'Отправь шаблон confirming tomorrow моему client',
  },
  'send-message-whatsapp-en': {
    hy: 'WhatsApp client-ին running late template-ը',
    ru: 'WhatsApp клиенту шаблон running late',
  },
  'send-message-sms-en': {
    hy: 'SMS Sam-ին running late snippet-ը',
    ru: 'Отправь SMS Sam snippet running late',
    paramsPartial: { customerName: 'Sam' },
  },
};

const BLOCK_I18N: Record<string, { hy: string; ru: string }> = {
  'block-my-lunch-en': {
    hy: 'Արգելափակիր իմ lunch-ը այսօր 12:00-13:00',
    ru: 'Заблокируй мой lunch сегодня 12:00-13:00',
  },
  'block-my-break-en': {
    hy: 'Block my break վաղը 15:00-15:15',
    ru: 'Block my break завтра 15:00-15:15',
  },
  'block-my-time-en': {
    hy: 'Արգելափակիր իմ time 14:00-14:30 ուրբաթ',
    ru: 'Заблокируй моё time 14:00-14:30 в пятницу',
  },
};

const TIME_OFF_I18N: Record<string, { hy: string; ru: string }> = {
  'request-time-off-friday-en': {
    hy: 'Հարցում եմ հաջորդ ուրբաթ ազատ օր',
    ru: 'Запросить следующую пятницу off',
  },
  'request-pto-en': {
    hy: 'Հաջորդ շաբաթ off է պետք',
    ru: 'Мне нужен next week off',
  },
  'request-time-off-plain-en': {
    hy: 'Հարցում եմ time off հաջորդ շաբաթ',
    ru: 'Запрос на time off на следующей неделе',
  },
  'request-time-off-take-monday-en': {
    hy: 'Հարցում եմ երկուշաբթի ազատ',
    ru: 'Мне нужен понедельник off',
  },
  'request-time-off-tomorrow-en': {
    hy: 'Հարցում եմ վաղվա օրը ազատ',
    ru: 'Мне нужен завтрашний день off',
  },
};

const SET_RETAIL_LINES_I18N: Record<string, { hy: string; ru: string }> = {
  'set-retail-lines-two-en': {
    hy: 'Դիր retail cart-ը 2 shampoo և 1 conditioner',
    ru: 'Установи retail cart на 2 shampoo и 1 conditioner',
  },
  'set-retail-lines-replace-en': {
    hy: 'Փոխարինիր retail cart-ը 3 candles-ով',
    ru: 'Замени retail cart на 3 candles',
  },
  'set-retail-lines-update-en': {
    hy: 'Թարմացրու retail lines-ը 1 shampoo-ի',
    ru: 'Обнови retail lines на 1 shampoo',
  },
};

const REMOVE_RETAIL_I18N: Record<string, { hy: string; ru: string }> = {
  'remove-retail-serum-en': {
    hy: 'Հեռացրու serum-ը զամբյուղից',
    ru: 'Убери serum из корзины',
  },
  'remove-retail-undo-en': {
    hy: 'Ջնջիր ավելացրած ապրանքը',
    ru: 'Удали добавленный товар',
  },
  'remove-retail-shampoo-booking-en': {
    hy: 'Հեռացրու shampoo ապրանքը այս ամրագրումից',
    ru: 'Убери shampoo товар из этой записи',
  },
  'remove-retail-conditioner-cart-en': {
    hy: 'Ջնջիր conditioner-ը retail զամբյուղից',
    ru: 'Удали conditioner из retail корзины',
  },
  'remove-retail-my-booking-en': {
    hy: 'Հեռացրու ապրանքը իմ ամրագրումից',
    ru: 'Убери товар из моей записи',
  },
  'remove-retail-take-off-cart-en': {
    hy: 'Հեռացրու olaplex-ը զամբյուղից',
    ru: 'Убери olaplex из корзины',
  },
  'remove-retail-this-item-en': {
    hy: 'Հեռացրու այս ապրանքը զամբյուղից',
    ru: 'Убери этот товар из корзины',
  },
  'remove-retail-undo-adding-en': {
    hy: 'Ջնջիր ավելացրած retail ապրանքը',
    ru: 'Удали добавленный retail товар',
  },
  'remove-retail-line-shampoo-en': {
    hy: 'Հեռացրու shampoo ապրանքի տողը',
    ru: 'Убери товар shampoo из строки',
  },
  'remove-retail-just-added-en': {
    hy: 'Ջնջիր հենց նոր ավելացրած ապրանքի տողը',
    ru: 'Удали только что добавленный товар',
  },
};

const EXPLAIN_MESSAGE_TEMPLATES_I18N: Record<string, { hy: string; ru: string }> = {
  'explain-templates-what-can-i-send-en': {
    hy: 'Ի՞նչ ձևանմուշներ կարող եմ ուղարկել',
    ru: 'Какие шаблоны я могу отправить?',
  },
  'explain-templates-show-canned-en': {
    hy: 'Ցույց տուր canned messages-ը',
    ru: 'Покажи готовые сообщения',
  },
  'explain-templates-what-are-there-en': {
    hy: 'Ի՞նչ message templates կան',
    ru: 'Какие есть шаблоны сообщений?',
  },
  'explain-templates-list-mine-en': {
    hy: 'Ցուցակագրիր իմ canned messages-ը',
    ru: 'Перечисли мои готовые сообщения',
  },
  'explain-templates-which-have-en': {
    hy: 'Ո՞ր ձևանմուշներն ունեմ',
    ru: 'Какие у меня шаблоны?',
  },
  'explain-templates-explain-en': {
    hy: 'Բացատրիր message templates-ը',
    ru: 'Объясни шаблоны сообщений',
  },
  'explain-templates-what-can-i-use-en': {
    hy: 'Ի՞նչ canned messages կարող եմ օգտագործել',
    ru: 'Какие готовые сообщения я могу использовать?',
  },
  'explain-templates-show-me-en': {
    hy: 'Ցույց տուր ձևանմուշները',
    ru: 'Покажи шаблоны',
  },
  'explain-templates-sms-available-en': {
    hy: 'Ի՞նչ SMS templates կան հասանելի',
    ru: 'Какие SMS шаблоны доступны?',
  },
  'explain-templates-see-mine-en': {
    hy: 'Տես իմ message templates-ը',
    ru: 'Посмотри мои шаблоны сообщений',
  },
};

const NOTIFY_CLIENT_READY_I18N: Record<string, { hy: string; ru: string }> = {
  'notify-ready-chair-en': {
    hy: 'Ասա նրան որ աթոռը պատրաստ է',
    ru: 'Скажи ей что кресло готово',
  },
  'notify-ready-your-turn-en': {
    hy: "Ուղարկիր 'your turn' հաղորդագրությունը",
    ru: "Отправь сообщение 'ваша очередь'",
  },
  'notify-ready-let-him-know-en': {
    hy: 'Տեղեկացրու նրան որ պատրաստ ենք',
    ru: 'Сообщи ему что мы готовы',
  },
  'notify-ready-table-en': {
    hy: 'Ասա հաճախորդին որ սեղանը պատրաստ է',
    ru: 'Скажи клиенту что стол готов',
  },
  'notify-ready-their-turn-en': {
    hy: 'Ասա նրանց որ իրենց հերթն է',
    ru: 'Скажи им что их очередь',
  },
  'notify-ready-let-her-know-en': {
    hy: 'Տեղեկացրու նրան որ ինքը պատրաստ է',
    ru: 'Сообщи ей что она готова',
  },
  'notify-ready-for-her-en': {
    hy: 'Ասա հաճախորդին որ պատրաստ ենք նրա համար',
    ru: 'Скажи клиенту что мы готовы для неё',
  },
  'notify-ready-room-en': {
    hy: 'Տեղեկացրու նրան որ սենյակը պատրաստ է',
    ru: 'Сообщи ему что комната готова',
  },
  'notify-ready-send-message-en': {
    hy: 'Ուղարկիր նրան պատրաստության հաղորդագրություն',
    ru: 'Отправь ей сообщение о готовности',
  },
  'notify-ready-my-client-en': {
    hy: 'Ասա իմ հաճախորդին որ աթոռը պատրաստ է',
    ru: 'Скажи моему клиенту что кресло готово',
  },
};

const EXTEND_MY_BLOCK_I18N: Record<string, { hy: string; ru: string }> = {
  'extend-block-lunch-minutes-en': {
    hy: 'Երկարացրու lunch-ը 30 րոպեով',
    ru: 'Продли lunch на 30 минут',
  },
  'extend-block-push-break-en': {
    hy: 'Հետաձգիր break-ը մինչև 2:30',
    ru: 'Перенеси break на 2:30',
  },
  'extend-block-break-minutes-en': {
    hy: 'Երկարացրու իմ break-ը 15 րոպեով',
    ru: 'Продли мой break на 15 минут',
  },
  'extend-block-push-lunch-en': {
    hy: 'Հետաձգիր իմ lunch-ը մինչև 1:30pm',
    ru: 'Перенеси мой lunch на 1:30pm',
  },
  'extend-block-make-longer-en': {
    hy: 'Դարձրու իմ lunch-ը ավելի երկար',
    ru: 'Сделай мой lunch длиннее',
  },
  'extend-block-add-minutes-en': {
    hy: 'Ավելացրու 20 րոպե իմ break-ին',
    ru: 'Добавь 20 минут к моему break',
  },
  'extend-block-by-minutes-en': {
    hy: 'Երկարացրու block-ը 10 րոպեով',
    ru: 'Продли block на 10 минут',
  },
  'extend-block-push-block-en': {
    hy: 'Հետաձգիր իմ block-ը մինչև 3pm',
    ru: 'Перенеси мой block на 3pm',
  },
  'extend-block-until-en': {
    hy: 'Երկարացրու break-ը մինչև 2:45',
    ru: 'Продли break до 2:45',
  },
  'extend-block-add-mins-lunch-en': {
    hy: 'Ավելացրու 30 րոպե իմ lunch-ին',
    ru: 'Добавь 30 минут к моему lunch',
  },
};

function exp3RescueReason(action: ProviderExp3Intent): string {
  return action === 'add_retail_to_booking' ? 'add_retail_booking' : action;
}

function pushExp3MultilingualRows(
  rows: ProviderExp3MultilingualScenario[],
  enScenarioId: string,
  expectedAction: ProviderExp3Intent,
  i18n: { hy: string; ru: string; paramsPartial?: Record<string, unknown> },
): void {
  for (const locale of ['hy', 'ru'] as const) {
    rows.push({
      id: `${enScenarioId}-${locale}`,
      enScenarioId,
      locale,
      prompt: locale === 'hy' ? i18n.hy : i18n.ru,
      expectedAction,
      rescueReason: exp3RescueReason(expectedAction),
      ...(i18n.paramsPartial ? { paramsPartial: i18n.paramsPartial } : {}),
    });
  }
}

function buildProviderExp3MultilingualScenarios(): ProviderExp3MultilingualScenario[] {
  const rows: ProviderExp3MultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(RETAIL_I18N)) {
    pushExp3MultilingualRows(rows, enScenarioId, 'add_retail_to_booking', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(MESSAGE_I18N)) {
    pushExp3MultilingualRows(rows, enScenarioId, 'send_client_message', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(BLOCK_I18N)) {
    pushExp3MultilingualRows(rows, enScenarioId, 'block_my_time', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(TIME_OFF_I18N)) {
    pushExp3MultilingualRows(rows, enScenarioId, 'request_time_off', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(SET_RETAIL_LINES_I18N)) {
    pushExp3MultilingualRows(
      rows,
      enScenarioId,
      'set_retail_sales_lines',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(REMOVE_RETAIL_I18N)) {
    pushExp3MultilingualRows(
      rows,
      enScenarioId,
      'remove_retail_from_booking',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    EXPLAIN_MESSAGE_TEMPLATES_I18N,
  )) {
    pushExp3MultilingualRows(
      rows,
      enScenarioId,
      'explain_message_templates',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    NOTIFY_CLIENT_READY_I18N,
  )) {
    pushExp3MultilingualRows(rows, enScenarioId, 'notify_client_ready', i18n);
  }
  for (const [enScenarioId, i18n] of Object.entries(EXTEND_MY_BLOCK_I18N)) {
    pushExp3MultilingualRows(rows, enScenarioId, 'extend_my_block', i18n);
  }

  return rows;
}

export const PROVIDER_EXP_3_EN_SCENARIO_IDS: string[] =
  PROVIDER_EXP_3_PROMPT_SCENARIOS.filter((row) => row.id.endsWith('-en')).map(
    (row) => row.id,
  );

export const PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS: ProviderExp3MultilingualScenario[] =
  buildProviderExp3MultilingualScenarios();
