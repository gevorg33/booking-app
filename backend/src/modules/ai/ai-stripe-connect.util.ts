/** Dashboard mutate intent (ai-cmd-ext-2.15). */
export const CONFIGURE_STRIPE_CONNECT_INTENT =
  'configure_stripe_connect' as const;

export const STRIPE_CONNECT_CLASSIFIER_RULES = `- configure_stripe_connect: MUTATE — start or guide Stripe Connect onboarding for tenant booking payments (Settings → Billing). Returns navigate to /dashboard/billing, setup steps, and optional onboardingUrl when the user asks to connect/start now (backend startConnect — NOT raw OAuth codes in NL). Triggers: connect/set up/configure/enable/link/start/finish + Stripe Connect|Stripe account|online card payments for bookings. NOT explain_stripe_not_connected (read-only status), NOT explain_service_online_payment_setup (per-service prepayment summary), NOT open_billing_settings (subscription portal/plan), NOT guide_user_flow (generic walkthrough), and NOT configure_service_online_payment (service prepayment toggles).
- Examples:
  - "Connect Stripe for client payments" → configure_stripe_connect
  - "Set up Stripe Connect" → configure_stripe_connect
  - "Start Stripe onboarding now" → configure_stripe_connect, startOnboarding=true
  - "Link our Stripe account for booking checkout" → configure_stripe_connect
  - "Enable Stripe Connect on the billing page" → configure_stripe_connect`;

export type ConfigureStripeConnectPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_STRIPE_CONNECT_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_STRIPE_CONNECT_PROMPTS: ConfigureStripeConnectPromptFixture[] =
  [
    {
      id: 'connect-client-payments',
      prompt: 'Connect Stripe for client payments',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'setup-stripe-connect',
      prompt: 'Set up Stripe Connect',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'configure-booking-payments',
      prompt: 'Configure Stripe Connect for online booking payments',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'link-stripe-account',
      prompt: 'Link our Stripe account for booking checkout',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'start-onboarding-now',
      prompt: 'Start Stripe onboarding now',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
      paramsPartial: { startOnboarding: true },
    },
    {
      id: 'enable-booking-checkout',
      prompt: 'Enable Stripe Connect for booking checkout',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'billing-page-connect',
      prompt: 'Connect Stripe account on the billing page',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'open-onboarding',
      prompt: 'Open Stripe Connect onboarding',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
      paramsPartial: { startOnboarding: true },
    },
    {
      id: 'online-payments-stripe',
      prompt: 'Set up online payments with Stripe',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'accept-card-payments',
      prompt: 'Connect Stripe to accept card payments on public booking',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'finish-connect-setup',
      prompt: 'Finish Stripe Connect setup',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
    },
    {
      id: 'express-onboarding',
      prompt: 'Begin Stripe Express onboarding for our salon',
      surface: 'dashboard',
      expectedAction: CONFIGURE_STRIPE_CONNECT_INTENT,
      paramsPartial: { startOnboarding: true, mode: 'express' },
    },
  ];

const STRIPE_CONNECT_SIGNAL =
  /\b(stripe\s+connect|stripe\s+account|stripe\s+onboarding|connect\s+stripe|card\s+checkout|online\s+(?:card\s+)?payments?\s+(?:for\s+)?(?:bookings?|checkout|public\s+booking))\b/i;

const CONFIGURE_STRIPE_VERB =
  /\b(connect|set\s+up|setup|configure|enable|link|start|begin|finish|complete|open|turn\s+on)\b/i;

const READ_STRIPE_STATUS =
  /\b(explain|describe|what|which|why|how|show|summarize|status|is|are|ready|connected|not\s+connected)\b/i;

function isExplainStripeStatusPrompt(prompt: string): boolean {
  if (!READ_STRIPE_STATUS.test(prompt)) return false;
  if (CONFIGURE_STRIPE_VERB.test(prompt) && /\b(now|start|begin|open)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(?:is|are)\s+stripe\b/i.test(prompt) ||
    /\bstripe\s+connect\s+status\b/i.test(prompt) ||
    /\bwhy\s+(?:is\s+)?stripe\b/i.test(prompt) ||
    /\bexplain\s+stripe\b/i.test(prompt) ||
    /\bnot\s+connected\b/i.test(prompt)
  );
}

export type ParsedConfigureStripeConnect = {
  startOnboarding: boolean;
  mode?: 'oauth' | 'express';
  country?: string;
};

function parseConnectMode(
  prompt: string,
  params: Record<string, unknown>,
): 'oauth' | 'express' | undefined {
  const fromParams = params.mode;
  if (fromParams === 'oauth' || fromParams === 'express') return fromParams;
  if (/\bexpress\b/i.test(prompt)) return 'express';
  if (/\boauth\b/i.test(prompt)) return 'oauth';
  return undefined;
}

function parseConnectCountry(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  const fromParams = params.country;
  if (typeof fromParams === 'string' && /^[A-Za-z]{2}$/.test(fromParams.trim())) {
    return fromParams.trim().toUpperCase();
  }
  const iso = prompt.match(/\b(?:country\s+)?([A-Z]{2})\b/);
  if (iso?.[1] && !/^(OK|AI|UI)$/.test(iso[1])) return iso[1];
  return undefined;
}

function parseStartOnboarding(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  if (params.startOnboarding === true) return true;
  return (
    /\b(?:start|begin|open)\b/i.test(prompt) &&
    /\b(?:onboarding|setup|connect)\b/i.test(prompt)
  ) || /\bconnect\s+(?:stripe\s+)?now\b/i.test(prompt);
}

export function isConfigureStripeConnectPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainStripeStatusPrompt(text)) return false;
  if (
    /\b(per[-\s]?service|service\s+online\s+payment|prepayment\s+mode)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  if (
    /\b(subscription|billing\s+portal|invoice|plan|seat\s+limit)\b/i.test(text) &&
    !STRIPE_CONNECT_SIGNAL.test(text)
  ) {
    return false;
  }
  if (!CONFIGURE_STRIPE_VERB.test(text)) return false;
  if (!STRIPE_CONNECT_SIGNAL.test(text) && !/\bstripe\b/i.test(text)) {
    return false;
  }
  return true;
}

export function parseConfigureStripeConnectFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureStripeConnect | null {
  if (params._forceConfigureStripeConnect === true) {
    return {
      startOnboarding: params.startOnboarding === true,
      mode: parseConnectMode(prompt, params),
      country: parseConnectCountry(prompt, params),
    };
  }
  if (!isConfigureStripeConnectPrompt(prompt)) return null;
  return {
    startOnboarding: parseStartOnboarding(prompt, params),
    mode: parseConnectMode(prompt, params),
    country: parseConnectCountry(prompt, params),
  };
}

export function enrichConfigureStripeConnectParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigureStripeConnectFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    startOnboarding: parsed.startOnboarding,
    ...(parsed.mode ? { mode: parsed.mode } : {}),
    ...(parsed.country ? { country: parsed.country } : {}),
  };
}

/** NL rescue when classifier mislabels Stripe Connect configure prompts. */
export function rescueConfigureStripeConnectIntent(
  prompt: string,
  action: string,
): { action: typeof CONFIGURE_STRIPE_CONNECT_INTENT; rescueReason: string } | null {
  if (action === CONFIGURE_STRIPE_CONNECT_INTENT) return null;
  if (!isConfigureStripeConnectPrompt(prompt)) return null;
  return {
    action: CONFIGURE_STRIPE_CONNECT_INTENT,
    rescueReason: CONFIGURE_STRIPE_CONNECT_INTENT,
  };
}
