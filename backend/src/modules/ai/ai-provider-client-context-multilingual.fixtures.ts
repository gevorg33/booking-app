import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import type { ProviderClientContextIntent } from './ai-provider-client-context.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderClientContextMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderClientContextIntent;
  rescueReason: ProviderClientContextIntent;
  paramsPartial?: Record<string, unknown>;
};

/** EN rows that already ship HY/RU siblings in the main fixture table. */
export const PROVIDER_CLIENT_CONTEXT_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'summarize-this-client-en': {
    hy: 'summarize-client-hy',
    ru: 'summarize-client-ru',
  },
  'history-this-client-en': {
    hy: 'history-hy',
    ru: 'history-ru',
  },
  'note-add-en': {
    hy: 'note-hy',
    ru: 'note-ru',
  },
};

const SUMMARIZE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'summarize-client-name-en': {
    hy: 'Ինչ պետք է իմանամ Jane Doe-ի մասին այս ամրագրումից առաջ',
    ru: 'Что мне нужно знать о Jane Doe перед этой записью?',
    paramsPartial: { customerName: 'Jane Doe' },
  },
  'summarize-client-overview-en': {
    hy: 'Տվիր John-ի հաճախորդի ամփոփագիրը',
    ru: 'Дай обзор клиента John',
  },
  'summarize-client-preferences-en': {
    hy: 'Պատմիր իմ հաջորդ հաճախորդի մասին — լոյալտի կամ referral տվյալներ կա՞',
    ru: 'Расскажи о моём следующем клиенте — есть ли лояльность или реферал?',
  },
  'summarize-client-visit-count-en': {
    hy: 'Քանի անգամ է Sarah-ն եկել և երբ էր վերջին այցը',
    ru: 'Сколько раз Sarah была здесь и когда был последний визит?',
  },
  'summarize-client-no-shows-en': {
    hy: 'Mike-ի հաճախորդի snapshot — այցեր և no-show-ներ',
    ru: 'Снимок клиента Mike — визиты и no-show',
  },
  'summarize-client-before-color-en': {
    hy: 'Կարճ ամփոփիր Emma-ին նրա color service-ից առաջ',
    ru: 'Кратко расскажи об Emma перед её color service',
  },
  'summarize-client-marketing-en': {
    hy: 'Այս հաճախորդը marketing email-ներին համաձայնու՞մ է',
    ru: 'Этот клиент согласен на marketing email?',
  },
  'summarize-client-referral-en': {
    hy: 'Այս հաճախորդին referral-ով եկե՞լ է մեկը',
    ru: 'Этого клиента кто-то привёл по referral?',
  },
  'summarize-client-compound-en': {
    hy: 'Ամփոփիր Jane-ին; ցույց տուր նրա loyalty balance-ը',
    ru: 'Кратко расскажи о Jane; покажи её loyalty balance',
  },
};

const HISTORY_I18N: Record<string, { hy: string; ru: string }> = {
  'history-past-visits-en': {
    hy: 'Jane-ի նախկին ամրագրումներն այստեղ',
    ru: 'Прошлые записи Jane здесь',
  },
  'history-last-visit-en': {
    hy: 'Ե՞րբ էր John-ի վերջին այցը և ինչ service էր',
    ru: 'Когда John был в последний раз и какая была услуга?',
  },
  'history-recent-visits-en': {
    hy: 'Ցուցակ Sarah-ի վերջին completed visits-ը',
    ru: 'Список последних completed visits для Sarah',
  },
  'history-previous-services-en': {
    hy: 'Ինչ service-ներ է Mike-ն ստացել նախկին այցերում',
    ru: 'Какие service Mike получал на прошлых визитах?',
  },
  'history-client-record-en': {
    hy: 'Ցույց տուր Emma-ի visit record-ը',
    ru: 'Покажи visit record для Emma',
  },
  'history-prior-bookings-en': {
    hy: 'Նախորդ bookings-ը այս customer-ի համար',
    ru: 'Prior bookings для этого customer',
  },
  'history-completed-en': {
    hy: 'Իմ client-ի վերջին completed visits-ը այսօր',
    ru: 'Recent completed visits моего client сегодня',
  },
  'history-who-saw-en': {
    hy: 'Ո՞վ էր Jane-ին տեսել վերջին անգամ',
    ru: 'Кто видел Jane в последний раз?',
  },
};

const NOTE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'note-remember-en': {
    hy: 'Հիշիր, որ Jane-ը նախընտրում է quiet chair',
    ru: 'Запомни, что Jane предпочитает quiet chair',
  },
  'note-client-en': {
    hy: 'Ավելացրու note այս client-ի համար — extra toner է ուզում',
    ru: 'Добавь note для этого client — хочет extra toner',
  },
  'note-internal-en': {
    hy: 'Staff note: VIP — միշտ առաջարկել tea',
    ru: 'Staff note: VIP — всегда предлагать tea',
  },
  'note-quick-en': {
    hy: 'Note John-ի համար: sensitive scalp',
    ru: 'Note для John: sensitive scalp',
  },
  'note-save-en': {
    hy: 'Save client note — սովորաբար 10 րոպե ուշ է գալիս',
    ru: 'Save client note — обычно опаздывает на 10 минут',
  },
  'note-write-en': {
    hy: 'Գրիր նշոն Sarah-ի մասին՝ patch test on file',
    ru: 'Напиши заметку о Sarah: patch test on file',
  },
  'note-log-en': {
    hy: 'Log staff note Mike-ի համար: prefers Anna',
    ru: 'Log staff note для Mike: prefers Anna',
  },
  'note-this-booking-en': {
    hy: 'Ավելացրու նշum այս ամրագրության հաճախորդին՝ bring own product',
    ru: 'Добавь заметку клиенту этой записи: bring own product',
  },
};

function pushClientContextMultilingualRows(
  rows: ProviderClientContextMultilingualScenario[],
  enScenarioId: string,
  expectedAction: ProviderClientContextIntent,
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

function buildProviderClientContextMultilingualScenarios(): ProviderClientContextMultilingualScenario[] {
  const rows: ProviderClientContextMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(SUMMARIZE_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'summarize_client',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(HISTORY_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'show_client_history',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(NOTE_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'add_client_note',
      i18n,
    );
  }

  return rows;
}

export const PROVIDER_CLIENT_CONTEXT_EN_SCENARIO_IDS: string[] =
  PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS.filter((row) =>
    row.id.endsWith('-en'),
  ).map((row) => row.id);

export const PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS: ProviderClientContextMultilingualScenario[] =
  buildProviderClientContextMultilingualScenarios();
