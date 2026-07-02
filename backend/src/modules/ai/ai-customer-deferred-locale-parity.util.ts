import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from './ai-switch-salon-tenant-multilingual.fixtures.js';
import { CONSUMER_ADOPTION_INTENTS } from './ai-consumer-adoption.util.js';
import { CUSTOMER_INTENT_COVERAGE_DEFERRED } from './ai-customer-intent-coverage.util.js';
import { SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-self-service-booking-multilingual.fixtures.js';
import {
  listSelfServiceBookingEvalLocaleParityGaps,
  listSelfServiceBookingLocaleParityGaps,
} from './ai-self-service-booking-multilingual.eval.util.js';
import { MARKETING_GROWTH_MULTILINGUAL_SCENARIOS } from './ai-marketing-growth-multilingual.fixtures.js';
import { listMarketingGrowthEvalLocaleParityGaps } from './ai-marketing-growth-multilingual.eval.util.js';
import {
  CONSUMER_CHECKOUT_SUCCESS_EN_SCENARIO_IDS,
  CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS,
} from './ai-consumer-checkout-success-multilingual.fixtures.js';
import { listConsumerCheckoutSuccessEvalLocaleParityGaps } from './ai-consumer-checkout-success-multilingual.eval.util.js';
import {
  CONSUMER_CHECKOUT_TAX_EN_SCENARIO_IDS,
  CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS,
} from './ai-consumer-checkout-tax-multilingual.fixtures.js';
import { listConsumerCheckoutTaxEvalLocaleParityGaps } from './ai-consumer-checkout-tax-multilingual.eval.util.js';
import {
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_EN_SCENARIO_IDS,
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS,
} from './ai-consumer-clinic-test-results-deferred-multilingual.fixtures.js';
import { listConsumerClinicTestResultsDeferredEvalLocaleParityGaps } from './ai-consumer-clinic-test-results-deferred-multilingual.eval.util.js';
import { CONSUMER_CLINIC_TEST_RESULTS_INTENTS } from './ai-consumer-clinic-test-results.util.js';
import { CUSTOMER_MARKETING_GROWTH_INTENTS } from './ai-marketing-growth.util.js';
import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';

export type CustomerDeferredLocaleParityGap = {
  domain: string;
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

type LocaleParityScenario = {
  id: string;
  expectedAction: string;
};

function listEnLocaleSiblingGaps(
  domain: string,
  scenarios: readonly LocaleParityScenario[],
): CustomerDeferredLocaleParityGap[] {
  const byId = new Map(scenarios.map((row) => [row.id, row]));
  const gaps: CustomerDeferredLocaleParityGap[] = [];

  for (const row of scenarios) {
    if (!row.id.endsWith('-en')) continue;
    const baseId = row.id.slice(0, -3);
    const missingLocales: AiEvalLocale[] = [];
    if (!byId.has(`${baseId}-hy`)) missingLocales.push('hy');
    if (!byId.has(`${baseId}-ru`)) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      domain,
      enScenarioId: row.id,
      intent: row.expectedAction,
      missingLocales,
    });
  }

  return gaps;
}

/** acc-2.4 — every EN consumer-adoption row needs HY + RU siblings. */
export function listConsumerAdoptionLocaleParityGaps(
  scenarios: readonly LocaleParityScenario[] = [
    ...FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS,
    ...SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS,
  ],
): CustomerDeferredLocaleParityGap[] {
  return listEnLocaleSiblingGaps('consumer-adoption', scenarios);
}

export function listSelfServiceBookingDeferredLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  return listEnLocaleSiblingGaps(
    'self-service-booking',
    SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS,
  );
}

export function listMarketingGrowthDeferredLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  return listEnLocaleSiblingGaps(
    'marketing-growth',
    MARKETING_GROWTH_MULTILINGUAL_SCENARIOS,
  );
}

export function listConsumerCheckoutSuccessDeferredLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();
  for (const enId of CONSUMER_CHECKOUT_SUCCESS_EN_SCENARIO_IDS) {
    byEnId.set(enId, {
      hy: false,
      ru: false,
      intent: 'explain_consumer_checkout_success',
    });
  }
  for (const row of CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  const gaps: CustomerDeferredLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      domain: 'consumer-checkout-success',
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}

export function listConsumerCheckoutTaxDeferredLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();
  for (const enId of CONSUMER_CHECKOUT_TAX_EN_SCENARIO_IDS) {
    byEnId.set(enId, {
      hy: false,
      ru: false,
      intent: 'explain_consumer_checkout_tax',
    });
  }
  for (const row of CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  const gaps: CustomerDeferredLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      domain: 'consumer-checkout-tax',
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}

export function listConsumerClinicTestResultsDeferredLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();
  for (const enId of CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_EN_SCENARIO_IDS) {
    byEnId.set(enId, { hy: false, ru: false, intent: '' });
  }
  for (const row of CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  const gaps: CustomerDeferredLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      domain: 'consumer-clinic-test-results',
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}

export function listDeferredCustomerLocaleParityGaps(): CustomerDeferredLocaleParityGap[] {
  return [
    ...listConsumerAdoptionLocaleParityGaps(),
    ...listSelfServiceBookingDeferredLocaleParityGaps(),
    ...listMarketingGrowthDeferredLocaleParityGaps(),
    ...listConsumerCheckoutSuccessDeferredLocaleParityGaps(),
    ...listConsumerCheckoutTaxDeferredLocaleParityGaps(),
    ...listConsumerClinicTestResultsDeferredLocaleParityGaps(),
  ];
}

/** Saved-salon i18n rows (ai-cmd-customer-4.17.4) — replaces empty CONSUMER_ADOPTION_PROMPT_SCENARIOS. */
export const CONSUMER_ADOPTION_I18N_SCENARIOS: readonly LocaleParityScenario[] =
  [
    ...FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS,
    ...SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS,
  ];

export function consumerAdoptionEvalCaseId(
  scenarioId: string,
  expectedAction?: string,
): string {
  if (expectedAction === 'find_my_saved_salons') {
    return `find-saved-salons-${scenarioId}`;
  }
  if (expectedAction === 'switch_salon_tenant') {
    return `switch-salon-${scenarioId}`;
  }
  return `consumer-adoption-${scenarioId}`;
}

export function listConsumerAdoptionEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly LocaleParityScenario[] = CONSUMER_ADOPTION_I18N_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  const gaps: string[] = [];

  for (const scenario of scenarios) {
    const evalId = consumerAdoptionEvalCaseId(
      scenario.id,
      scenario.expectedAction,
    );
    if (!evalIds.has(evalId)) {
      gaps.push(`${evalId}: missing eval case`);
    }
  }

  return gaps;
}

export function listDeferredCustomerEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
): string[] {
  return [
    ...listConsumerAdoptionEvalLocaleParityGaps(evalCases),
    ...listSelfServiceBookingEvalLocaleParityGaps(evalCases),
    ...listMarketingGrowthEvalLocaleParityGaps(evalCases),
    ...listConsumerCheckoutSuccessEvalLocaleParityGaps(evalCases),
    ...listConsumerCheckoutTaxEvalLocaleParityGaps(evalCases),
    ...listConsumerClinicTestResultsDeferredEvalLocaleParityGaps(evalCases),
  ];
}

export function registeredDeferredConsumerAdoptionIntents(): string[] {
  return CONSUMER_ADOPTION_INTENTS.filter((intent) =>
    CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent),
  );
}

export function registeredDeferredMarketingGrowthIntents(): string[] {
  return CUSTOMER_MARKETING_GROWTH_INTENTS.filter((intent) =>
    CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent),
  );
}

export function registeredDeferredConsumerClinicTestResultsIntents(): string[] {
  return CONSUMER_CLINIC_TEST_RESULTS_INTENTS.filter((intent) =>
    CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent),
  );
}

export function assertDeferredIntentsTracked(
  intents: readonly string[],
): string[] {
  return intents.filter(
    (intent) => !CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent),
  );
}

export { listSelfServiceBookingLocaleParityGaps };
