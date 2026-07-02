import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { isConfigureCheckoutDefaultsPrompt } from './ai-checkout-defaults.util.js';
import { isConfigureServicesPaymentMatrixCompoundPrompt } from './ai-configure-services-payment-matrix-compound.util.js';
import { isDeclineOnlinePaymentCategoryCompoundPrompt } from './ai-decline-online-payment-category-compound.util.js';
import {
  parseCashPaymentsToggle,
  hasCashMutateCue,
} from './ai-payments.util.js';
import { isSetupSalonCheckoutCompoundPrompt } from './ai-setup-salon-checkout-compound.util.js';
import {
  enrichServiceOnlinePaymentParamsFromPrompt,
  isConfigureServiceOnlinePaymentPrompt,
  parseServiceOnlinePaymentConfig,
} from './ai-service-online-payment.util.js';

export const CASH_AND_ONLINE_PAYMENT_COMPOUND_STEP_ACTIONS = [
  'configure_cash_payments',
  'configure_service_online_payment',
] as const;

export type CashAndOnlinePaymentCompoundStepAction =
  (typeof CASH_AND_ONLINE_PAYMENT_COMPOUND_STEP_ACTIONS)[number];

export const CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID =
  'cash_and_online_payment';

export const CONFIGURE_CASH_PAYMENTS_CLASSIFIER_RULES = `- configure_cash_payments (ai-cmd-ext-5.6): MUTATE — business-wide cash pay-at-venue toggle (acceptCashPayments). Pair with configure_service_online_payment (ai-cmd-ext-2.13) when the user changes cash AND per-service online payment policy in one message — use compound_intent, NOT configure_cash_payments alone.
- "Enable cash and decline online payment for all services" → compound cash_and_online_payment: configure_cash_payments then configure_service_online_payment (allServices=true, prepaymentMode=none).
- "Enable cash and decline dental services but accept 50% prepayment for massage" → compound decline_online_payment_category (4.7) + configure_cash_payments step.
- NOT configure_service_online_payment alone when user also enables/disables cash; NOT configure_checkout_defaults (defaults for new services); NOT setup_salon_checkout; NOT configure_services_payment_matrix (per-category matrix + optional price); NOT explain_service_online_payment_setup (read-only).`;

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:enable|turn|accept|allow|decline|disable|reject)\b)/i;

export { hasCashMutateCue } from './ai-payments.util.js';

export function hasOnlinePaymentMutateCue(prompt: string): boolean {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return true;
  return (
    /\b(?:decline|disable|turn\s+off|stop|reject|accept|require|enable)\b/i.test(
      prompt,
    ) && /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(prompt)
  );
}

function buildConfigureCashPaymentsStep(prompt: string): {
  action: 'configure_cash_payments';
  params: Record<string, unknown>;
  segment: string;
} {
  const toggle = parseCashPaymentsToggle(prompt);
  return {
    action: 'configure_cash_payments',
    params: enrichParamsWithSharedEntities(
      { acceptCashPayments: toggle ?? true },
      prompt,
    ),
    segment: prompt,
  };
}

function buildOnlinePaymentStep(prompt: string): {
  action: 'configure_service_online_payment';
  params: Record<string, unknown>;
  segment: string;
} | null {
  const parsed = parseServiceOnlinePaymentConfig(prompt, {});
  if (!parsed) return null;
  if (
    !parsed.allServices &&
    !parsed.categoryName &&
    !parsed.serviceName &&
    !parsed.serviceNames?.length
  ) {
    return null;
  }
  return {
    action: 'configure_service_online_payment',
    params: enrichServiceOnlinePaymentParamsFromPrompt(
      {
        ...(parsed.allServices ? { allServices: true } : {}),
        ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
        ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
        ...(parsed.serviceNames?.length
          ? { serviceNames: parsed.serviceNames }
          : {}),
        prepaymentMode: parsed.prepaymentMode,
        ...(parsed.depositPercent != null
          ? { depositPercent: parsed.depositPercent }
          : {}),
        ...(parsed.depositAmount != null
          ? { depositAmount: parsed.depositAmount }
          : {}),
      },
      prompt,
    ),
    segment: prompt,
  };
}

export function decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt(
  prompt: string,
): Array<{
  action: CashAndOnlinePaymentCompoundStepAction;
  params: Record<string, unknown>;
  segment: string;
}> {
  const trimmed = prompt.trim();
  if (
    !trimmed ||
    !hasCashMutateCue(trimmed) ||
    !hasOnlinePaymentMutateCue(trimmed)
  ) {
    return [];
  }
  if (isDeclineOnlinePaymentCategoryCompoundPrompt(trimmed)) return [];

  const onlineStep = buildOnlinePaymentStep(trimmed);
  if (!onlineStep) return [];

  const steps = [buildConfigureCashPaymentsStep(trimmed), onlineStep];
  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function isCashAndDeclineAllOnlinePaymentCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;
  if (isSetupSalonCheckoutCompoundPrompt(text)) return false;
  if (isConfigureServicesPaymentMatrixCompoundPrompt(text)) return false;
  if (isConfigureCheckoutDefaultsPrompt(text)) return false;
  if (isDeclineOnlinePaymentCategoryCompoundPrompt(text)) return false;
  if (!hasCashMutateCue(text) || !hasOnlinePaymentMutateCue(text)) return false;

  const steps = decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt(text);
  return steps.length >= 2;
}

export function isCashAndOnlinePaymentCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 24) return false;
  if (isSetupSalonCheckoutCompoundPrompt(text)) return false;
  if (isConfigureServicesPaymentMatrixCompoundPrompt(text)) return false;
  if (isConfigureCheckoutDefaultsPrompt(text)) return false;
  if (!hasCashMutateCue(text) || !hasOnlinePaymentMutateCue(text)) return false;

  if (isDeclineOnlinePaymentCategoryCompoundPrompt(text)) {
    return (
      COMPOUND_MARKERS.test(text) ||
      /\b(?:but|while|however)\b/i.test(text) ||
      /;\s*/.test(text)
    );
  }

  return isCashAndDeclineAllOnlinePaymentCompoundPrompt(text);
}

export function resolveCashAndOnlinePaymentCompoundRecipeId(
  prompt: string,
):
  | typeof CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID
  | 'decline_online_payment_category' {
  if (isDeclineOnlinePaymentCategoryCompoundPrompt(prompt)) {
    return 'decline_online_payment_category';
  }
  return CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID;
}

export function rescueCashAndOnlinePaymentCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isCashAndOnlinePaymentCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'cash_and_online_payment_compound',
  };
}
