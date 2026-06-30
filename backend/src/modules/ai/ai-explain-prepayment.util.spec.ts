import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildBusinessPrepaymentExplainCopy,
  buildServicePrepaymentExplainCopy,
  enrichPrepaymentParamsFromCatalogContext,
  EXPLAIN_PREPAYMENT_PROMPTS,
  isDoIPayOnlineForServicePrompt,
  isExplainAmountDueNowPrompt,
  isExplainWhyPrepaymentPrompt,
  needsCatalogServiceClarify,
  PUBLIC_CATALOG_PREPAYMENT_PROMPTS,
  referencesCatalogServiceContext,
  rescueExplainPrepaymentIntent,
  resolveServicePrepaymentDueAmount,
} from './ai-explain-prepayment.util.js';
import { rescueExplainAmountDueNowIntent } from './ai-explain-amount-due-now.util.js';
import {
  isExplainCheckoutTotalPrompt,
  isExplainWhyStripeRequiredPrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_WHY_STRIPE_REQUIRED_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-prepayment.util (ai-cmd-ext-7.1)', () => {
  it('resolves deposit due amounts from service prepayment policy', () => {
    expect(
      resolveServicePrepaymentDueAmount({
        price: 80,
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: null,
      }),
    ).toBe(40);
    expect(
      resolveServicePrepaymentDueAmount({
        price: 80,
        prepaymentMode: PrepaymentMode.FULL,
        depositAmount: null,
      }),
    ).toBe(80);
    expect(
      resolveServicePrepaymentDueAmount({
        price: 80,
        prepaymentMode: PrepaymentMode.NONE,
        depositAmount: null,
      }),
    ).toBe(0);
  });

  it('builds why-prepayment copy when prepayment is disabled for a service', () => {
    const copy = buildServicePrepaymentExplainCopy(
      {
        name: 'Haircut',
        price: 40,
        prepaymentMode: PrepaymentMode.NONE,
        depositAmount: null,
      },
      { onlineEnabled: true, acceptCash: true },
    );
    expect(copy.summary).toContain('does not require online prepayment');
    expect(copy.amountDueNow).toBe(0);
    expect(copy.balanceAtVisit).toBe(40);
  });

  it('builds why-prepayment copy for deposit services', () => {
    const copy = buildServicePrepaymentExplainCopy(
      {
        name: 'Massage',
        price: 80,
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: null,
      },
      { onlineEnabled: true, acceptCash: true },
    );
    expect(copy.summary).toContain('50% deposit');
    expect(copy.amountDueNow).toBe(40);
    expect(copy.balanceAtVisit).toBe(40);
  });

  it('builds business-level prepayment copy when no service is named', () => {
    const copy = buildBusinessPrepaymentExplainCopy({
      onlineEnabled: true,
      acceptCash: false,
    });
    expect(copy.summary).toContain('online card payments only');
  });

  it.each(EXPLAIN_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects prepayment explain prompt $id',
    (_id, row) => {
      if (row.expectedAction === 'explain_why_stripe_required') {
        expect(
          isExplainWhyPrepaymentPrompt(row.prompt) ||
            isExplainWhyStripeRequiredPrompt(row.prompt),
        ).toBe(true);
      } else {
        expect(isExplainCheckoutTotalPrompt(row.prompt)).toBe(true);
      }
    },
  );

  it.each(EXPLAIN_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues prepayment prompt $id from unknown',
    (_id, row) => {
      const rescued = rescuePaymentsIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('routes prepayment prompts through payments rescue', () => {
    expect(
      rescuePaymentsIntent('Why prepayment for massage?', 'unknown')?.action,
    ).toBe('explain_why_stripe_required');
    expect(
      rescuePaymentsIntent('How much do I pay today for massage?', 'unknown')
        ?.action,
    ).toBe('explain_amount_due_now');
    expect(
      rescuePaymentsIntent('Do I pay online for this service?', 'unknown')
        ?.action,
    ).toBe('explain_payment_options_for_service');
    expect(
      rescuePaymentsIntent('Why must I pay now?', 'unknown')?.action,
    ).toBe('explain_why_stripe_required');
  });

  it.each(
    PUBLIC_CATALOG_PREPAYMENT_PROMPTS.filter(
      (row) => row.expectedAction === 'explain_payment_options_for_service',
    ).map((row) => [row.id, row] as const),
  )('rescues public catalog payment-options prompt $id from unknown', (_id, row) => {
    const rescued = rescuePaymentsIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe('explain_payment_options_for_service');
  });

  it.each(
    PUBLIC_CATALOG_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects public catalog prepayment prompt $id', (_id, row) => {
    if (row.expectedAction === 'explain_why_stripe_required') {
      expect(
        isDoIPayOnlineForServicePrompt(row.prompt) ||
          isExplainWhyPrepaymentPrompt(row.prompt) ||
          referencesCatalogServiceContext(row.prompt),
      ).toBe(true);
    } else if (row.expectedAction === 'explain_payment_options_for_service') {
      expect(
        isDoIPayOnlineForServicePrompt(row.prompt) ||
          referencesCatalogServiceContext(row.prompt),
      ).toBe(true);
    } else {
      expect(
        isExplainAmountDueNowPrompt(row.prompt) ||
          rescueExplainAmountDueNowIntent(row.prompt, 'unknown')?.action ===
            'explain_amount_due_now' ||
          referencesCatalogServiceContext(row.prompt),
      ).toBe(true);
    }
  });

  it.each(
    PUBLIC_CATALOG_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('enriches catalog service from session for $id', (_id, row) => {
    const enriched = enrichPrepaymentParamsFromCatalogContext(
      {},
      row.prompt,
      {
        serviceId: row.sessionServiceId,
        serviceName: row.sessionServiceName,
      },
    );
    expect(enriched.serviceId).toBe(row.sessionServiceId);
    expect(enriched.serviceName).toBe(row.sessionServiceName);
  });

  it('maps explain_why_stripe fixtures to passing eval golden cases', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_WHY_STRIPE_REQUIRED_CASES.length).toBeGreaterThanOrEqual(
      20,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_WHY_STRIPE_REQUIRED_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });

  it('requires clarify when this-service prompt has no catalog context', () => {
    expect(
      needsCatalogServiceClarify('Do I pay online for this service?', {}),
    ).toBe(true);
    expect(
      needsCatalogServiceClarify('Do I pay online for this service?', {
        serviceId: 's1',
      }),
    ).toBe(false);
  });
});
