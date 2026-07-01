import {
  BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
  BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS,
} from './ai-buy-gift-card-for-someone.fixtures.js';
import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';

describe('customer buy_gift_card_for_someone integration (ai-cmd-customer-4.16.4)', () => {
  it.each(
    [
      ...BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
      ...BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues buy_gift_card_for_someone for $0', (_id, prompt) => {
    expect(rescuePaymentsIntent(prompt, 'unknown')?.action).toBe(
      'buy_gift_card_for_someone',
    );
  });

  it.each(BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(rescuePaymentsIntent(prompt, misclassifiedAction)?.action).toBe(
        'buy_gift_card_for_someone',
      );
    },
  );
});
