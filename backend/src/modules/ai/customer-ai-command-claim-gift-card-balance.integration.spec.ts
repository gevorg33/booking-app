import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS } from './ai-claim-gift-card-balance-multilingual.fixtures.js';
import {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS,
} from './ai-claim-gift-card-balance.fixtures.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('customer-ai-command claim_gift_card_balance integration (ai-cmd-customer-4.20.6)', () => {
  it.each(
    [
      ...CLAIM_GIFT_CARD_BALANCE_PROMPTS,
      ...CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row] as const),
  )('rescues claim_gift_card_balance for $0', (_id, row) => {
    expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
      'claim_gift_card_balance',
    );
  });

  it.each(CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(rescueCustomerCrmIntent(prompt, misclassifiedAction)?.action).toBe(
        'claim_gift_card_balance',
      );
    },
  );
});
