import { handleBookWithGiftCardLogic } from './ai-book-with-gift-card.logic.js';
import { BOOK_WITH_GIFT_CARD_PROMPTS } from './ai-book-with-gift-card.fixtures.js';

describe('ai-book-with-gift-card.logic (ai-cmd-customer-4.6.3)', () => {
  const deps = {} as any;

  it('clarifies when gift card code is missing', async () => {
    const result = await handleBookWithGiftCardLogic(
      deps,
      'biz-1',
      {},
      'Use my gift card for this booking',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('book_with_gift_card');
    expect(result.details?.missing).toEqual(['giftCardCode']);
    expect(result.details?.clarify).toBe(true);
  });

  it('accepts explicit gift card code from classifier params', async () => {
    const result = await handleBookWithGiftCardLogic(deps, 'biz-1', {
      giftCardCode: 'GIFT1',
    });

    expect(result.success).toBe(true);
    expect(result.details?.giftCardCode).toBe('GIFT1');
    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: { giftCard: 'GIFT1', payment: 'gift_card' },
    });
  });

  it.each(
    BOOK_WITH_GIFT_CARD_PROMPTS.filter((row) => row.giftCardCode).map(
      (row) => [row.id, row] as const,
    ),
  )('applies gift card code from prompt for $id', async (_id, row) => {
    const result = await handleBookWithGiftCardLogic(
      deps,
      'biz-1',
      { _prompt: row.prompt },
      row.prompt,
    );

    expect(result.success).toBe(true);
    expect(result.details?.giftCardCode).toBe(row.giftCardCode);
  });

  it('rejects unrelated prompts without a code', async () => {
    const result = await handleBookWithGiftCardLogic(
      deps,
      'biz-1',
      { _prompt: 'Buy a gift card' },
      'Buy a gift card',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
