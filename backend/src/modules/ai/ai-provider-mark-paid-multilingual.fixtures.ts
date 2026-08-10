import { PROVIDER_MARK_PAID_PROMPT_SCENARIOS } from './ai-provider-mark-paid.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderMarkPaidMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: 'mark_paid';
  rescueReason: 'mark_paid';
};

/** EN rows that already ship HY/RU siblings directly in PROVIDER_MARK_PAID_PROMPT_SCENARIOS. */
export const PROVIDER_MARK_PAID_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'mark-paid-cash-voice-en': { hy: 'mark-paid-hy', ru: 'mark-paid-ru' },
  'mark-paid-jane-cash-en': {
    hy: 'mark-paid-jane-hy',
    ru: 'mark-paid-jane-ru',
  },
};

const MARK_PAID_I18N: Record<string, { hy: string; ru: string }> = {
  'mark-paid-this-booking-en': {
    hy: 'Նշիր այս ամրագրումը որպես վճարված',
    ru: 'Отметь эту запись как оплаченную',
  },
  'mark-paid-payment-received-en': {
    hy: 'Նշիր վճարումը որպես ստացված ու վճարված',
    ru: 'Отметь платёж как полученный и оплаченный',
  },
  'mark-paid-payment-complete-en': {
    hy: 'Նշիր վճարումը որպես ամբողջությամբ վճարված',
    ru: 'Отметь платёж как полностью оплаченный',
  },
  'mark-paid-booking-en': {
    hy: 'Նշիր ամրագրումը վճարված',
    ru: 'Отметь запись как оплаченную',
  },
  'mark-paid-sam-en': {
    hy: 'Նշիր Sam-ի ամրագրումը որպես վճարված',
    ru: 'Отметь запись Sam как оплаченную',
  },
  'mark-paid-payment-done-en': {
    hy: 'Նշիր վճարումը կատարված ու վճարված',
    ru: 'Отметь платёж как выполненный и оплаченный',
  },
  'mark-paid-cash-collected-en': {
    hy: 'Նշիր սա որպես վճարված՝ կանխիկով',
    ru: 'Отметь это как оплаченное наличными',
  },
  'mark-paid-client-en': {
    hy: 'Նշիր այս հաճախորդին որպես վճարված',
    ru: 'Отметь этого клиента как оплатившего',
  },
  'mark-paid-emma-en': {
    hy: 'Նշիր Emma-ին որպես վճարված այցի համար',
    ru: 'Отметь Emma как оплатившую визит',
  },
};

function buildProviderMarkPaidMultilingualScenarios(): ProviderMarkPaidMultilingualScenario[] {
  const rows: ProviderMarkPaidMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(MARK_PAID_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'mark_paid',
        rescueReason: 'mark_paid',
      });
    }
  }

  return rows;
}

export const PROVIDER_MARK_PAID_EN_SCENARIO_IDS: string[] =
  PROVIDER_MARK_PAID_PROMPT_SCENARIOS.filter((row) =>
    row.id.endsWith('-en'),
  ).map((row) => row.id);

export const PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS: ProviderMarkPaidMultilingualScenario[] =
  buildProviderMarkPaidMultilingualScenarios();
