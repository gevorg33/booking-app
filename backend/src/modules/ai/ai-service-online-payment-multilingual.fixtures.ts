import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS,
  SERVICE_ONLINE_PAYMENT_PROMPTS,
  type ServiceOnlinePaymentPromptFixture,
} from './ai-service-online-payment.util.js';

export type ServiceOnlinePaymentMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: 'configure_service_online_payment';
  rescueReason: 'service_online_payment';
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
};

/** Armenian/Russian dashboard service online payment (ai-cmd-ext-2.13.2). */
export const SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian configure_service_online_payment (dashboard):
  - Accept/enable: hy «ընդունել/միացնել/կարգավոր/պահանջել» + online payment + public booking + for all services / for Massage / for Haircut and Blowdry / for massage services + prepayment/deposit/half/full; ru «принять/включить/настроить/требовать» + online payment + public booking + same Latin scope tokens.
  - Decline/disable: hy «մերժել/անջատել/դադարեցնել/չընդունել» + online payment + public booking + same scope; ru «отклонить/отключить/прекратить/не принимать» + online payment + public booking + same scope.
  - Keep Latin service names (Massage, Haircut, Blowdry, Facial, Peel), scope tokens (all services, every service, some services, public booking), prepayment/deposit percentages, and Stripe checkout inside hy/ru sentences.
  - NOT configure_cash_payments, NOT configure_online_booking (page toggle), NOT update_service_prices.`;

const SERVICE_ONLINE_PAYMENT_I18N: Record<string, { hy: string; ru: string }> =
  {
    'all-services-50-deposit': {
      hy: 'Ընդունել online payment on public booking for all services with 50% prepayment',
      ru: 'Принять online payment on public booking for all services with 50% prepayment',
    },
    'all-services-full': {
      hy: 'Միացնել online payment on public booking for all services with full prepayment',
      ru: 'Включить online payment on public booking for all services with full prepayment',
    },
    'specific-service-deposit': {
      hy: 'Ընդունել online payment on public booking for Massage with 50% deposit',
      ru: 'Принять online payment on public booking for Massage with 50% deposit',
    },
    'named-services-deposit': {
      hy: 'Պահանջել online payment on public booking for Haircut and Blowdry with half prepayment',
      ru: 'Требовать online payment on public booking for Haircut and Blowdry with half prepayment',
    },
    'category-services-full': {
      hy: 'Ընդունել online payment on public booking for massage services with full prepayment',
      ru: 'Принять online payment on public booking for massage services with full prepayment',
    },
    'some-services-25': {
      hy: 'Կարգավորել online payment on public booking for some services — Facial and Peel — with 25% prepayment',
      ru: 'Настроить online payment on public booking for some services — Facial and Peel — with 25% prepayment',
    },
    'disable-specific': {
      hy: 'Անջատել online payment on public booking for Neck Massage service',
      ru: 'Отключить online payment on public booking for Neck Massage service',
    },
    'disable-all': {
      hy: 'Անջատել online payment on public booking for all services',
      ru: 'Отключить online payment on public booking for all services',
    },
    'fixed-deposit-dollar': {
      hy: 'Ընդունել online payment on public booking for Color service with $20 deposit',
      ru: 'Принять online payment on public booking for Color service with $20 deposit',
    },
    'stripe-all-half': {
      hy: 'Պահանջել Stripe checkout on public booking for every service with half prepayment',
      ru: 'Требовать Stripe checkout on public booking for every service with half prepayment',
    },
    'public-booking-single-full': {
      hy: 'Կարգավորել public booking to accept online payment for Manicure — pay in full upfront',
      ru: 'Настроить public booking to accept online payment for Manicure — pay in full upfront',
    },
    'category-disable': {
      hy: 'Դադարեցնել ընդունել online payment on public booking for dental services',
      ru: 'Прекратить принимать online payment on public booking for dental services',
    },
    'decline-all-services': {
      hy: 'Մերժել online payment on public booking for all services',
      ru: 'Отклонить online payment on public booking for all services',
    },
    'decline-specific-service': {
      hy: 'Մերժել online payment on public booking for Massage',
      ru: 'Отклонить online payment on public booking for Massage',
    },
    'decline-named-services': {
      hy: 'Մերժել online payment on public booking for Haircut and Blowdry',
      ru: 'Отклонить online payment on public booking for Haircut and Blowdry',
    },
    'decline-category-services': {
      hy: 'Մերժել online payment on public booking for massage services',
      ru: 'Отклонить online payment on public booking for massage services',
    },
    'decline-some-services': {
      hy: 'Չընդունել online payment on public booking for some services — Facial and Peel',
      ru: 'Не принимать online payment on public booking for some services — Facial and Peel',
    },
    'decline-single-service-suffix': {
      hy: 'Մերժել ընդունել online payment on public booking for Color service',
      ru: 'Отклонить принимать online payment on public booking for Color service',
    },
    'decline-every-service': {
      hy: 'Մերժել online payment on public booking for every service',
      ru: 'Отказаться от online payment on public booking for every service',
    },
  };

const EN_BY_ID = new Map<string, ServiceOnlinePaymentPromptFixture>(
  SERVICE_ONLINE_PAYMENT_PROMPTS.map((row) => [row.id, row]),
);

function buildServiceOnlinePaymentMultilingualScenarios(): ServiceOnlinePaymentMultilingualScenario[] {
  const rows: ServiceOnlinePaymentMultilingualScenario[] = [];
  for (const enScenarioId of SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS) {
    const i18n = SERVICE_ONLINE_PAYMENT_I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) {
      throw new Error(
        `Missing service online payment i18n for EN scenario ${enScenarioId}`,
      );
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: enRow.expectedAction,
        rescueReason: 'service_online_payment',
        ...(enRow.paramsPartial ? { paramsPartial: enRow.paramsPartial } : {}),
        needsMultilingual: true,
      });
    }
  }
  return rows;
}

export const SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS =
  buildServiceOnlinePaymentMultilingualScenarios();
