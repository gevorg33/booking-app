import {
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  isApplyGiftCardCodePrompt,
  isBuyGiftCardPrompt,
  isCheckGiftCardBalancePrompt,
  extractGiftCardCodeFromPrompt as extractPaymentsGiftCardCode,
} from './ai-payments.util.js';
import {
  BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS,
  BOOK_WITH_GIFT_CARD_PROMPTS,
  type BookWithGiftCardPromptFixture,
} from './ai-book-with-gift-card.fixtures.js';
import { isExplainPublicBookingCheckoutPrompt } from './ai-explain-public-booking-checkout.util.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS } from './ai-book-with-gift-card-multilingual.fixtures.js';
import { isGiftCardCheckoutCompoundPrompt as isGiftCardCheckApplyBookCompoundPrompt } from './ai-gift-card-checkout-compound.util.js';
import { isGiftCardCheckoutCompoundPrompt } from './ai-gift-card-payments-hints.util.js';

const HY_RU_BOOK_GIFT_CARD_CUE =
  /amragrel.{0,20}gift card|gift card.{0,20}(ov|ով)|օգտագործ.{0,20}(նվեր|gift)|зabron.{0,20}подар|оплат.{0,20}подар|запис.{0,20}подар/iu;

function matchBookWithGiftCardScenario(
  prompt: string,
): BookWithGiftCardPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BOOK_WITH_GIFT_CARD_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractBookWithGiftCardCode(
  prompt: string,
): string | undefined {
  const scenario = matchBookWithGiftCardScenario(prompt);
  if (scenario?.giftCardCode) return scenario.giftCardCode;
  return extractPaymentsGiftCardCode(prompt) ?? undefined;
}

export function isBookWithGiftCardBudgetMisroute(prompt: string): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  return extractMaxPriceFromBudgetPrompt(prompt) != null;
}

export function isBookWithGiftCardPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchBookWithGiftCardScenario(text)) return true;
  if (isExplainPublicBookingCheckoutPrompt(text)) return false;
  if (isBookWithGiftCardBudgetMisroute(text)) return false;
  if (isBuyGiftCardPrompt(text)) return false;
  if (isCheckGiftCardBalancePrompt(text)) return false;
  if (isGiftCardCheckoutCompoundPrompt(text)) return false;
  if (isGiftCardCheckApplyBookCompoundPrompt(text)) return false;
  if (
    /\b(add|link|claim|register|attach|activate|redeem)\b/i.test(text) &&
    /\b(gift\s*card)\b/i.test(text) &&
    /\b(account|my account|to my account|on my account)\b/i.test(text) &&
    !/\b(book|reserve|schedule|checkout|visit|appointment)\b/i.test(text)
  ) {
    return false;
  }
  if (
    isApplyGiftCardCodePrompt(text) &&
    !/\b(book|reserve|schedule)\b/i.test(text)
  ) {
    return false;
  }
  if (HY_RU_BOOK_GIFT_CARD_CUE.test(text)) return true;
  const wantsGiftCard =
    /\b(gift\s*card)\b/i.test(text) ||
    /(gift card|подарочн|подарок|նվer\s*քart|gift\s*card)/i.test(text);
  const wantsBookPayment =
    /\b(book|reserve|schedule|checkout|pay|use)\b/i.test(text) ||
    /(amragrel|amragrum|grancvel|ամրագր)/i.test(text) ||
    /(зabron|запис|бронир|оплат)/i.test(text);
  if (!wantsGiftCard || !wantsBookPayment) return false;
  if (/\b(buy|purchase|order|balance|apply\s+code)\b/i.test(text)) {
    return false;
  }
  if (
    /\bapply\b/i.test(text) &&
    /\b(checkout|code|GCM-|GCB-|GCS-)\b/i.test(text) &&
    !/\b(book|reserve|schedule)\b/i.test(text)
  ) {
    return false;
  }
  return true;
}

export function isBookWithGiftCardCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS.some(
      (row) => row.prompt.toLowerCase() === text.toLowerCase(),
    )
  ) {
    return true;
  }
  if (!isBookWithGiftCardPrompt(text)) return false;
  if (!/\b(and|then|;\s*)\b/i.test(text)) return false;
  return (
    (/\b(book|reserve|schedule)\b/i.test(text) &&
      /\b(package|nearest|slot|massage|facial|service|appointment)\b/i.test(
        text,
      )) ||
    /\bbook\s+nearest\b/i.test(text)
  );
}

export function decomposeBookWithGiftCardCompoundPrompt(
  prompt: string,
): Array<{ action: string; params: Record<string, unknown>; segment: string }> {
  const text = prompt.trim();
  if (!isBookWithGiftCardCompoundPrompt(text)) return [];

  const params = enrichBookWithGiftCardParamsFromPrompt({}, text);
  const bookPackage = /\bpackage\b/i.test(text) || /\bspa\s+day\b/i.test(text);
  const bookNearest =
    /\b(nearest|soonest|first\s+available)\b/i.test(text) ||
    /\bbook\s+nearest\b/i.test(text);

  const firstAction = bookPackage
    ? 'book_package'
    : bookNearest
      ? 'book_nearest_slot'
      : 'book_nearest_slot';

  return [
    { action: firstAction, params: { ...params }, segment: text },
    {
      action: 'book_with_gift_card',
      params: { ...params },
      segment: text,
    },
  ];
}

export function enrichBookWithGiftCardParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const code =
    (typeof params.giftCardCode === 'string' && params.giftCardCode.trim()) ||
    extractBookWithGiftCardCode(prompt);
  if (code) next.giftCardCode = code;
  next.paymentMethod = 'gift_card';
  return next;
}

export function buildBookWithGiftCardSummary(code?: string): string {
  if (code) {
    return `Gift card ${code} will be applied at checkout.`;
  }
  return 'Gift card payment selected — provide your gift card code at checkout.';
}

export function rescueBookWithGiftCardIntent(
  prompt: string,
  action: string,
): {
  action: 'book_with_gift_card';
  rescueReason: string;
} | null {
  if (action === 'book_with_gift_card') return null;
  if (!isBookWithGiftCardPrompt(prompt)) return null;
  return {
    action: 'book_with_gift_card',
    rescueReason: 'book_gift_card',
  };
}
