import {
  SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS,
  SERVICE_ONLINE_PAYMENT_PROMPTS,
} from './ai-service-online-payment.util.js';
import { SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS } from './ai-service-online-payment-multilingual.fixtures.js';
import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';

export type ServiceOnlinePaymentLocaleParityGap = {
  enScenarioId: string;
  intent: string;
  missingLocales: AiEvalLocale[];
};

export function serviceOnlinePaymentEnEvalCaseId(enScenarioId: string): string {
  return `service-online-payment-${enScenarioId}`;
}

export function serviceOnlinePaymentMultilingualEvalCaseId(
  scenarioId: string,
): string {
  return `service-online-payment-i18n-${scenarioId}`;
}

/** acc-2.4 / parity-2.4 — EN service online payment rows need HY + RU fixture siblings. */
export function listServiceOnlinePaymentLocaleParityGaps(): ServiceOnlinePaymentLocaleParityGap[] {
  const byEnId = new Map<
    string,
    { hy: boolean; ru: boolean; intent: string }
  >();

  for (const enScenarioId of SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS) {
    byEnId.set(enScenarioId, { hy: false, ru: false, intent: '' });
  }

  for (const row of SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS) {
    const slot = byEnId.get(row.enScenarioId);
    if (!slot) continue;
    slot.intent = row.expectedAction;
    if (row.locale === 'hy') slot.hy = true;
    if (row.locale === 'ru') slot.ru = true;
  }

  for (const row of SERVICE_ONLINE_PAYMENT_PROMPTS) {
    const slot = byEnId.get(row.id);
    if (slot && !slot.intent) slot.intent = row.expectedAction;
  }

  const gaps: ServiceOnlinePaymentLocaleParityGap[] = [];
  for (const [enScenarioId, slot] of byEnId.entries()) {
    const missingLocales: AiEvalLocale[] = [];
    if (!slot.hy) missingLocales.push('hy');
    if (!slot.ru) missingLocales.push('ru');
    if (missingLocales.length === 0) continue;
    gaps.push({
      enScenarioId,
      intent: slot.intent,
      missingLocales,
    });
  }
  return gaps;
}

export function listServiceOnlinePaymentEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  const gaps: string[] = [];

  for (const enScenarioId of SERVICE_ONLINE_PAYMENT_EN_SCENARIO_IDS) {
    const enEvalId = serviceOnlinePaymentEnEvalCaseId(enScenarioId);
    if (!evalIds.has(enEvalId)) {
      gaps.push(`${enEvalId}: missing EN eval case`);
    }
  }

  for (const row of SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS) {
    const evalId = serviceOnlinePaymentMultilingualEvalCaseId(row.id);
    if (!evalIds.has(evalId)) {
      gaps.push(`${evalId}: missing HY/RU eval case`);
    }
  }

  return gaps;
}
