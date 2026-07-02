import { PrepaymentMode } from '../service/entities/service.entity.js';
import { parseServiceOnlinePaymentConfig } from './ai-service-online-payment.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.16). */
export const CONFIGURE_CHECKOUT_DEFAULTS_INTENT =
  'configure_checkout_defaults' as const;

export type CheckoutDefaultsAccessTier = 'M';

export function resolveCheckoutDefaultsAccessTier(
  action: string,
): CheckoutDefaultsAccessTier | null {
  return action === CONFIGURE_CHECKOUT_DEFAULTS_INTENT ? 'M' : null;
}

export const CHECKOUT_DEFAULTS_CLASSIFIER_RULES = `- configure_checkout_defaults: MUTATE — business checkout defaults on Settings/Billing (cash at venue) plus default online prepayment policy for newly created catalog services (stored in business.settings.publicBooking). Compound-friendly: one message may set acceptCashPayments and defaultServicePrepaymentMode together. Triggers: checkout defaults, default prepayment for new services, pay at venue + new service default, set default online payment policy for new services. Params: acceptCashPayments (boolean), defaultServicePrepaymentMode (none|full|deposit), defaultServiceDepositPercent (number; omit or null for 50% deposit). NOT configure_cash_payments (cash only, no new-service default), NOT configure_service_online_payment (mutate existing catalog services), NOT explain_service_online_payment_setup (read-only per-service summary), NOT explain_public_booking_checkout (read-only holistic checkout flow), NOT configure_stripe_connect (Stripe onboarding).
- Examples:
  - "Set checkout defaults: allow cash at venue and 50% prepayment for new services" → acceptCashPayments=true, defaultServicePrepaymentMode=deposit, defaultServiceDepositPercent=50
  - "Default new services to full prepayment" → defaultServicePrepaymentMode=full
  - "Allow pay at venue and require full prepayment on new services" → acceptCashPayments=true, defaultServicePrepaymentMode=full
  - "Configure checkout defaults — disable cash and no online payment for new services" → acceptCashPayments=false, defaultServicePrepaymentMode=none`;

export type ConfigureCheckoutDefaultsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_CHECKOUT_DEFAULTS_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS: ConfigureCheckoutDefaultsPromptFixture[] =
  [
    {
      id: 'checkout-defaults-cash-deposit',
      prompt:
        'Set checkout defaults: allow cash at venue and 50% prepayment for new services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        acceptCashPayments: true,
        defaultServicePrepaymentMode: 'deposit',
        defaultServiceDepositPercent: 50,
      },
    },
    {
      id: 'default-new-services-full',
      prompt: 'Default new services to full prepayment',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: { defaultServicePrepaymentMode: 'full' },
    },
    {
      id: 'cash-and-full-new-services',
      prompt: 'Allow pay at venue and require full prepayment on new services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        acceptCashPayments: true,
        defaultServicePrepaymentMode: 'full',
      },
    },
    {
      id: 'disable-cash-no-online-new',
      prompt:
        'Configure checkout defaults — disable cash and no online payment for new services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        acceptCashPayments: false,
        defaultServicePrepaymentMode: 'none',
      },
    },
    {
      id: 'new-services-25-deposit',
      prompt: 'Set default online payment for new services to 25% deposit',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        defaultServicePrepaymentMode: 'deposit',
        defaultServiceDepositPercent: 25,
      },
    },
    {
      id: 'checkout-defaults-cash-only',
      prompt: 'Set checkout defaults to accept cash at venue',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: { acceptCashPayments: true },
    },
    {
      id: 'new-services-no-prepayment',
      prompt: 'Default new services to no online payment',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: { defaultServicePrepaymentMode: 'none' },
    },
    {
      id: 'checkout-defaults-compound',
      prompt:
        'Configure checkout defaults: enable cash payments and half prepayment for new services',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        acceptCashPayments: true,
        defaultServicePrepaymentMode: 'deposit',
        defaultServiceDepositPercent: 50,
      },
    },
    {
      id: 'pay-at-venue-new-service-default',
      prompt: 'Turn on pay at venue and set new service default to 50% deposit',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        acceptCashPayments: true,
        defaultServicePrepaymentMode: 'deposit',
        defaultServiceDepositPercent: 50,
      },
    },
    {
      id: 'default-prepayment-policy-new',
      prompt:
        'Set the default prepayment policy for new services to full payment online',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: { defaultServicePrepaymentMode: 'full' },
    },
    {
      id: 'checkout-defaults-disable-cash',
      prompt: 'Update checkout defaults — turn off cash at venue',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: { acceptCashPayments: false },
    },
    {
      id: 'new-catalog-deposit-default',
      prompt:
        'For newly added services default to online payment with 50% deposit',
      surface: 'dashboard',
      expectedAction: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
      paramsPartial: {
        defaultServicePrepaymentMode: 'deposit',
        defaultServiceDepositPercent: 50,
      },
    },
  ];

