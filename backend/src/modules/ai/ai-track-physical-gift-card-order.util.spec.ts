import {
  CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS,
  detectTrackPhysicalGiftCardOrderAction,
  enrichTrackPhysicalGiftCardOrderParamsFromPrompt,
  isTrackPhysicalGiftCardOrderCustomerPrompt,
  rescueTrackPhysicalGiftCardOrderIntent,
} from './ai-track-physical-gift-card-order.util.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS } from './ai-track-physical-gift-card-order-multilingual.fixtures.js';
import {
  isTrackPhysicalGiftCardPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { isBuyGiftCardPhysicalPrompt } from './ai-payments.util.js';
import { AI_COMMAND_EVAL_TRACK_PHYSICAL_GIFT_CARD_ORDER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-track-physical-gift-card-order.util (ai-cmd-customer-4.6.4)', () => {
  it('exports classifier rules for track_physical_gift_card_order', () => {
    expect(CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES).toContain(
      'track_physical_gift_card_order',
    );
  });

  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS.map((row) => [row.id, row] as const),
  )('detects track_physical_gift_card_order for $id', (_id, row) => {
    expect(isTrackPhysicalGiftCardOrderCustomerPrompt(row.prompt)).toBe(true);
    expect(isTrackPhysicalGiftCardPrompt(row.prompt)).toBe(true);
    expect(detectTrackPhysicalGiftCardOrderAction(row.prompt)).toBe(
      row.expectedAction,
    );
    expect(
      rescueTrackPhysicalGiftCardOrderIntent(row.prompt, 'unknown')?.action,
    ).toBe(row.expectedAction);
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'detects multilingual track_physical_gift_card_order for $id',
    (_id, row) => {
      expect(isTrackPhysicalGiftCardOrderCustomerPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(
    TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueTrackPhysicalGiftCardOrderIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('track_physical_gift_card_order');
  });

  it('rejects list, purchase-only, and empty prompts', () => {
    expect(isTrackPhysicalGiftCardOrderCustomerPrompt('')).toBe(false);
    expect(
      isTrackPhysicalGiftCardOrderCustomerPrompt('Show my gift cards'),
    ).toBe(false);
    expect(
      isTrackPhysicalGiftCardOrderCustomerPrompt('What gift cards can I buy'),
    ).toBe(false);
    expect(
      isTrackPhysicalGiftCardOrderCustomerPrompt('Buy physical gift card $100'),
    ).toBe(false);
    expect(isBuyGiftCardPhysicalPrompt('Buy physical gift card $100')).toBe(
      true,
    );
    expect(
      isTrackPhysicalGiftCardOrderCustomerPrompt('Cancel my gift card order'),
    ).toBe(false);
  });

  it('enriches giftCardId from prompt when present', () => {
    expect(
      enrichTrackPhysicalGiftCardOrderParamsFromPrompt(
        {},
        'Track gift card order 550e8400-e29b-41d4-a716-446655440099',
      ).giftCardId,
    ).toBe('550e8400-e29b-41d4-a716-446655440099');
  });

  it('maps track fixtures to passing eval golden cases', () => {
    expect(
      TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS.length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_TRACK_PHYSICAL_GIFT_CARD_ORDER_CASES.length).toBe(
      TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS.length +
        TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS.length +
        TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_TRACK_PHYSICAL_GIFT_CARD_ORDER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
