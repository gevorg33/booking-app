import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES,
  EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS,
  detectExplainPaymentOptionsForServiceAction,
  enrichExplainPaymentOptionsParamsFromPrompt,
  enrichPaymentOptionsParamsFromCatalogContext,
  extractServiceNameForPaymentOptionsPrompt,
  isExplainPaymentOptionsForServicePrompt,
  needsPaymentOptionsServiceClarify,
  rescueExplainPaymentOptionsForServiceIntent,
} from './ai-explain-payment-options-for-service.util.js';
import { EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS } from './ai-explain-payment-options-for-service-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { rescueCashPaymentCheckoutIntent } from './ai-cash-payment-checkout.util.js';

describe('ai-explain-payment-options-for-service.util (ai-cmd-customer-4.1.2)', () => {
  it('exports classifier rules for explain_payment_options_for_service', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES,
    ).toContain('explain_payment_options_for_service');
  });

  it.each(
    EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects explain-payment-options prompt $id', (_id, row) => {
    expect(isExplainPaymentOptionsForServicePrompt(row.prompt)).toBe(true);
    expect(detectExplainPaymentOptionsForServiceAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain-payment-options prompt $id', (_id, row) => {
    expect(isExplainPaymentOptionsForServicePrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainPaymentOptionsForServiceIntent(row.prompt, 'unknown')
        ?.action,
    ).toBe('explain_payment_options_for_service');
  });

  it.each(
    EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues explain-payment-options prompt $id from unknown', (_id, row) => {
    const rescued = rescueExplainPaymentOptionsForServiceIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
    expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_payment_options_for_service',
    );
    expect(rescueCashPaymentCheckoutIntent(row.prompt, 'unknown')).toBeNull();
  });

  it('extracts service names from payment-options phrasing', () => {
    expect(
      extractServiceNameForPaymentOptionsPrompt('Do I pay online for color?'),
    ).toBe('color');
    expect(
      extractServiceNameForPaymentOptionsPrompt('Can I pay cash for massage?'),
    ).toBe('massage');
    expect(
      enrichExplainPaymentOptionsParamsFromPrompt(
        {},
        'Can I pay cash for massage?',
      ).serviceName,
    ).toBe('massage');
  });

  it('disambiguates why prepayment and checkout-wide payment options', () => {
    expect(
      isExplainPaymentOptionsForServicePrompt(
        'Why must I pay online for color?',
      ),
    ).toBe(false);
    expect(
      isExplainPaymentOptionsForServicePrompt(
        'What payment options do I have?',
      ),
    ).toBe(false);
    expect(isExplainPaymentOptionsForServicePrompt('Pay cash at visit')).toBe(
      false,
    );
  });

  it('requires clarify for deictic service prompts without catalog context', () => {
    expect(
      needsPaymentOptionsServiceClarify(
        'Do I pay online for this service?',
        {},
      ),
    ).toBe(true);
    expect(
      needsPaymentOptionsServiceClarify('Do I pay online for this service?', {
        serviceId: 's1',
      }),
    ).toBe(false);
  });

  it('enriches catalog service from session context', () => {
    const enriched = enrichPaymentOptionsParamsFromCatalogContext(
      {},
      'Do I pay online for this service?',
      { serviceId: 's1', serviceName: 'Massage' },
    );
    expect(enriched.serviceId).toBe('s1');
    expect(enriched.serviceName).toBe('Massage');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      AI_COMMAND_EVAL_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CASES.length,
    ).toBe(
      EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.length +
        EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });

  it('documents prepayment modes used in catalog fixtures', () => {
    expect(PrepaymentMode.DEPOSIT).toBeDefined();
  });
});
