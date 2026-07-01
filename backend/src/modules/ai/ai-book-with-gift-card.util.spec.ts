import {
  BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS,
  BOOK_WITH_GIFT_CARD_PROMPTS,
  BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS,
  CUSTOMER_BOOK_WITH_GIFT_CARD_CLASSIFIER_RULES,
} from './ai-book-with-gift-card.fixtures.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS } from './ai-book-with-gift-card-multilingual.fixtures.js';
import {
  buildBookWithGiftCardSummary,
  decomposeBookWithGiftCardCompoundPrompt,
  enrichBookWithGiftCardParamsFromPrompt,
  extractBookWithGiftCardCode,
  isBookWithGiftCardBudgetMisroute,
  isBookWithGiftCardCompoundPrompt,
  isBookWithGiftCardPrompt,
  rescueBookWithGiftCardIntent,
} from './ai-book-with-gift-card.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_BOOK_WITH_GIFT_CARD_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-book-with-gift-card.util (ai-cmd-customer-4.6.3)', () => {
  it('exports classifier rules for book_with_gift_card', () => {
    expect(CUSTOMER_BOOK_WITH_GIFT_CARD_CLASSIFIER_RULES).toContain(
      'book_with_gift_card',
    );
  });

  it.each(BOOK_WITH_GIFT_CARD_PROMPTS.map((row) => [row.id, row] as const))(
    'detects book_with_gift_card for $id',
    (_id, row) => {
      expect(isBookWithGiftCardPrompt(row.prompt)).toBe(true);
      expect(rescueBookWithGiftCardIntent(row.prompt, 'unknown')?.action).toBe(
        'book_with_gift_card',
      );
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('book_with_gift_card');
      if (row.giftCardCode) {
        expect(extractBookWithGiftCardCode(row.prompt)).toBe(row.giftCardCode);
      }
    },
  );

  it.each(
    BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual book_with_gift_card for $id', (_id, row) => {
    expect(isBookWithGiftCardPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('book_with_gift_card');
  });

  it.each(
    BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS.map((row) => [row.id, row] as const),
  )('decomposes compound book_with_gift_card for $id', (_id, row) => {
    expect(isBookWithGiftCardCompoundPrompt(row.prompt)).toBe(true);
    const steps = decomposeBookWithGiftCardCompoundPrompt(row.prompt);
    expect(steps.map((step) => step.action)).toEqual([...row.orderedActions]);
    expect(steps[1]?.params.giftCardCode).toBe(row.giftCardCode);
  });

  it('rejects empty, buy, balance, apply-code, and budget prompts', () => {
    expect(isBookWithGiftCardPrompt('')).toBe(false);
    expect(isBookWithGiftCardPrompt('Buy a gift card')).toBe(false);
    expect(isBookWithGiftCardPrompt('Check gift card balance GCM-123')).toBe(
      false,
    );
    expect(
      isBookWithGiftCardPrompt('Apply gift card code GCM-123 at checkout'),
    ).toBe(false);
    expect(
      isBookWithGiftCardPrompt('Book a massage under $50 with gift card'),
    ).toBe(false);
    expect(isBookWithGiftCardBudgetMisroute('Services under $40')).toBe(true);
  });

  it('enriches params with gift card code and payment method', () => {
    expect(
      enrichBookWithGiftCardParamsFromPrompt(
        {},
        'Book with gift card GCM-TEST9999',
      ),
    ).toEqual({
      giftCardCode: 'GCM-TEST9999',
      paymentMethod: 'gift_card',
    });
  });

  it('builds summary with and without code', () => {
    expect(buildBookWithGiftCardSummary('GCM-ABC')).toContain('GCM-ABC');
    expect(buildBookWithGiftCardSummary()).toContain('checkout');
  });

  it('registers eval golden cases for every fixture scenario', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_BOOK_WITH_GIFT_CARD_CASES.map((row) => row.id),
    );
    for (const row of BOOK_WITH_GIFT_CARD_PROMPTS) {
      expect(ids.has(`book-with-gift-card-${row.id}`)).toBe(true);
    }
    for (const row of BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS) {
      expect(ids.has(`book-with-gift-card-${row.id}`)).toBe(true);
    }
    for (const row of BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS) {
      expect(ids.has(`book-with-gift-card-rescue-${row.id}`)).toBe(true);
    }
    for (const row of BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS) {
      expect(ids.has(`book-with-gift-card-compound-${row.id}`)).toBe(true);
    }
  });
});
