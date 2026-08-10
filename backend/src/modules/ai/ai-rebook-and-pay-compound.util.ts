import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import {
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import { isBookWithGiftCardCompoundPrompt } from './ai-book-with-gift-card.util.js';
import { isGiftCardCheckoutCompoundPrompt } from './ai-gift-card-payments-hints.util.js';
import { isGiftCardCheckApplyBookCompoundPrompt } from './ai-gift-card-checkout-compound.util.js';
import {
  hasRebookLastAppointmentCoreCue,
  parseRebookLastAppointmentFromPrompt,
} from './ai-rebook-last-appointment.util.js';
import {
  REBOOK_AND_PAY_COMPOUND_PROMPTS,
  type RebookAndPayCompoundFixture,
} from './ai-rebook-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-rebook-and-pay-compound-multilingual.fixtures.js';

export const REBOOK_AND_PAY_RECIPE_ID = 'rebook_and_pay';

export const REBOOK_AND_PAY_STEP_ACTIONS = [
  'rebook_last_appointment',
  'pay_online',
] as const;

export type RebookAndPayPaymentAction = 'pay_online' | 'choose_payment_method';

export type RebookAndPayCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchRebookAndPayScenario(
  prompt: string,
): RebookAndPayCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of REBOOK_AND_PAY_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of REBOOK_AND_PAY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasRebookAndPayPaymentCue(prompt: string): boolean {
  if (/\bgift\s*card\b/i.test(prompt)) return false;
  if (isPayOnlinePrompt(prompt)) return true;
  if (isChoosePaymentMethodPrompt(prompt)) return true;
  if (
    isAskPaymentOptionsPrompt(prompt) &&
    /\b(?:rebook|repeat|last|same)\b/i.test(prompt)
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
  return false;
}

export function isRebookAndPayCompoundPrompt(prompt: string): boolean {
  if (/\bgift\s*card\b/i.test(prompt)) return false;
  if (matchRebookAndPayScenario(prompt)) return true;
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (!hasRebookLastAppointmentCoreCue(text)) return false;
  if (!hasRebookAndPayPaymentCue(text)) return false;
  return true;
}

export function resolveRebookAndPayPaymentAction(
  prompt: string,
): RebookAndPayPaymentAction {
  const scenario = matchRebookAndPayScenario(prompt);
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

export function buildRebookAndPayCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = {
    ...buildSharedBookingContextFromPrompt(prompt),
    ...parseRebookLastAppointmentFromPrompt(prompt),
  };
  return params;
}

export function decomposeRebookAndPayCompoundPrompt(
  prompt: string,
): RebookAndPayCompoundStep[] {
  if (!isRebookAndPayCompoundPrompt(prompt)) return [];

  const base = buildRebookAndPayCompoundParams(prompt);
  const paymentAction = resolveRebookAndPayPaymentAction(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'rebook_last_appointment',
      params: { ...base },
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

export function rescueRebookAndPayCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isRebookAndPayCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'rebook_and_pay_compound',
  };
}
