import {
  SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS,
  SETUP_SALON_CHECKOUT_RESCUE_SCENARIOS,
} from './ai-setup-salon-checkout-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  buildSetupSalonCheckoutCompoundParams,
  decomposeSetupSalonCheckoutCompoundPrompt,
  isSetupSalonCheckoutCompoundPrompt,
  rescueSetupSalonCheckoutCompoundIntent,
  SETUP_SALON_CHECKOUT_COMPOUND_STEP_ACTIONS,
} from './ai-setup-salon-checkout-compound.util.js';

describe('ai-setup-salon-checkout-compound.util (ai-cmd-ext-4.5)', () => {
  it.each(SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS)(
    'isSetupSalonCheckoutCompoundPrompt $id',
    ({ prompt }) => {
      expect(isSetupSalonCheckoutCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS)(
    'decomposeSetupSalonCheckoutCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeSetupSalonCheckoutCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(SETUP_SALON_CHECKOUT_COMPOUND_STEP_ACTIONS.length);
      if (expectedParams?.startOnboarding === false) {
        expect(steps[0].params.startOnboarding).toBe(false);
        expect(steps[0].params._forceConfigureStripeConnect).toBe(true);
      }
      if (expectedParams?.acceptCashPayments === true) {
        expect(steps[1].params.acceptCashPayments).toBe(true);
      }
      if (expectedParams?.allServices === true) {
        expect(steps[2].params.allServices).toBe(true);
      }
      if (expectedParams?.depositPercent === 50) {
        expect(steps[2].params.depositPercent).toBe(50);
        expect(steps[2].params.prepaymentMode).toBe('deposit');
      }
      if (expectedParams?.enabled === true) {
        expect(steps[3].params.enabled).toBe(true);
      }
    },
  );

  it.each(SETUP_SALON_CHECKOUT_RESCUE_SCENARIOS)(
    'rescueSetupSalonCheckoutCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueSetupSalonCheckoutCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'setup_salon_checkout_compound',
      });
    },
  );

  it('does not treat single configure_service_online_payment as salon checkout compound', () => {
    expect(
      isSetupSalonCheckoutCompoundPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toBe(false);
    expect(
      decomposeSetupSalonCheckoutCompoundPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toEqual([]);
  });

  it('does not treat explain_public_booking_checkout as salon checkout compound', () => {
    expect(
      isSetupSalonCheckoutCompoundPrompt(
        'Explain how cash, online payment, and gift cards work on public booking checkout',
      ),
    ).toBe(false);
  });

  it('buildSetupSalonCheckoutCompoundParams applies defaults', () => {
    const params = buildSetupSalonCheckoutCompoundParams(
      SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS[0].prompt,
    );
    expect(params).toMatchObject({
      startOnboarding: false,
      acceptCashPayments: true,
      allServices: true,
      prepaymentMode: 'deposit',
      depositPercent: 50,
      enabled: true,
    });
  });

  it('eval compound cases pass deterministic runner', () => {
    const failures: string[] = [];
    for (const evalCase of AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      if (!result.passed) {
        failures.push(`${evalCase.id}: ${result.errors.join('; ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
