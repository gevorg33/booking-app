import type { PublicBusinessProfile, PublicCheckoutQuote, PublicService } from './types.js';

const baseService: PublicService = {
  id: 'svc-1',
  name: 'Cut',
  durationMinutes: 30,
  price: 40,
  prepaymentMode: 'none',
  onlinePaymentEnabled: false,
};

const cashProfile: Pick<PublicBusinessProfile, 'acceptCashPayments'> = {
  acceptCashPayments: true,
};

const noCashProfile: Pick<PublicBusinessProfile, 'acceptCashPayments'> = {
  acceptCashPayments: false,
};

const quoteDue: PublicCheckoutQuote = {
  servicePrice: 40,
  subtotal: 40,
  amountDue: 40,
  currency: 'USD',
};

export const CHECKOUT_PAYMENT_SCENARIOS = [
  {
    id: 'no-cash-when-prepayment-full',
    profile: cashProfile,
    service: { ...baseService, prepaymentMode: 'full' as const, onlinePaymentEnabled: true },
    quote: quoteDue,
    showCash: false,
    requiresOnline: true,
  },
  {
    id: 'cash-when-allowed',
    profile: cashProfile,
    service: baseService,
    quote: quoteDue,
    showCash: true,
    requiresOnline: false,
  },
  {
    id: 'online-when-deposit-due',
    profile: cashProfile,
    service: {
      ...baseService,
      prepaymentMode: 'deposit' as const,
      onlinePaymentEnabled: true,
      depositAmount: 20,
    },
    quote: { ...quoteDue, amountDue: 20 },
    showCash: false,
    requiresOnline: true,
  },
  {
    id: 'cash-selected-skips-online',
    profile: cashProfile,
    service: {
      ...baseService,
      prepaymentMode: 'full' as const,
      onlinePaymentEnabled: true,
    },
    quote: quoteDue,
    paymentMethod: 'cash' as const,
    showCash: false,
    requiresOnline: false,
  },
  // Business-level acceptCashPayments: false must hide cash even for an
  // otherwise-eligible (prepaymentMode: 'none') service.
  {
    id: 'no-cash-when-business-disallows-eligible-service',
    profile: noCashProfile,
    service: baseService,
    quote: quoteDue,
    showCash: false,
    requiresOnline: false,
  },
  // ...and stays hidden (for the same underlying reason, doubly so) when the
  // service also requires full online prepayment.
  {
    id: 'no-cash-when-business-disallows-and-prepayment-full',
    profile: noCashProfile,
    service: { ...baseService, prepaymentMode: 'full' as const, onlinePaymentEnabled: true },
    quote: quoteDue,
    showCash: false,
    requiresOnline: true,
  },
] as const;