const CHECKOUT_DEFAULTS_SIGNAL =
  /\bcheckout\s+defaults?\b|\bdefault\s+(?:online\s+)?(?:pre)?payment(?:\s+policy)?\b|\b(?:new|newly\s+added|future|added)\s+services?\b/i;

const NEW_SERVICE_SIGNAL =
  /\b(?:new|newly\s+added|future|added)\s+services?\b|\bnew\s+service\s+default\b|\bfor\s+new\s+services?\b/i;

const CASH_AT_VENUE_SIGNAL =
  /\b(cash|pay\s+at\s+(?:the\s+)?venue|pay-at-venue)\b/i;

const EXISTING_CATALOG_SCOPE =
  /\b(?:all|every|each)\s+services?\b|\bfor\s+[A-Za-z][\w\s'-]+\s+service\b|\bpublic\s+booking\b/i;

function parseCashToggle(prompt: string): boolean | null {
  if (/\b(disable|turn\s+off|reject|stop)\b/i.test(prompt)) return false;
  if (/\b(enable|turn\s+on|accept|allow)\b/i.test(prompt)) return true;
  return null;
}

function mentionsExistingCatalogScope(prompt: string): boolean {
  if (!EXISTING_CATALOG_SCOPE.test(prompt)) return false;
  return !NEW_SERVICE_SIGNAL.test(prompt);
}

export function isConfigureCheckoutDefaultsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (mentionsExistingCatalogScope(text)) return false;

  if (/\bcheckout\s+defaults?\b/i.test(text)) return true;

  const hasNewServices = NEW_SERVICE_SIGNAL.test(text);
  const hasCash = CASH_AT_VENUE_SIGNAL.test(text);
  const hasDefaultPrepayment =
    hasNewServices &&
    /\b(default|prepayment|online\s+payment|deposit|full\s+prepayment|no\s+online\s+payment)\b/i.test(
      text,
    );

  if (hasNewServices && (hasCash || hasDefaultPrepayment)) return true;

  if (
    CHECKOUT_DEFAULTS_SIGNAL.test(text) &&
    (hasCash || /\bprepayment\b/i.test(text))
  ) {
    return true;
  }

  return false;
}

export type ParsedCheckoutDefaultsConfig = {
  acceptCashPayments?: boolean;
  defaultServicePrepaymentMode?: PrepaymentMode;
  defaultServiceDepositPercent?: number | null;
};

function prepaymentModeFromParams(
  params: Record<string, unknown>,
): PrepaymentMode | undefined {
  const raw = params.defaultServicePrepaymentMode ?? params.prepaymentMode;
  if (raw === 'none' || raw === PrepaymentMode.NONE) return PrepaymentMode.NONE;
  if (raw === 'full' || raw === PrepaymentMode.FULL) return PrepaymentMode.FULL;
  if (raw === 'deposit' || raw === PrepaymentMode.DEPOSIT) {
    return PrepaymentMode.DEPOSIT;
  }
  return undefined;
}

function parseDefaultPrepaymentFromPrompt(
  prompt: string,
): PrepaymentMode | undefined {
  if (/\bno\s+online\s+payment\b/i.test(prompt)) return PrepaymentMode.NONE;
  if (
    /\bfull\s+(?:payment|prepayment)\b/i.test(prompt) ||
    /\bpay\s+in\s+full\b/i.test(prompt) ||
    /\bfull\s+prepayment\b/i.test(prompt)
  ) {
    return PrepaymentMode.FULL;
  }
  if (/\bhalf\s+prepayment\b/i.test(prompt)) return PrepaymentMode.DEPOSIT;
  const pct = prompt.match(/\b(\d{1,2}|100)\s*%\s*(?:deposit|prepayment)?/i);
  if (pct && Number(pct[1]) < 100) return PrepaymentMode.DEPOSIT;
  if (
    /\b(deposit|prepayment|pre[-\s]?pay|partial)\b/i.test(prompt) &&
    !/\bfull\b/i.test(prompt)
  ) {
    return PrepaymentMode.DEPOSIT;
  }
  return undefined;
}

