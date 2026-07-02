import {
  BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
  BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS,
} from './ai-buy-gift-card-for-someone.fixtures.js';
import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import { isBookWithGiftCardPrompt } from './ai-book-with-gift-card.util.js';
import { isBuyGiftCardPrompt } from './ai-payments.util.js';
import {
  enrichBuyGiftCardForSomeoneParamsFromPrompt,
  isBuyGiftCardForSomeonePrompt,
  parseBuyGiftCardForSomeoneFromPrompt,
  rescueBuyGiftCardForSomeoneIntent,
} from './ai-buy-gift-card-for-someone.util.js';

describe('ai-buy-gift-card-for-someone.util (ai-cmd-customer-4.16.4)', () => {
  it.each(BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS)(
    'detects buy gift card for someone prompt $id',
    ({ prompt }) => {
      expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(true);
      expect(parseBuyGiftCardForSomeoneFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual buy gift card for someone prompt $id',
    ({ prompt }) => {
      expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(true);
    },
  );

  it.each(BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS)(
    'rescues $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueBuyGiftCardForSomeoneIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'buy_gift_card_for_someone',
        rescueReason: 'gift_card_for_someone',
      });
    },
  );

  it('does not steal book_with_gift_card prompts', () => {
    const prompt = 'Book with gift card GCM-TEST1234';
    expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(false);
    expect(isBookWithGiftCardPrompt(prompt)).toBe(true);
  });

  it('does not steal self buy_gift_card prompts', () => {
    const prompt = 'Buy a $50 gift card';
    expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(false);
    expect(isBuyGiftCardPrompt(prompt)).toBe(true);
  });

  it('enriches recipient and amount from prompt', () => {
    expect(
      enrichBuyGiftCardForSomeoneParamsFromPrompt(
        {},
        'Buy a $100 gift card for my mom',
      ),
    ).toMatchObject({
      buyAsGift: true,
      amount: 100,
      recipientName: 'Mom',
      deliveryMethod: 'digital',
    });
  });
});
