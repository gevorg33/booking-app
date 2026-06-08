import type { PublicBusinessProfile, PublicCheckoutQuote, PublicService } from './types.js';

const cashProfile: Pick<PublicBusinessProfile, 'acceptCashPayments'> = {
  acceptCashPayments: true,
};

const baseService: PublicService = {
  id: 'svc-1',
  name: 'Cut',
  durationMinutes: 30,
  price: 40,
  prepaymentMode: 'none',
  onlinePaymentEnabled: false,
};

const quoteDue: PublicCheckoutQuote = {
  servicePrice: 40,
  subtotal: 40,
  amountDue: 40,
  currency: 'USD',
};

export const ACTIVATION_PATH_SCENARIOS = [
  {
    id: 'first-booking',
    input: { completedBookingCount: 0, isDeferredResume: false },
    expectActivation: true,
  },
  {
    id: 'deferred-resume',
    input: { completedBookingCount: 2, isDeferredResume: true },
    expectActivation: true,
  },
  {
    id: 'returning-customer',
    input: { completedBookingCount: 3, isDeferredResume: false },
    expectActivation: false,
  },
] as const;

export const ACTIVATION_PAYMENT_METHOD_SCENARIOS = [
  {
    id: 'activation-defaults-cash',
    input: { isActivationPath: true, cashAvailable: true, currentMethod: 'online' as const },
    expectMethod: 'cash' as const,
  },
  {
    id: 'returning-keeps-online',
    input: { isActivationPath: false, cashAvailable: true, currentMethod: 'online' as const },
    expectMethod: 'online' as const,
  },
  {
    id: 'activation-no-cash-keeps-online',
    input: { isActivationPath: true, cashAvailable: false, currentMethod: 'online' as const },
    expectMethod: 'online' as const,
  },
] as const;

export const ACTIVATION_PAYMENT_FALLBACK_SCENARIOS = [
  {
    id: 'checkout-failed-on-activation',
    input: {
      isActivationPath: true,
      cashAvailable: true,
      checkoutFailed: true,
      awaitingPaymentReturn: false,
    },
    expectAutoRetry: true,
    expectShowFallback: true,
  },
  {
    id: 'payment-return-stuck',
    input: {
      isActivationPath: true,
      cashAvailable: true,
      checkoutFailed: false,
      awaitingPaymentReturn: true,
    },
    expectAutoRetry: false,
    expectShowFallback: true,
  },
  {
    id: 'returning-no-fallback',
    input: {
      isActivationPath: false,
      cashAvailable: true,
      checkoutFailed: true,
      awaitingPaymentReturn: true,
    },
    expectAutoRetry: false,
    expectShowFallback: false,
  },
  {
    id: 'no-cash-no-fallback',
    input: {
      isActivationPath: true,
      cashAvailable: false,
      checkoutFailed: true,
      awaitingPaymentReturn: true,
    },
    expectAutoRetry: false,
    expectShowFallback: false,
  },
] as const;

export const ACTIVATION_CONFIRM_BLOCK_SCENARIOS = [
  {
    id: 'activation-cash-never-blocks',
    profile: cashProfile,
    service: baseService,
    quote: quoteDue,
    isActivationPath: true,
    paymentMethod: 'online' as const,
    expectBlocks: false,
  },
  {
    id: 'activation-online-only-blocks',
    profile: cashProfile,
    service: { ...baseService, prepaymentMode: 'full' as const, onlinePaymentEnabled: true },
    quote: quoteDue,
    isActivationPath: true,
    paymentMethod: 'online' as const,
    expectBlocks: true,
  },
  {
    id: 'returning-online-required',
    profile: cashProfile,
    service: { ...baseService, prepaymentMode: 'full' as const, onlinePaymentEnabled: true },
    quote: quoteDue,
    isActivationPath: false,
    paymentMethod: 'online' as const,
    expectBlocks: true,
  },
] as const;

export const ACTIVATION_SLOT_PREFILL_SCENARIOS = [
  {
    id: 'deferred-resume-slot',
    input: {
      isActivationPath: true,
      hasSlot: true,
      isDeferredResume: true,
      slotAutoSelected: false,
    },
    expectPrefilled: true,
  },
  {
    id: 'first-booking-auto-slot',
    input: {
      isActivationPath: true,
      hasSlot: true,
      isDeferredResume: false,
      slotAutoSelected: true,
    },
    expectPrefilled: true,
  },
  {
    id: 'manual-slot-not-prefill',
    input: {
      isActivationPath: true,
      hasSlot: true,
      isDeferredResume: false,
      slotAutoSelected: false,
    },
    expectPrefilled: false,
  },
] as const;
