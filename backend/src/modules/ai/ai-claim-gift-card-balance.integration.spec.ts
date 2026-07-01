import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS } from './ai-claim-gift-card-balance-multilingual.fixtures.js';
import {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS,
} from './ai-claim-gift-card-balance.fixtures.js';
import { handleClaimGiftCardBalanceLogic } from './ai-claim-gift-card-balance.logic.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('ai-claim-gift-card-balance integration (ai-cmd-customer-4.20.6)', () => {
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

  it('handler claims code for signed-in customer', async () => {
    const claimByCode = jest.fn().mockResolvedValue({
      giftCardId: 'gc-1',
      cardType: 'service',
    });
    const result = await handleClaimGiftCardBalanceLogic(
      { giftCardClaimService: { claimByCode } },
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Claim gift card GCB-SPECIAL123',
    );
    expect(result.success).toBe(true);
    expect(result.details?.navigate?.path).toBe('account');
  });
});
