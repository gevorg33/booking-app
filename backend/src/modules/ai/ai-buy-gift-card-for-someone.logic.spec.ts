import { BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS } from './ai-buy-gift-card-for-someone.fixtures.js';
import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import { handleBuyGiftCardForSomeoneLogic } from './ai-buy-gift-card-for-someone.logic.js';

describe('ai-buy-gift-card-for-someone.logic (ai-cmd-customer-4.16.4)', () => {
  const giftCardPurchaseService = {
    getPublicCatalog: jest.fn(async () => ({
      purchaseEnabled: true,
      settings: { presetAmounts: [50, 100], digitalDeliveryEnabled: true },
    })),
  };

  const deps = { giftCardPurchaseService } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS)(
    'handles prompt $id',
    async ({ prompt }) => {
      const result = await handleBuyGiftCardForSomeoneLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('buy_gift_card_for_someone');
      expect(result.details?.navigate).toBeDefined();
      expect(result.details?.buyAsGift).toBe(true);
    },
  );

  it('navigates to checkout when amount is known', async () => {
    const result = await handleBuyGiftCardForSomeoneLogic(
      deps,
      'biz-1',
      {},
      'Buy a $100 gift card for my mom',
    );
    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'gift-cards/checkout',
      query: expect.objectContaining({
        amount: '100',
        buyAsGift: '1',
        recipientName: 'Mom',
        deliveryMethod: 'digital',
      }),
    });
  });

  it('navigates to catalog when amount is missing', async () => {
    const result = await handleBuyGiftCardForSomeoneLogic(
      deps,
      'biz-1',
      {},
      'Email a digital gift card',
    );
    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'gift-cards',
      query: expect.objectContaining({
        buyAsGift: '1',
        deliveryMethod: 'digital',
      }),
    });
  });

  it('fails when purchase is disabled', async () => {
    giftCardPurchaseService.getPublicCatalog.mockResolvedValueOnce({
      purchaseEnabled: false,
      settings: null,
    });
    const result = await handleBuyGiftCardForSomeoneLogic(
      deps,
      'biz-1',
      {},
      'Buy a gift card for my friend',
    );
    expect(result.success).toBe(false);
  });

  it.each(BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS)(
    'handles multilingual prompt $id',
    async ({ prompt }) => {
      const result = await handleBuyGiftCardForSomeoneLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );
});
