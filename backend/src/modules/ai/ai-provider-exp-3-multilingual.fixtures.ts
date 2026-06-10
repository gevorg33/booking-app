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

  return rows;
}

export const PROVIDER_EXP_3_EN_SCENARIO_IDS: string[] =
  PROVIDER_EXP_3_PROMPT_SCENARIOS.filter((row) => row.id.endsWith('-en')).map(
    (row) => row.id,
  );

export const PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS: ProviderExp3MultilingualScenario[] =
  buildProviderExp3MultilingualScenarios();
