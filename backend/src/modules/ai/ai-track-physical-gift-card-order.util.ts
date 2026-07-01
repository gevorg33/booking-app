import { extractGiftCardIdFromPrompt } from './ai-integrations.util.js';
import { isBuyGiftCardPhysicalPrompt } from './ai-payments.util.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS } from './ai-track-physical-gift-card-order-multilingual.fixtures.js';
import {
  TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS,
  type TrackPhysicalGiftCardOrderPromptFixture,
} from './ai-track-physical-gift-card-order.fixtures.js';

export {
  CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS,
} from './ai-track-physical-gift-card-order.fixtures.js';

const HY_RU_TRACK_PHYSICAL_GIFT_CARD_CUE =
  /որտեղ|gift card.{0,20}(պատվ|կargavijak|առաք)|где|статус.{0,20}(подар|gift card)|отправлен/i;

function matchTrackPhysicalGiftCardOrderScenario(
  prompt: string,
): TrackPhysicalGiftCardOrderPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function isMyGiftCardsListOnlyPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(gift\s*cards?|orders?)\b/i.test(prompt) &&
    !/\b(balance|redemption|track|cancel|modify|where|status|shipping|delivery)\b/i.test(
      prompt,
    )
  );
}

function isRequestGiftCardCancelLikePrompt(prompt: string): boolean {
  return (
    /\b(cancel|refund|return|undo|void)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt) &&
    (/\bmy\b/i.test(prompt) || /\brequest\b/i.test(prompt))
  );
}

function isRequestGiftCardModifyLikePrompt(prompt: string): boolean {
  return (
    /\b(change|modify|update|edit)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt) &&
    (/\bmy\b/i.test(prompt) || /\brequest\b/i.test(prompt))
  );
}

function isDiscoverGiftCardProductsLikePrompt(prompt: string): boolean {
  return (
    /\b(what|which|discover|list|show|available|can\s+i\s+buy)\b/i.test(
      prompt,
    ) &&
    /\b(gift\s*cards?|gift\s+card\s+products?)\b/i.test(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !/\b(track|where|status|shipping|delivery)\b/i.test(prompt)
  );
}

export function isTrackPhysicalGiftCardOrderCustomerPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchTrackPhysicalGiftCardOrderScenario(text)) return true;
  if (isRequestGiftCardCancelLikePrompt(text)) return false;
  if (isRequestGiftCardModifyLikePrompt(text)) return false;
  if (isDiscoverGiftCardProductsLikePrompt(text)) return false;
  if (isMyGiftCardsListOnlyPrompt(text)) return false;

  const trackingCue =
    /\b(track|where|status|shipment|shipping|delivery|arrive|shipped|ship)\b/i.test(
      text,
    ) ||
    /\b(when\s+will|has\s+it|out\s+for\s+delivery|check\s+delivery)\b/i.test(
      text,
    );
  const targetCue =
    /\b(gift\s*card|physical\s+gift|mailed\s+gift|gift\s+card\s+order)\b/i.test(
      text,
    ) ||
    (/\bphysical\b/i.test(text) && /\border\b/i.test(text)) ||
    (/\b(track|where|status|shipping|delivery)\b/i.test(text) &&
      /\b(my\s+order|the\s+order)\b/i.test(text));

  if (!trackingCue || !targetCue) {
    if (HY_RU_TRACK_PHYSICAL_GIFT_CARD_CUE.test(text)) return true;
    return false;
  }

  if (
    isBuyGiftCardPhysicalPrompt(text) &&
    !/\b(track|where|status|shipping|delivery|arrive|shipped)\b/i.test(text)
  ) {
    return false;
  }

  return true;
}

export function rescueTrackPhysicalGiftCardOrderIntent(
  prompt: string,
  action: string,
): {
  action: 'track_physical_gift_card_order';
  rescueReason: string;
} | null {
  if (action === 'track_physical_gift_card_order') return null;
  if (!isTrackPhysicalGiftCardOrderCustomerPrompt(prompt)) return null;
  return {
    action: 'track_physical_gift_card_order',
    rescueReason: 'track_gift_card',
  };
}

export function detectTrackPhysicalGiftCardOrderAction(
  prompt: string,
): 'track_physical_gift_card_order' | null {
  return isTrackPhysicalGiftCardOrderCustomerPrompt(prompt)
    ? 'track_physical_gift_card_order'
    : null;
}

export function enrichTrackPhysicalGiftCardOrderParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const scenario = matchTrackPhysicalGiftCardOrderScenario(prompt);
  const giftCardId =
    (typeof params.giftCardId === 'string' && params.giftCardId.trim()) ||
    scenario?.giftCardOrderId ||
    extractGiftCardIdFromPrompt(prompt);
  if (giftCardId) {
    next.giftCardId = giftCardId;
  }
  return next;
}
