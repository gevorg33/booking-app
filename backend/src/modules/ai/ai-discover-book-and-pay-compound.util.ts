import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import {
  isBookNearestSlotPrompt,
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  enrichServiceRankFromPrompt,
  isServiceCatalogRankPrompt,
} from './ai-service-rank-discovery.util.js';
import { hasAvailabilityOrPattern } from './ai-flexible-availability.util.js';
import { isBookWithGiftCardCompoundPrompt } from './ai-book-with-gift-card.util.js';
import { isGiftCardCheckoutCompoundPrompt } from './ai-gift-card-payments-hints.util.js';
import { isGiftCardCheckApplyBookCompoundPrompt } from './ai-gift-card-checkout-compound.util.js';
import { isBudgetDiscoverAndBookCompoundPrompt } from './ai-budget-discover-and-book-compound.util.js';
import {
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS,
  type DiscoverBookAndPayCompoundFixture,
} from './ai-discover-book-and-pay-compound.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-discover-book-and-pay-compound-multilingual.fixtures.js';

export const DISCOVER_BOOK_AND_PAY_RECIPE_ID = 'discover_book_and_pay';
export const PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID =
  'public_discover_book_and_pay';

export const DISCOVER_BOOK_AND_PAY_STEP_ACTIONS = [
  'list_services',
  'check_providers_for_service',
  'book_nearest_slot',
  'pay_online',
] as const;

export const PUBLIC_DISCOVER_BOOK_AND_PAY_STEP_ACTIONS = [
  'list_services',
  'check_availability',
  'book_appointment',
  'pay_online',
] as const;

export type DiscoverBookAndPayPaymentAction =
  | 'pay_online'
  | 'choose_payment_method';

export type DiscoverBookAndPayCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchDiscoverBookAndPayScenario(
  prompt: string,
): DiscoverBookAndPayCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function hasDiscoverBookAndPayBookCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  if (
    /\b(?:book|schedule|reserve|get)\b/i.test(prompt) &&
    /\b(?:nearest|soonest|first\s+available|earliest|tomorrow|today|slot|appointment|opening|asap)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\b(?:check|who(?:'s| is)|availability|free)\b/i.test(prompt) &&
    /\b(?:book|reserve|schedule)\b/i.test(prompt)
  );
}

function hasDiscoverBookAndPayDiscoverCue(prompt: string): boolean {
  if (isServiceCatalogRankPrompt(prompt)) return true;
  if (shouldExtractBudgetMaxPrice(prompt)) {
    if (extractMaxPriceFromBudgetPrompt(prompt) != null) return true;
  }
  return (
    /\b(?:show|list|find|filter|affordable|options)\b/i.test(prompt) &&
    /\b(?:under|below|at most|\$[\d]+)\b/i.test(prompt)
  );
}

export function hasDiscoverBookAndPayPaymentCue(prompt: string): boolean {
  if (isPayOnlinePrompt(prompt)) return true;
  if (isChoosePaymentMethodPrompt(prompt)) return true;
  if (
    isAskPaymentOptionsPrompt(prompt) &&
    /\b(?:book|schedule|under|cheapest|affordable|nearest|soonest)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:and|then|;\s*)\s*pay\b/i.test(prompt) &&
    /\b(?:online|card|stripe|checkout|payment)\b/i.test(prompt)
  ) {
    return true;
  }
  if (isBookWithGiftCardCompoundPrompt(prompt)) return false;
  if (isGiftCardCheckoutCompoundPrompt(prompt)) return false;
  if (isGiftCardCheckApplyBookCompoundPrompt(prompt)) return false;
  if (
    /\bgift\s*card\b/i.test(prompt) &&
    /\b(?:pay|use|apply)\b/i.test(prompt)
  ) {
    return false;
  }
  return false;
}

export function isDiscoverBookAndPayCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (matchDiscoverBookAndPayScenario(text)) return true;
  if (text.length < 24) return false;
  if (
    isBudgetDiscoverAndBookCompoundPrompt(text) &&
    !hasDiscoverBookAndPayPaymentCue(text)
  ) {
    return false;
  }
  if (hasAvailabilityOrPattern(text)) return false;
  if (!hasDiscoverBookAndPayDiscoverCue(text)) return false;
  if (!hasDiscoverBookAndPayBookCue(text)) return false;
  if (!hasDiscoverBookAndPayPaymentCue(text)) return false;
  return true;
}

