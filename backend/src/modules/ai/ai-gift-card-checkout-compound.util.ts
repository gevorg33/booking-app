import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import {
  extractGiftCardCodeFromPrompt,
  extractServiceNameFromPrompt,
  isBookNearestSlotPrompt,
  isBuyGiftCardPhysicalPrompt,
  isBuyGiftCardPrompt,
  isCheckProvidersForServicePrompt,
  isChoosePaymentMethodPrompt,
  isPayCashAtVisitPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isGiftCardCheckoutCompoundPrompt as isLegacyBookApplyPayGiftCardPrompt } from './ai-gift-card-payments-hints.util.js';
import { ALL_GIFT_CARD_CHECKOUT_PROMPTS } from './ai-gift-card-payments.fixtures.js';
import {
  GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS,
  type GiftCardCheckoutCompoundFixture,
} from './ai-gift-card-checkout-compound.fixtures.js';
import { GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-gift-card-checkout-compound-multilingual.fixtures.js';

export const GIFT_CARD_CHECKOUT_RECIPE_ID = 'gift_card_checkout';

export const GIFT_CARD_CHECKOUT_STEP_ACTIONS = [
  'check_gift_card_balance',
  'apply_gift_card_code',
  'book_nearest_slot',
] as const;

export type GiftCardCheckoutCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchGiftCardCheckoutScenario(
  prompt: string,
): GiftCardCheckoutCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function matchesLegacyGiftCardBookApplyPayPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  for (const row of ALL_GIFT_CARD_CHECKOUT_PROMPTS) {
    if (row.prompt.trim().toLowerCase() === normalized) {
      return true;
    }
  }
  return (
    isLegacyBookApplyPayGiftCardPrompt(prompt) &&
    (isChoosePaymentMethodPrompt(prompt) ||
      isPayOnlinePrompt(prompt) ||
      isPayCashAtVisitPrompt(prompt) ||
      isCheckProvidersForServicePrompt(prompt))
  );
}

export function isBookFirstGiftCardCheckoutPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const bookIdx = lower.search(/\bbook\b/);
  if (bookIdx < 0) return false;
  const giftActionIdx = lower.search(
    /\b(?:use|apply|redeem|check|verify)\b[\s\S]{0,40}\bgift\s*card\b|\bgift\s*card\b[\s\S]{0,40}\b(?:use|apply|redeem|check|verify)\b/i,
  );
  if (giftActionIdx < 0) {
    return (
      /\bbook\b/i.test(prompt) &&
      /\bapply\b/i.test(prompt) &&
      /\bgift\s*card\b/i.test(prompt)
    );
  }
  return bookIdx < giftActionIdx;
}

export function hasGiftCardCheckoutBookCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  return (
    /\b(?:book|schedule|reserve|get)\b/i.test(prompt) &&
    /\b(?:nearest|soonest|next|earliest|first\s+available|asap|available\s+slot|opening)\b/i.test(
      prompt,
    )
  );
}

export function hasGiftCardCheckoutGiftCue(prompt: string): boolean {
  if (
    !/\bgift\s*card\b/i.test(prompt) &&
    !/\bGCM-|\bGCB-|\bGCS-/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(?:use|apply|redeem|check|verify|balance|what(?:'s| is)\s+on)\b/i.test(
      prompt,
    ) || extractGiftCardCodeFromPrompt(prompt) != null
  );
}

/**
 * e2e-bug.353 - renamed from `isGiftCardCheckoutCompoundPrompt`, which
 * `ai-gift-card-payments-hints.util.ts` also exported. Every call site that used
 * both already aliased this one to exactly this name, so the codebase had picked
 * the disambiguation years before the collision was filed; this makes it real.
 */
export function isGiftCardCheckApplyBookCompoundPrompt(
  prompt: string,
): boolean {
  if (matchGiftCardCheckoutScenario(prompt)) return true;
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (isBuyGiftCardPrompt(text) || isBuyGiftCardPhysicalPrompt(text)) {
    return false;
  }
  if (matchesLegacyGiftCardBookApplyPayPrompt(text)) return false;
  if (isBookFirstGiftCardCheckoutPrompt(text)) return false;
  if (!extractGiftCardCodeFromPrompt(text)) return false;
  if (!hasGiftCardCheckoutBookCue(text)) return false;
  if (!hasGiftCardCheckoutGiftCue(text)) return false;
  return true;
}

export function extractBookSegmentFromGiftCardCheckoutPrompt(
  prompt: string,
): string {
  const bookPart = prompt.match(
    /\b(?:book|schedule|reserve|get)\b[\s\S]*$/i,
  )?.[0];
  return bookPart?.trim() || prompt;
}

export function buildGiftCardCheckoutCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const bookSegment = extractBookSegmentFromGiftCardCheckoutPrompt(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    bookingFirstAvailable: true,
  };
  const giftCardCode = extractGiftCardCodeFromPrompt(prompt);
  if (giftCardCode) params.giftCardCode = giftCardCode;
  const knownService = bookSegment.match(
    /\b(massage|haircut|facial|color|manicure|blowdry)\b/i,
  )?.[1];
  const serviceName =
    knownService || extractServiceNameFromPrompt(bookSegment) || undefined;
  if (serviceName) params.serviceName = serviceName;
  enrichBookingTimeHintsFromPrompt('book_nearest_slot', params, prompt);
  return params;
}

export function decomposeGiftCardCheckoutCompoundPrompt(
  prompt: string,
): GiftCardCheckoutCompoundStep[] {
  if (!isGiftCardCheckApplyBookCompoundPrompt(prompt)) return [];

  const base = buildGiftCardCheckoutCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'check_gift_card_balance',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'apply_gift_card_code',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'book_nearest_slot',
      params: { ...base, bookingFirstAvailable: true },
      segment: prompt,
    },
  ]);
}

export function rescueGiftCardCheckoutCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isGiftCardCheckApplyBookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'gift_card_checkout_compound',
  };
}
