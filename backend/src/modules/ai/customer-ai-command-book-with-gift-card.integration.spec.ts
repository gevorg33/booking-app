import {
  BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS,
  BOOK_WITH_GIFT_CARD_PROMPTS,
  BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS,
} from './ai-book-with-gift-card.fixtures.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS } from './ai-book-with-gift-card-multilingual.fixtures.js';
import { decomposeBookWithGiftCardCompoundPrompt } from './ai-book-with-gift-card.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer-ai-command book_with_gift_card integration (ai-cmd-customer-4.6.3)', () => {
  it.each(BOOK_WITH_GIFT_CARD_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues book_with_gift_card for $id',
    (_id, row) => {
      expect(
        rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action,
      ).toBe('book_with_gift_card');
    },
  );

  it.each(
    BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual book_with_gift_card for $id', (_id, row) => {
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      'book_with_gift_card',
    );
  });

  it.each(
    BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues misclassified book_with_gift_card for $id', (_id, row) => {
    expect(
      rescueSelfServiceBookingIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('book_with_gift_card');
  });

  it.each(
    BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS.map((row) => [row.id, row] as const),
  )('decomposes compound book_with_gift_card for $id', (_id, row) => {
    const steps = decomposeBookWithGiftCardCompoundPrompt(row.prompt);
    expect(steps.map((step) => step.action)).toEqual([...row.orderedActions]);
  });
});
