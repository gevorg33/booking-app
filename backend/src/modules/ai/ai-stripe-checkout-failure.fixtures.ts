/** Dashboard classifier rules for Stripe checkout session failure diagnosis (ai-cmd-curr-12). */
export const STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES = `- diagnose_stripe_checkout_failure: READ — diagnose common Stripe Connect currency mismatch causes when online checkout session creation fails for the tenant (unsupported business default ISO code, legacy service.currency resolving to an unsupported code, Stripe Connect not linked, incomplete onboarding). Suggest fixes: switch to a supported currency, align catalog via bulk_update_service_currency, finish Billing setup, enable cash/pay-at-venue. NOT explain_stripe_currency_warning (Settings warning banner or supported ISO list), NOT explain_stripe_checkout_currency (customer why charged in € / ֏ / $), and NOT explain_business_currency (default currency overview).
- Examples:
  - "Why does Stripe checkout session creation fail for our currency?" → diagnose_stripe_checkout_failure
  - "Diagnose Stripe checkout failures on the booking page" → diagnose_stripe_checkout_failure
  - "Customers can't pay online — Stripe checkout error, currency mismatch?" → diagnose_stripe_checkout_failure
  - "Checkout session failed — troubleshoot Stripe Connect currency issues" → diagnose_stripe_checkout_failure
  - "Почему не создаётся Stripe checkout session из-за валюты?" → diagnose_stripe_checkout_failure
  - "Ինչու է Stripe checkout session-ը չստեղծվում արժույթի պատճառով" → diagnose_stripe_checkout_failure`;

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS = [
  {
    id: 'why-session-fail-currency',
    prompt: 'Why does Stripe checkout session creation fail for our currency?',
  },
  {
    id: 'diagnose-booking-checkout-failures',
    prompt: 'Diagnose Stripe checkout failures on the booking page',
  },
  {
    id: 'customers-cant-pay-currency-mismatch',
    prompt:
      "Customers can't pay online — Stripe checkout error, what currency mismatch causes?",
  },
  {
    id: 'checkout-session-troubleshoot-connect',
    prompt:
      'Checkout session failed — troubleshoot Stripe Connect currency issues',
  },
  {
    id: 'wont-create-session-dram',
    prompt: "Why won't Stripe create a checkout session in dram?",
  },
  {
    id: 'online-payment-keeps-failing',
    prompt:
      'Online payment checkout keeps failing — is it a currency problem with Stripe Connect?',
  },
  {
    id: 'session-creation-tenant-currency',
    prompt:
      'Stripe checkout session creation error for our tenant currency — what should I check?',
  },
  {
    id: 'debug-stripe-checkout-currency',
    prompt: 'Debug Stripe checkout currency mismatch when session creation fails',
  },
  {
    id: 'ru-session-not-created-currency',
    prompt: 'Почему не создаётся Stripe checkout session из-за валюты?',
  },
  {
    id: 'hy-session-not-created-currency',
    prompt: 'Ինչու է Stripe checkout session-ը չստեղծվում արժույթի պատճառով',
  },
] as const;