export function resolveDiscoverBookAndPayPaymentAction(
  prompt: string,
): DiscoverBookAndPayPaymentAction {
  const scenario = matchDiscoverBookAndPayScenario(prompt);
  if (scenario?.paymentAction) return scenario.paymentAction;
  if (isPayOnlinePrompt(prompt)) return 'pay_online';
  if (isChoosePaymentMethodPrompt(prompt)) return 'choose_payment_method';
  if (
    isAskPaymentOptionsPrompt(prompt) &&
    /\b(?:choose|select|what|which|payment\s+options?)\b/i.test(prompt)
  ) {
    return 'choose_payment_method';
  }
  return 'pay_online';
}

const DISCOVER_BOOK_CATEGORY_SINGULAR: Record<string, string> = {
  facials: 'facial',
  lashes: 'lash',
  manicures: 'manicure',
};

function normalizeDiscoverBookServiceCategory(raw: string): string {
  const key = raw.toLowerCase();
  return DISCOVER_BOOK_CATEGORY_SINGULAR[key] ?? raw;
}

const DISCOVER_BOOK_CATEGORY_BLOCKLIST = new Set([
  'the',
  'a',
  'an',
  'your',
  'it',
  'soonest',
  'nearest',
  'earliest',
]);

function extractDiscoverBookAndPayServiceCategory(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.serviceCategory || params.serviceName) return params;

  const showMatch = prompt.match(
    /\b(?:show|list|find|book)\s+(?:(?:cheapest|most\s+affordable|premium|luxury|deluxe|affordable)\s+)?([a-z][\w-]{2,30})(?=\s*(?:under|below|options|services|,|$))/i,
  );
  const showKeyword = showMatch?.[1]?.trim().replace(/[,.]$/, '');
  if (
    showKeyword &&
    showKeyword.length >= 3 &&
    !DISCOVER_BOOK_CATEGORY_BLOCKLIST.has(showKeyword.toLowerCase())
  ) {
    return {
      ...params,
      serviceCategory: normalizeDiscoverBookServiceCategory(showKeyword),
    };
  }

  const bookMatch = prompt.match(
    /\bbook(?:\s+(?:a|an|the|your))?\s+(?:(?:cheapest|most\s+affordable|premium|luxury|deluxe|affordable)\s+)?([a-z][\w-]{2,30})(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|,|$))/i,
  );
  const keyword = bookMatch?.[1]?.trim().replace(/[,.]$/, '');
  if (
    keyword &&
    keyword.length >= 3 &&
    !DISCOVER_BOOK_CATEGORY_BLOCKLIST.has(keyword.toLowerCase())
  ) {
    return {
      ...params,
      serviceCategory: normalizeDiscoverBookServiceCategory(keyword),
    };
  }
  return params;
}

export function buildDiscoverBookAndPayCompoundParams(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): Record<string, unknown> {
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const params = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...enrichBudgetFromPrompt({}, prompt),
    ...enrichServiceRankFromPrompt({}, prompt),
    allProviders: true,
    bookingFirstAvailable: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, params, prompt);
  const enriched = enrichListServicesParamsFromPrompt(
    prompt,
    params as Parameters<typeof enrichListServicesParamsFromPrompt>[1],
  );
  return extractDiscoverBookAndPayServiceCategory(prompt, enriched);
}

export function decomposePublicDiscoverBookAndPayCompoundPrompt(
  prompt: string,
): DiscoverBookAndPayCompoundStep[] {
  return decomposeDiscoverBookAndPayCompoundPrompt(prompt, 'public');
}

export function decomposeCustomerDiscoverBookAndPayCompoundPrompt(
  prompt: string,
): DiscoverBookAndPayCompoundStep[] {
  return decomposeDiscoverBookAndPayCompoundPrompt(prompt, 'customer');
}

export function decomposeDiscoverBookAndPayCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DiscoverBookAndPayCompoundStep[] {
  if (!isDiscoverBookAndPayCompoundPrompt(prompt)) return [];

  const base = buildDiscoverBookAndPayCompoundParams(prompt, surface);
  const checkAction =
    surface === 'public' ? 'check_availability' : 'check_providers_for_service';
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const paymentAction = resolveDiscoverBookAndPayPaymentAction(prompt);

  return propagateSharedBookingContextAcrossSteps([
    { action: 'list_services', params: { ...base }, segment: prompt },
    { action: checkAction, params: { ...base }, segment: prompt },
    {
      action: bookAction,
      params: { ...base, bookingFirstAvailable: true },
      segment: prompt,
    },
    {
      action: paymentAction,
      params: {
        ...base,
        paymentMethod: paymentAction === 'pay_online' ? 'online' : undefined,
      },
      segment: prompt,
    },
  ]);
}

export function rescueDiscoverBookAndPayCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isDiscoverBookAndPayCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'discover_book_and_pay_compound',
  };
}
