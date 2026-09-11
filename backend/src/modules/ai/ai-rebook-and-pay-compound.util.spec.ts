import {
  REBOOK_AND_PAY_COMPOUND_PROMPTS,
  REBOOK_AND_PAY_CUSTOMER_PROMPTS,
  REBOOK_AND_PAY_NEGATIVE_PROMPTS,
  REBOOK_AND_PAY_RESCUE_SCENARIOS,
} from './ai-rebook-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-rebook-and-pay-compound-multilingual.fixtures.js';
import {
  buildRebookAndPayCompoundParams,
  decomposeRebookAndPayCompoundPrompt,
  hasRebookAndPayPaymentCue,
  isRebookAndPayCompoundPrompt,
  resolveRebookAndPayPaymentAction,
  rescueRebookAndPayCompoundIntent,
} from './ai-rebook-and-pay-compound.util.js';

describe('ai-rebook-and-pay-compound.util (ai-cmd-customer-4.8.2)', () => {
  it.each(REBOOK_AND_PAY_CUSTOMER_PROMPTS)(
    'isRebookAndPayCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isRebookAndPayCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(REBOOK_AND_PAY_COMPOUND_PROMPTS)(
    'decomposeRebookAndPayCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams, paymentAction }) => {
      const steps = decomposeRebookAndPayCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(2);
      if (expectedParams?.serviceName) {
        expect(steps[0].params.serviceName).toBe(expectedParams.serviceName);
      }
      if (paymentAction) {
        expect(steps[1].action).toBe(paymentAction);
      }
    },
  );

  it.each(REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS)(
    'decomposeRebookAndPayCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeRebookAndPayCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(REBOOK_AND_PAY_RESCUE_SCENARIOS)(
    'rescueRebookAndPayCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueRebookAndPayCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'rebook_and_pay_compound',
      });
    },
  );

  it.each(REBOOK_AND_PAY_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isRebookAndPayCompoundPrompt(prompt)).toBe(false);
      expect(decomposeRebookAndPayCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('resolveRebookAndPayPaymentAction prefers choose_payment_method', () => {
    expect(
      resolveRebookAndPayPaymentAction(
        'Rebook my last appointment and choose payment method at checkout',
      ),
    ).toBe('choose_payment_method');
    expect(
      resolveRebookAndPayPaymentAction(
        'Rebook my last visit and pay with card',
      ),
    ).toBe('pay_online');
  });

  it('buildRebookAndPayCompoundParams extracts service name', () => {
    const params = buildRebookAndPayCompoundParams(
      'Rebook my last haircut and pay with card',
    );
    expect(params.serviceName).toBe('haircut');
  });

  it('rescueRebookAndPayCompoundIntent returns null for non-compound', () => {
    expect(
      rescueRebookAndPayCompoundIntent(
        'Rebook my last appointment',
        'rebook_last_appointment',
      ),
    ).toBeNull();
  });

  it('hasRebookAndPayPaymentCue accepts payment options phrasing', () => {
    expect(
      hasRebookAndPayPaymentCue(
        'Repeat last appointment; what payment options at checkout',
      ),
    ).toBe(true);
  });

  it('detects heuristic rebook and pay without fixture id', () => {
    const prompt = 'Schedule the same service again and pay online with card';
    expect(isRebookAndPayCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeRebookAndPayCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'rebook_last_appointment',
      'pay_online',
    ]);
  });
});
