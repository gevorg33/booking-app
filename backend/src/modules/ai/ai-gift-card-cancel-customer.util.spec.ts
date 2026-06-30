import {
  CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES,
  GIFT_CARD_CANCEL_CUSTOMER_PROMPTS,
  detectGiftCardCancelCustomerAction,
  enrichRequestGiftCardCancelParamsFromPrompt,
  rescueGiftCardCancelCustomerIntent,
} from './ai-gift-card-cancel-customer.util.js';
import {
  isRequestGiftCardCancelPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { isCancelGiftCardOrderPrompt } from './ai-gift-fulfillment.util.js';
import { isCancelMyBookingPrompt } from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_GIFT_CARD_CANCEL_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-gift-card-cancel-customer.util (ai-cmd-customer-4.0 P2)', () => {
  it('exports classifier rules for gift card cancel request', () => {
    expect(CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES).toContain(
      'request_gift_card_cancel',
    );
  });

  it.each(
    GIFT_CARD_CANCEL_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('detects gift card cancel prompt $id', (_id, row) => {
    expect(isRequestGiftCardCancelPrompt(row.prompt)).toBe(true);
    expect(detectGiftCardCancelCustomerAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    GIFT_CARD_CANCEL_CUSTOMER_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues gift card cancel prompt $id from unknown', (_id, row) => {
    const rescued = rescueGiftCardCancelCustomerIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it('enriches giftCardId from prompt when present', () => {
    expect(
      enrichRequestGiftCardCancelParamsFromPrompt(
        {},
        'Cancel my gift card order 550e8400-e29b-41d4-a716-446655440000',
      ).giftCardId,
    ).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('does not steal dashboard cancel, booking cancel, or list prompts', () => {
    expect(isRequestGiftCardCancelPrompt('Cancel gift card order')).toBe(false);
    expect(isCancelGiftCardOrderPrompt('Cancel gift card order')).toBe(true);
    expect(
      rescueGiftCardCancelCustomerIntent('Cancel gift card order', 'unknown'),
    ).toBeNull();

    expect(isCancelMyBookingPrompt('Cancel my appointment tomorrow')).toBe(
      true,
    );
    expect(
      detectGiftCardCancelCustomerAction('Cancel my appointment tomorrow'),
    ).toBeNull();

    expect(isRequestGiftCardCancelPrompt('Show my gift cards')).toBe(false);
    expect(
      rescueGiftCardCancelCustomerIntent('Show my gift cards', 'unknown'),
    ).toBeNull();
  });

  it('maps gift card cancel fixtures to passing eval golden cases', () => {
    expect(GIFT_CARD_CANCEL_CUSTOMER_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_GIFT_CARD_CANCEL_CUSTOMER_CASES.length).toBe(
      GIFT_CARD_CANCEL_CUSTOMER_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_GIFT_CARD_CANCEL_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
