import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import {
  extractGuestContactFromPrompt,
  isGetManageLinkPrompt,
  parseGetManageLinkFromPrompt,
} from './ai-get-manage-link.util.js';
import {
  GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS,
  type GuestBookAndManageCompoundFixture,
} from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-book-and-manage-compound-multilingual.fixtures.js';
import {
  hasGuestPayCashManageCashCue,
  hasGuestPayCashManageGuestCue,
  hasGuestPayCashManageLinkCue,
} from './ai-guest-pay-cash-manage-cue.util.js';

export const GUEST_BOOK_AND_MANAGE_RECIPE_ID = 'guest_book_and_manage';

export const GUEST_BOOK_AND_MANAGE_STEP_ACTIONS = [
  'book_nearest_slot',
  'get_manage_link',
] as const;

export type GuestBookAndManageCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchGuestBookAndManageScenario(
  prompt: string,
): GuestBookAndManageCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isGuestBookAndManagePastBookingPrompt(prompt: string): boolean {
  return (
    /\b(?:i|we|already)\s+(?:have\s+)?booked\b/i.test(prompt) ||
    /\bbooked\s+as\s+(?:a\s+)?guest\b/i.test(prompt)
  );
}

export function hasGuestBookAndManageGuestCue(prompt: string): boolean {
  return (
    /\bbook(?:ing)?\s+as\s+(?:a\s+)?guest\b/i.test(prompt) ||
    /\bbook\s+without\s+(?:an?\s+)?account\b/i.test(prompt) ||
    /\bbook\s+without\s+(?:creating|signing\s+in)\b/i.test(prompt) ||
    /\bguest\s+(?:checkout\s+and\s+)?book\b/i.test(prompt) ||
    /\bcomplete\s+(?:a\s+)?guest\s+booking\b/i.test(prompt) ||
    (/\b(?:guest|without\s+(?:an?\s+)?account)\b/i.test(prompt) &&
      /\b(?:book|schedule|reserve|complete)\b/i.test(prompt))
  );
}

export function hasGuestBookAndManageManageLinkCue(prompt: string): boolean {
  if (isGetManageLinkPrompt(prompt)) return true;
  return (
    /\b(?:manage|booking|self[\s-]?service|appointment)\s+link\b/i.test(
      prompt,
    ) &&
    /\b(?:email|send|text|sms|resend|get|uxarkel|ссылк|hghum)\b/i.test(prompt)
  );
}

export function isGuestBookAndManageCompoundPrompt(prompt: string): boolean {
  if (matchGuestBookAndManageScenario(prompt)) return true;
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (isExplainGuestCheckoutFieldsPrompt(text)) return false;
  if (isGuestBookAndManagePastBookingPrompt(text)) return false;
  if (
    hasGuestPayCashManageGuestCue(text) &&
    hasGuestPayCashManageCashCue(text) &&
    hasGuestPayCashManageLinkCue(text)
  ) {
    return false;
  }
  if (
    /\blist\s+my\s+appointments?\b/i.test(text) &&
    hasGuestBookAndManageManageLinkCue(text)
  ) {
    return false;
  }
  if (!hasGuestBookAndManageGuestCue(text)) return false;
  if (!hasGuestBookAndManageManageLinkCue(text)) return false;
  return true;
}

export function buildGuestBookAndManageCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchGuestBookAndManageScenario(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    guestCheckout: true,
    bookingFirstAvailable: true,
    guestLookup: true,
  };

  const contact = extractGuestContactFromPrompt(prompt);
  if (contact.email) params.email = contact.email;
  if (contact.phone) params.phone = contact.phone;

  const manageLink = parseGetManageLinkFromPrompt(prompt, params);
  if (manageLink?.delivery) params.delivery = manageLink.delivery;
  if (manageLink?.email) params.email = manageLink.email;
  if (manageLink?.phone) params.phone = manageLink.phone;

  if (!isBookNearestSlotPrompt(prompt) && !params.serviceName) {
    params.bookingFirstAvailable = true;
  }

  enrichBookingTimeHintsFromPrompt('book_nearest_slot', params, prompt);

  if (scenario?.expectedParams) {
    Object.assign(params, scenario.expectedParams);
  }

  return params;
}

export function decomposeGuestBookAndManageCompoundPrompt(
  prompt: string,
): GuestBookAndManageCompoundStep[] {
  if (!isGuestBookAndManageCompoundPrompt(prompt)) return [];

  const base = buildGuestBookAndManageCompoundParams(prompt);
  const manageParams = {
    guestLookup: true,
    ...(base.email ? { email: base.email } : {}),
    ...(base.phone ? { phone: base.phone } : {}),
    ...(base.delivery ? { delivery: base.delivery } : {}),
  };

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'book_nearest_slot',
      params: {
        ...base,
        guestCheckout: true,
        bookingFirstAvailable: base.bookingFirstAvailable ?? true,
      },
      segment: prompt,
    },
    {
      action: 'get_manage_link',
      params: {
        ...base,
        ...manageParams,
      },
      segment: prompt,
    },
  ]);
}

export function rescueGuestBookAndManageCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isGuestBookAndManageCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'guest_book_and_manage_compound',
  };
}
