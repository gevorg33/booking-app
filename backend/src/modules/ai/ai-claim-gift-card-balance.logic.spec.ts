import { handleClaimGiftCardBalanceLogic } from './ai-claim-gift-card-balance.logic.js';

function buildDeps(claimByCode: jest.Mock) {
  return {
    giftCardClaimService: { claimByCode },
  };
}

describe('ai-claim-gift-card-balance.logic', () => {
  it('requires sign-in before claiming', async () => {
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(jest.fn()),
      'biz-1',
      {},
      'Redeem gift card code GCM-ABCD1234',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('claim_gift_card_balance');
    expect(result.details?.navigate).toEqual({
      path: 'login',
      query: { reason: 'claim_gift_card', giftCardCode: 'GCM-ABCD1234' },
    });
  });

  it('navigates to claim section when code is missing', async () => {
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(jest.fn()),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Add gift card to account',
    );
    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'gift-card-claim' },
    });
    expect(result.details?.missing).toEqual(['giftCardCode']);
  });

  it('claims gift card when signed in with code', async () => {
    const claimByCode = jest.fn().mockResolvedValue({
      giftCardId: 'gc-1',
      cardType: 'package',
      packagePurchaseId: 'pp-1',
    });
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(claimByCode),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Redeem gift card code GCM-ABCD1234',
    );
    expect(result.success).toBe(true);
    expect(claimByCode).toHaveBeenCalledWith('biz-1', 'GCM-ABCD1234', 'cust-1');
    expect(result.details?.claim).toEqual(
      expect.objectContaining({ cardType: 'package' }),
    );
  });

  it('rejects unrelated prompts', async () => {
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(jest.fn()),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('rejects empty prompt without params', async () => {
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(jest.fn()),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      '',
    );
    expect(result.success).toBe(false);
  });

  it('returns checkout guidance for monetary cards', async () => {
    const claimByCode = jest
      .fn()
      .mockRejectedValue(
        new Error('Monetary gift cards are redeemed at booking checkout'),
      );
    const result = await handleClaimGiftCardBalanceLogic(
      buildDeps(claimByCode),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Redeem gift card code GCM-MONEY1',
    );
    expect(result.success).toBe(false);
    expect(result.details?.monetaryCheckout).toBe(true);
  });
});
