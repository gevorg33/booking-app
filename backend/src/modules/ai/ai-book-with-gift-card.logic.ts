import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  buildBookWithGiftCardSummary,
  enrichBookWithGiftCardParamsFromPrompt,
  extractBookWithGiftCardCode,
  isBookWithGiftCardPrompt,
} from './ai-book-with-gift-card.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleBookWithGiftCardLogic(
  _deps: SelfServiceBookingLogicDeps,
  _businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichBookWithGiftCardParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  const code =
    (typeof enriched.giftCardCode === 'string' &&
      enriched.giftCardCode.trim()) ||
    extractBookWithGiftCardCode(textPrompt);

  if (!code && textPrompt && !isBookWithGiftCardPrompt(textPrompt)) {
    return failure(
      'book_with_gift_card',
      'Say you want to book or pay with a gift card.',
      { clarify: true },
    );
  }

  if (!code) {
    return failure(
      'book_with_gift_card',
      'Provide your gift card code to pay with it.',
      {
        clarify: true,
        missing: ['giftCardCode'],
        paymentMethod: 'gift_card',
        navigate: { path: 'checkout', query: { payment: 'gift_card' } },
      },
    );
  }

  return success('book_with_gift_card', buildBookWithGiftCardSummary(code), {
    giftCardCode: code,
    paymentMethod: 'gift_card',
    sessionContext: { giftCardCode: code, paymentMethod: 'gift_card' },
    navigate: {
      path: 'checkout',
      query: { giftCard: code, payment: 'gift_card' },
    },
  });
}
