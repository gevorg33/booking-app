import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { parseCashPaymentsToggle } from './ai-payments.util.js';
import { parseServiceOnlinePaymentConfig } from './ai-service-online-payment.util.js';
import { parseOnlineBookingEnabledFromPrompt } from './ai-staff-operations.util.js';
import { isExplainPublicBookingCheckoutPrompt } from './ai-explain-public-booking-checkout.util.js';

export const SETUP_SALON_CHECKOUT_COMPOUND_STEP_ACTIONS = [
  'configure_stripe_connect',
  'configure_cash_payments',
  'configure_service_online_payment',
  'configure_online_booking',
] as const;

export type SetupSalonCheckoutCompoundStepAction =
  (typeof SETUP_SALON_CHECKOUT_COMPOUND_STEP_ACTIONS)[number];

export const SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID = 'setup_salon_checkout';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:connect|enable|accept|configure|turn)\b)/i;

export const SETUP_SALON_CHECKOUT_COMPOUND_CLASSIFIER_RULES = `- setup_salon_checkout (compound): dashboard multi-step salon/public checkout setup — decomposes to configure_stripe_connect (explain/guide, startOnboarding=false) → configure_cash_payments → configure_service_online_payment (allServices=true, prepaymentMode=deposit, depositPercent=50) → configure_online_booking (enabled=true). Use for "set up salon checkout end-to-end", "full checkout setup: Stripe, cash, online prepayment on all services, enable booking page". NOT configure_service_online_payment alone when user asks for full checkout; NOT configure_checkout_defaults (business defaults only); NOT explain_public_booking_checkout (read-only); NOT configure_stripe_connect alone when user also asks cash + online payment + booking.`;

const FULL_CHECKOUT_SETUP_CUE =
  /\b(?:setup\s+salon\s+checkout|salon\s+checkout\s+setup|full\s+checkout\s+setup|full\s+[\w\s]*checkout\s+configuration|checkout\s+setup\s+end[\s-]to[\s-]end|end[\s-]to[\s-]end\s+(?:salon\s+)?checkout|configure\s+(?:our\s+)?(?:salon\s+)?checkout)\b/i;

const SALON_VENUE_CUE =
  /\b(?:salon|spa|barbershop|beauty\s+salon|nail\s+salon)\b/i;

const STRIPE_STEP_CUE =
  /\b(?:connect|set\s+up|configure|link)\b.*\bstripe\b|\bstripe\s+connect\b|\bstripe\s+for\s+(?:card|client|booking)/i;

const CASH_STEP_CUE = /\b(?:cash|pay\s+at\s+(?:the\s+)?venue|accept\s+cash)\b/i;

const ONLINE_PAYMENT_STEP_CUE =
  /\b(?:online\s+payment|prepayment|50\s*%|half\s+deposit|deposit\s+prepayment)\b/i;

const BOOKING_STEP_CUE =
  /\b(?:online\s+booking|public\s+booking|booking\s+page|booking\s+website|turn\s+on\s+booking)\b/i;

function countSalonCheckoutStepFamilies(prompt: string): number {
  let count = 0;
  if (STRIPE_STEP_CUE.test(prompt)) count += 1;
  if (CASH_STEP_CUE.test(prompt)) count += 1;
  if (ONLINE_PAYMENT_STEP_CUE.test(prompt)) count += 1;
  if (BOOKING_STEP_CUE.test(prompt)) count += 1;
  return count;
}

export function isSetupSalonCheckoutCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 32) return false;
  if (isExplainPublicBookingCheckoutPrompt(text)) return false;

  const stepFamilies = countSalonCheckoutStepFamilies(text);
  if (stepFamilies < 3) return false;

  const fullSetup =
    FULL_CHECKOUT_SETUP_CUE.test(text) ||
    (/\b(?:set\s+up|setup)\b/i.test(text) &&
      /\bcheckout\b/i.test(text) &&
      (SALON_VENUE_CUE.test(text) || stepFamilies >= 4));

  if (!fullSetup && stepFamilies < 4) return false;

  return (
    fullSetup ||
    stepFamilies >= 4 ||
    COMPOUND_MARKERS.test(text) ||
    /;\s*/.test(text)
  );
}

export type SetupSalonCheckoutCompoundStep = {
  action: SetupSalonCheckoutCompoundStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildSetupSalonCheckoutCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities(
    {
      startOnboarding: false,
      acceptCashPayments: true,
      allServices: true,
      prepaymentMode: 'deposit',
      depositPercent: 50,
      enabled: true,
    },
    prompt,
  );

  const cashToggle = parseCashPaymentsToggle(prompt);
  if (cashToggle !== null) params.acceptCashPayments = cashToggle;

  const enabled = parseOnlineBookingEnabledFromPrompt(prompt);
  if (enabled !== null) params.enabled = enabled;

  const onlineConfig = parseServiceOnlinePaymentConfig(prompt, params);
  if (onlineConfig) {
    params.prepaymentMode = onlineConfig.prepaymentMode;
    if (onlineConfig.allServices) params.allServices = true;
    if (onlineConfig.depositPercent != null) {
      params.depositPercent = onlineConfig.depositPercent;
    }
  }

  return params;
}

export function decomposeSetupSalonCheckoutCompoundPrompt(
  prompt: string,
): SetupSalonCheckoutCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isSetupSalonCheckoutCompoundPrompt(trimmed)) return [];

  const base = buildSetupSalonCheckoutCompoundParams(trimmed);
  const steps: SetupSalonCheckoutCompoundStep[] = [
    {
      action: 'configure_stripe_connect',
      params: { ...base, _forceConfigureStripeConnect: true },
      segment: trimmed,
    },
    {
      action: 'configure_cash_payments',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'configure_service_online_payment',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'configure_online_booking',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueSetupSalonCheckoutCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isSetupSalonCheckoutCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'setup_salon_checkout_compound',
  };
}
