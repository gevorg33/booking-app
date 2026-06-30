import type { SetupSalonCheckoutCompoundStepAction } from './ai-setup-salon-checkout-compound.util.js';

export type SetupSalonCheckoutCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: readonly SetupSalonCheckoutCompoundStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS: SetupSalonCheckoutCompoundFixture[] = [
  {
    id: 'salon-checkout-e2e-en',
    prompt:
      'Set up salon checkout end-to-end: connect Stripe for client payments, enable cash at venue, accept online payment on all services with 50% prepayment, enable online booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      startOnboarding: false,
      acceptCashPayments: true,
      allServices: true,
      prepaymentMode: 'deposit',
      depositPercent: 50,
      enabled: true,
    },
    misclassifiedAction: 'configure_service_online_payment',
  },
  {
    id: 'full-checkout-setup-spa-en',
    prompt:
      'Full checkout setup for our spa — link Stripe Connect, turn on cash payments, require 50% online prepayment on every service, and enable the public booking page',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      startOnboarding: false,
      acceptCashPayments: true,
      allServices: true,
      prepaymentMode: 'deposit',
      depositPercent: 50,
      enabled: true,
    },
    misclassifiedAction: 'configure_cash_payments',
  },
  {
    id: 'configure-salon-checkout-scratch-en',
    prompt:
      'Configure salon checkout from scratch; connect Stripe; enable cash at checkout; accept online payment on all services with half deposit; turn on online booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
    misclassifiedAction: 'configure_stripe_connect',
  },
  {
    id: 'barbershop-checkout-end-to-end-en',
    prompt:
      'Barbershop checkout setup end-to-end: set up Stripe Connect for booking payments, enable cash pay-at-venue, online prepayment 50% on all services, enable booking website',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'beauty-salon-public-checkout-en',
    prompt:
      'Get our beauty salon public checkout ready — connect Stripe for client payments; enable cash; accept online payment on all services with 50% prepayment; enable online booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'salon-payments-booking-setup-en',
    prompt:
      'Salon payments and booking setup: link Stripe account, accept cash at venue, require deposit prepayment on all services, turn on public booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'checkout-setup-stripe-cash-online-en',
    prompt:
      'Checkout setup — connect Stripe Connect, enable cash payments, configure online payment for all services with 50% prepayment, and enable online booking page',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'nail-salon-checkout-full-en',
    prompt:
      'Full nail salon checkout configuration: Stripe for card payments, cash at venue, 50% prepayment on all services, enable booking website',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'setup-checkout-salon-semicolon-en',
    prompt:
      'Setup salon checkout: connect Stripe for client payments; enable cash at venue; accept online payment on all services with 50% prepayment; enable public booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'end-to-end-checkout-salon-en',
    prompt:
      'End-to-end checkout for the salon — configure Stripe Connect, enable cash, set 50% online prepayment on all services, then enable online booking',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
  {
    id: 'salon-booking-checkout-complete-en',
    prompt:
      'Complete salon booking checkout setup: link Stripe for booking payments and enable cash at venue; require online prepayment on all services with 50% deposit; turn on booking page',
    orderedActions: [
      'configure_stripe_connect',
      'configure_cash_payments',
      'configure_service_online_payment',
      'configure_online_booking',
    ] as const,
  },
];

export const SETUP_SALON_CHECKOUT_EN_SCENARIO_IDS =
  SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS.map((row) => row.id);

export const SETUP_SALON_CHECKOUT_RESCUE_SCENARIOS =
  SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    SetupSalonCheckoutCompoundFixture & { misclassifiedAction: string }
  >;
