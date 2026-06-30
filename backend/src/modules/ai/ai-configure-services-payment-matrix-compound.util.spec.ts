import {
  CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS,
  CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_SCENARIOS,
} from './ai-configure-services-payment-matrix-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  decomposeConfigureServicesPaymentMatrixCompoundPrompt,
  extractCategoryPaymentRowsFromPrompt,
  isConfigureServicesPaymentMatrixCompoundPrompt,
  rescueConfigureServicesPaymentMatrixCompoundIntent,
} from './ai-configure-services-payment-matrix-compound.util.js';

describe('ai-configure-services-payment-matrix-compound.util (ai-cmd-ext-4.6)', () => {
  it.each(CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS)(
    'isConfigureServicesPaymentMatrixCompoundPrompt $id',
    ({ prompt }) => {
      expect(isConfigureServicesPaymentMatrixCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS)(
    'decomposeConfigureServicesPaymentMatrixCompoundPrompt $id',
    ({ prompt, orderedActions, categorySteps, expectedParams }) => {
      const steps = decomposeConfigureServicesPaymentMatrixCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps.at(-1)?.action).toBe('configure_cash_payments');

      if (categorySteps?.length) {
        const paymentSteps = steps.filter(
          (step) => step.action === 'configure_service_online_payment',
        );
        expect(paymentSteps).toHaveLength(categorySteps.length);
        categorySteps.forEach((expected, index) => {
          expect(paymentSteps[index].params.categoryName).toBe(
            expected.categoryName,
          );
          expect(paymentSteps[index].params.prepaymentMode).toBe(
            expected.prepaymentMode,
          );
          if (expected.depositPercent != null) {
            expect(paymentSteps[index].params.depositPercent).toBe(
              expected.depositPercent,
            );
          }
        });
      }

      if (expectedParams?.percentChange != null) {
        const priceStep = steps.find(
          (step) => step.action === 'update_service_prices',
        );
        expect(priceStep?.params.percentChange).toBe(expectedParams.percentChange);
      }
      if (expectedParams?.acceptCashPayments === true) {
        expect(steps.at(-1)?.params.acceptCashPayments).toBe(true);
      }
    },
  );

  it.each(CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_SCENARIOS)(
    'rescueConfigureServicesPaymentMatrixCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueConfigureServicesPaymentMatrixCompoundIntent(
          prompt,
          misclassifiedAction!,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'configure_services_payment_matrix_compound',
      });
    },
  );

  it('does not treat single category online payment as payment matrix', () => {
    expect(
      isConfigureServicesPaymentMatrixCompoundPrompt(
        'Accept online payment on public booking for massage services with full prepayment',
      ),
    ).toBe(false);
  });

  it('does not treat setup_salon_checkout as payment matrix', () => {
    expect(
      isConfigureServicesPaymentMatrixCompoundPrompt(
        'Set up salon checkout end-to-end: connect Stripe, enable cash, online prepayment on all services, enable booking',
      ),
    ).toBe(false);
  });

  it('extractCategoryPaymentRowsFromPrompt parses colon matrix rows', () => {
    expect(
      extractCategoryPaymentRowsFromPrompt(
        'massage: full prepayment; hair: 50% deposit',
      ),
    ).toEqual([
      { categoryName: 'massage', prepaymentMode: 'full' },
      {
        categoryName: 'hair',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    ]);
  });

  it('eval compound cases pass deterministic runner', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
