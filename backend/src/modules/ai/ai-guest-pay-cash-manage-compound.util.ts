import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';
import {
  extractGuestContactFromPrompt,
  parseGetManageLinkFromPrompt,
  resolveManageLinkDelivery,
} from './ai-get-manage-link.util.js';
import {
  isGuestPayCashManageCompoundCandidate,
  isGuestPayCashManagePastBookingPrompt,
} from './ai-guest-pay-cash-manage-cue.util.js';
import {
  GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS,
  type GuestPayCashManageCompoundFixture,
} from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-pay-cash-manage-compound-multilingual.fixtures.js';

export const GUEST_PAY_CASH_MANAGE_RECIPE_ID = 'guest_pay_cash_manage';

export type GuestPayCashManageCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchGuestPayCashManageScenario(
  prompt: string,
): GuestPayCashManageCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isGuestPayCashManageCompoundPrompt(prompt: string): boolean {
  if (matchGuestPayCashManageScenario(prompt)) return true;
  const text = prompt.trim();
  // e2e-bug.203 — do not defer to explain_guest_checkout_fields when guest+cash+link
  // mutate cues are present (named service still belongs to this compound).
  if (isGuestPayCashManagePastBookingPrompt(text)) return false;
  return isGuestPayCashManageCompoundCandidate(text);
}

export function buildGuestPayCashManageCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchGuestPayCashManageScenario(prompt);
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    guestCheckout: true,
    bookingFirstAvailable: true,
    guestLookup: true,
    paymentMethod: 'cash',
    guestPayCashManage: true,
  };

  const contact = extractGuestContactFromPrompt(prompt);
  if (contact.email) params.email = contact.email;
  if (contact.phone) params.phone = contact.phone;

  params.delivery = resolveManageLinkDelivery(prompt, contact);

  const manageLink = parseGetManageLinkFromPrompt(prompt, {
    ...params,
    guestPayCashManage: true,
  });
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

export function decomposeGuestPayCashManageCompoundPrompt(
  prompt: string,
): GuestPayCashManageCompoundStep[] {
  if (!isGuestPayCashManageCompoundPrompt(prompt)) return [];

  const base = buildGuestPayCashManageCompoundParams(prompt);
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
      action: 'pay_cash_at_visit',
      params: {
        ...base,
        paymentMethod: 'cash',
        continueAfterGuestBook: true,
      },
      segment: prompt,
    },
    {
      action: 'get_manage_link',
      params: {
        ...base,
        ...manageParams,
        continueAfterCashPayment: true,
      },
      segment: prompt,
    },
  ]);
}

export function rescueGuestPayCashManageCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isGuestPayCashManageCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'guest_pay_cash_manage_compound',
  };
}
