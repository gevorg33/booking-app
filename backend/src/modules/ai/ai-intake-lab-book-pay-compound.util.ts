import { propagateSharedBookingContextAcrossSteps } from './ai-compound-booking-context.util.js';
import {
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';
import { isDiscoverBookAndPayCompoundPrompt } from './ai-discover-book-and-pay-compound.util.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';
import { isBookLabCollectionNearestCompoundPrompt } from './ai-book-lab-collection-nearest.util.js';
import {
  buildCompleteIntakeAndBookCompoundParams,
  isCompleteIntakeAndBookCorePrompt,
} from './ai-complete-intake-and-book.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS,
  type IntakeLabBookPayCompoundFixture,
} from './ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS } from './ai-intake-lab-book-pay-compound-multilingual.fixtures.js';

export const INTAKE_LAB_BOOK_PAY_RECIPE_ID = 'intake_lab_book_pay';
export const PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID =
  'public_intake_lab_book_pay';

export const INTAKE_LAB_BOOK_PAY_CUSTOMER_STEP_ACTIONS = [
  'complete_intake_and_book',
  'book_nearest_slot',
  'pay_online',
] as const;

export const INTAKE_LAB_BOOK_PAY_PUBLIC_STEP_ACTIONS = [
  'complete_intake_and_book',
  'book_appointment',
  'pay_online',
] as const;

export type IntakeLabBookPayPaymentAction =
  | 'pay_online'
  | 'choose_payment_method';

export type IntakeLabBookPayCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchIntakeLabBookPayScenario(
  prompt: string,
): IntakeLabBookPayCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';

export function isIntakeLabBookPayCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchIntakeLabBookPayScenario(text)) return true;
  if (isExplainPublicIntakeFormPrompt(text)) return false;
  if (isDiscoverBookAndPayCompoundPrompt(text)) return false;
  if (isBookLabCollectionNearestCompoundPrompt(text)) return false;
  if (!hasIntakeLabBookPayPaymentCue(text)) return false;
  return isCompleteIntakeAndBookCorePrompt(text);
}

export function resolveIntakeLabBookPayPaymentAction(
  prompt: string,
): IntakeLabBookPayPaymentAction {
  const scenario = matchIntakeLabBookPayScenario(prompt);
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

export function decomposePublicIntakeLabBookPayCompoundPrompt(
  prompt: string,
): IntakeLabBookPayCompoundStep[] {
  return decomposeIntakeLabBookPayCompoundPrompt(prompt, 'public');
}

export function decomposeCustomerIntakeLabBookPayCompoundPrompt(
  prompt: string,
): IntakeLabBookPayCompoundStep[] {
  return decomposeIntakeLabBookPayCompoundPrompt(prompt, 'customer');
}

export function decomposeIntakeLabBookPayCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'customer' | 'public'>,
): IntakeLabBookPayCompoundStep[] {
  if (!isIntakeLabBookPayCompoundPrompt(prompt)) return [];

  const trimmed = prompt.trim();
  const base = buildCompleteIntakeAndBookCompoundParams(trimmed);
  const bookAction =
    surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
  const bookParams = {
    ...base,
    bookingPhase: 'schedule',
    continueAfterIntake: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, bookParams, trimmed);

  const intakeSteps = propagateSharedBookingContextAcrossSteps([
    {
      action: 'complete_intake_and_book',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: bookAction,
      params: bookParams,
      segment: trimmed,
    },
  ]);
  if (intakeSteps.length === 0) return [];

  const paymentAction = resolveIntakeLabBookPayPaymentAction(prompt);
  const bookStepParams = intakeSteps[intakeSteps.length - 1]?.params ?? {};

  return propagateSharedBookingContextAcrossSteps([
    ...intakeSteps.map((step) => ({
      action: step.action,
      params: step.params,
      segment: prompt,
    })),
    {
      action: paymentAction,
      params: {
        ...bookStepParams,
        paymentMethod: paymentAction === 'pay_online' ? 'online' : undefined,
        continueAfterBooking: true,
        intakeLabBookPay: true,
      },
      segment: prompt,
    },
  ]);
}

export function rescueIntakeLabBookPayCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isIntakeLabBookPayCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'intake_lab_book_pay_compound',
  };
}