function parseDefaultDepositPercent(prompt: string): number | null | undefined {
  if (/\bhalf\s+prepayment\b/i.test(prompt)) return 50;
  const pct = prompt.match(/\b(\d{1,2}|100)\s*%\s*(?:deposit|prepayment)?/i);
  if (pct) {
    const value = Number(pct[1]);
    if (value > 0 && value < 100) return value;
    if (value === 50) return 50;
  }
  return undefined;
}

export function parseConfigureCheckoutDefaultsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedCheckoutDefaultsConfig | null {
  if (
    !isConfigureCheckoutDefaultsPrompt(prompt) &&
    !params._forceCheckoutDefaults
  ) {
    const hasExplicitParams =
      typeof params.acceptCashPayments === 'boolean' ||
      prepaymentModeFromParams(params) !== undefined;
    if (!hasExplicitParams) return null;
  }

  const config: ParsedCheckoutDefaultsConfig = {};

  if (typeof params.acceptCashPayments === 'boolean') {
    config.acceptCashPayments = params.acceptCashPayments;
  } else if (CASH_AT_VENUE_SIGNAL.test(prompt)) {
    const toggle = parseCashToggle(prompt);
    if (toggle !== null) config.acceptCashPayments = toggle;
  }

  const modeFromParams = prepaymentModeFromParams(params);
  if (modeFromParams) {
    config.defaultServicePrepaymentMode = modeFromParams;
    if (modeFromParams === PrepaymentMode.DEPOSIT) {
      if (typeof params.defaultServiceDepositPercent === 'number') {
        config.defaultServiceDepositPercent =
          params.defaultServiceDepositPercent;
      } else if (params.defaultServiceDepositPercent === null) {
        config.defaultServiceDepositPercent = null;
      }
    }
  } else if (
    NEW_SERVICE_SIGNAL.test(prompt) ||
    /\bdefault\s+(?:online\s+)?(?:pre)?payment\b/i.test(prompt) ||
    /\bcheckout\s+defaults?\b/i.test(prompt)
  ) {
    const mode = parseDefaultPrepaymentFromPrompt(prompt);
    if (mode) {
      config.defaultServicePrepaymentMode = mode;
      if (mode === PrepaymentMode.DEPOSIT) {
        const pct = parseDefaultDepositPercent(prompt);
        if (pct !== undefined) config.defaultServiceDepositPercent = pct;
      }
    } else {
      const onlineConfig = parseServiceOnlinePaymentConfig(
        prompt.replace(/\bnew\s+services?\b/gi, 'services'),
        params,
      );
      if (onlineConfig?.prepaymentMode) {
        config.defaultServicePrepaymentMode = onlineConfig.prepaymentMode;
        if (onlineConfig.prepaymentMode === PrepaymentMode.DEPOSIT) {
          config.defaultServiceDepositPercent =
            onlineConfig.depositPercent === undefined
              ? undefined
              : onlineConfig.depositPercent;
        }
      }
    }
  }

  if (
    config.acceptCashPayments === undefined &&
    config.defaultServicePrepaymentMode === undefined
  ) {
    return null;
  }

  return config;
}

export function rescueConfigureCheckoutDefaultsIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_CHECKOUT_DEFAULTS_INTENT;
  rescueReason: string;
} | null {
  if (action === CONFIGURE_CHECKOUT_DEFAULTS_INTENT) return null;
  if (!isConfigureCheckoutDefaultsPrompt(prompt)) return null;
  return {
    action: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
    rescueReason: CONFIGURE_CHECKOUT_DEFAULTS_INTENT,
  };
}

export function describeCheckoutDefaultPrepayment(
  mode: PrepaymentMode,
  depositPercent?: number | null,
): string {
  if (mode === PrepaymentMode.NONE) return 'no online payment';
  if (mode === PrepaymentMode.FULL) return 'full prepayment';
  if (depositPercent != null && depositPercent !== 50) {
    return `${depositPercent}% deposit`;
  }
  return '50% deposit';
}
