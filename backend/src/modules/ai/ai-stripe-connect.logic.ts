import type { StripeIntegrationPublicView } from '../billing/stripe-integration.types.js';
import type { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import { parseConfigureStripeConnectFromPrompt } from './ai-stripe-connect.util.js';

export interface ConfigureStripeConnectLogicDeps {
  stripeIntegrationService: StripeIntegrationService;
}

const BILLING_PATH = '/dashboard/billing';

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function buildNavigate(path: string, label?: string) {
  return { path, ...(label ? { label } : {}) };
}

function buildSetupSteps(
  stripe: StripeIntegrationPublicView,
  startOnboarding: boolean,
): string[] {
  if (stripe.chargesEnabled && stripe.configured) {
    return [
      'Stripe Connect is ready — you can enable online payment per service on the Services page.',
    ];
  }

  if (stripe.connectAccountId && !stripe.chargesEnabled) {
    return [
      'Stripe Connect onboarding is started but not finished.',
      'Open Billing → Client booking payments and click Continue setup to finish in Stripe.',
      ...(startOnboarding
        ? ['Use the onboarding link below to resume Stripe setup.']
        : []),
    ];
  }

  return [
    'Open Billing → Client booking payments.',
    stripe.oauthAvailable
      ? 'Click Connect your Stripe account (OAuth) to link your existing Stripe account.'
      : 'Click Connect with Stripe to start Express onboarding for your country.',
    'After Stripe confirms charges are enabled, turn on online payment per service on the Services page.',
  ];
}

export async function handleConfigureStripeConnectLogic(
  deps: ConfigureStripeConnectLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureStripeConnectFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'configure_stripe_connect',
      'Ask to connect or set up Stripe Connect (e.g. "Connect Stripe for client payments" or "Start Stripe onboarding now").',
      { clarify: true },
    );
  }

  let stripe: StripeIntegrationPublicView;
  try {
    stripe = await deps.stripeIntegrationService.getPublicSettings(businessId);
  } catch (err: any) {
    return failure(
      'configure_stripe_connect',
      err?.message ?? 'Could not load Stripe Connect settings.',
    );
  }

  const navigate = buildNavigate(BILLING_PATH, 'Open Billing');
  const steps = buildSetupSteps(stripe, parsed.startOnboarding);

  if (stripe.chargesEnabled && stripe.configured) {
    return success(
      'configure_stripe_connect',
      'Stripe Connect is already connected and charges are enabled. Open Billing to review the account or manage payout settings.',
      {
        stripe,
        navigate,
        steps,
        alreadyConnected: true,
      },
    );
  }

  let onboardingUrl: string | undefined;
  if (parsed.startOnboarding) {
    try {
      const link = await deps.stripeIntegrationService.startConnect(
        businessId,
        {
          mode: parsed.mode,
          country: parsed.country,
        },
      );
      onboardingUrl = link.url;
    } catch (err: any) {
      return failure(
        'configure_stripe_connect',
        err?.message ??
          'Could not start Stripe Connect onboarding. Check your plan includes Stripe Connect and try from Billing.',
        { stripe, navigate, steps },
      );
    }
  }

  const summary = onboardingUrl
    ? 'Stripe Connect onboarding is ready — open the link below or go to Billing → Client booking payments to finish setup.'
    : stripe.connectAccountId
      ? 'Continue Stripe Connect setup on the Billing page to enable online card payments.'
      : 'Connect Stripe on the Billing page to accept online card payments for bookings.';

  return success('configure_stripe_connect', summary, {
    stripe,
    navigate,
    steps,
    ...(onboardingUrl ? { onboardingUrl } : {}),
    startOnboarding: parsed.startOnboarding,
    mode: parsed.mode,
    country: parsed.country,
  });
}
