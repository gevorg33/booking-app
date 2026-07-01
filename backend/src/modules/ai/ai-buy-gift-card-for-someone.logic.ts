import type { CommandResult } from './command-completion.types.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';
import {
  buildBuyGiftCardForSomeoneSummary,
  enrichBuyGiftCardForSomeoneParamsFromPrompt,
  isBuyGiftCardForSomeonePrompt,
  parseBuyGiftCardForSomeoneFromPrompt,
} from './ai-buy-gift-card-for-someone.util.js';

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

export async function handleBuyGiftCardForSomeoneLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichBuyGiftCardForSomeoneParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isBuyGiftCardForSomeonePrompt(textPrompt)) {
    return failure(
      'buy_gift_card_for_someone',
      'Say something like "Buy a $100 gift card for my mom" or "Email a digital gift card".',
      { clarify: true },
    );
  }

  const parsed = parseBuyGiftCardForSomeoneFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'buy_gift_card_for_someone',
      'Say who the gift card is for, for example "Buy a gift card for my friend".',
      { clarify: true },
    );
  }

  const catalog =
    await deps.giftCardPurchaseService.getPublicCatalog(businessId);
  if (!catalog.purchaseEnabled) {
    return failure(
      'buy_gift_card_for_someone',
      'Gift card purchase is not enabled for this business.',
    );
  }

  const explicitAmount = parsed.amount;
  const checkoutPath =
    explicitAmount != null
      ? ('gift-cards/checkout' as const)
      : ('gift-cards' as const);
  const query: Record<string, string> = {
    cardType: 'monetary',
    buyAsGift: '1',
    deliveryMethod: parsed.deliveryMethod ?? 'digital',
  };
  if (explicitAmount != null) query.amount = String(explicitAmount);
  if (parsed.recipientName) query.recipientName = parsed.recipientName;
  if (parsed.recipientEmail) query.recipientEmail = parsed.recipientEmail;

  return success(
    'buy_gift_card_for_someone',
    buildBuyGiftCardForSomeoneSummary({
      ...parsed,
      amount: explicitAmount,
      checkoutPath,
    }),
    {
      amount: explicitAmount ?? null,
      recipientName: parsed.recipientName ?? null,
      recipientEmail: parsed.recipientEmail ?? null,
      deliveryMethod: parsed.deliveryMethod ?? 'digital',
      buyAsGift: true,
      navigate: { path: checkoutPath, query },
    },
  );
}
