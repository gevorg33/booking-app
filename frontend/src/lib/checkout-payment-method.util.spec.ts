import { describe, expect, it } from 'vitest';
import {
  requiresSingleServiceOnlinePayment,
  resolveSingleServiceOnlineAmountDue,
  showSingleServiceCashPaymentOption,
} from './checkout-payment-method.util';

describe('checkout-payment-method.util (e2e-bug.222)', () => {
  describe('resolveSingleServiceOnlineAmountDue', () => {
    it.each([
      {
        id: 'pay-at-visit-quote-zero',
        opts: {
          usingSubscriptionCredit: false,
          quoteAmountDue: 0,
          onlineChargeBase: 0,
        },
        expected: 0,
      },
      {
        id: 'full-prepay-quote',
        opts: {
          usingSubscriptionCredit: false,
          quoteAmountDue: 40,
          onlineChargeBase: 40,
        },
        expected: 40,
      },
      {
        id: 'subscription-credit',
        opts: {
          usingSubscriptionCredit: true,
          quoteAmountDue: 80,
          onlineChargeBase: 80,
        },
        expected: 0,
      },
      {
        id: 'fallback-online-base-not-catalog',
        opts: {
          usingSubscriptionCredit: false,
          quoteAmountDue: null,
          onlineChargeBase: 0,
        },
        expected: 0,
      },
      {
        id: 'plan-price',
        opts: {
          usingSubscriptionCredit: false,
          quoteAmountDue: undefined,
          onlineChargeBase: 0,
          subscriptionPlanPrice: 432,
        },
        expected: 432,
      },
    ])('$id → $expected', ({ opts, expected }) => {
      expect(resolveSingleServiceOnlineAmountDue(opts)).toBe(expected);
    });
  });

  describe('showSingleServiceCashPaymentOption', () => {
    const base = {
      acceptCashPayments: true,
      purchaseType: 'one-time' as const,
      usingSubscriptionCredit: false,
      amountDue: 80,
      dueNow: 0,
      prepaymentMode: 'none',
    };

    it.each([
      {
        id: 'swedish-none-legacy-amountDue-80',
        opts: { ...base },
        show: false,
      },
      {
        id: 'swedish-none-fixed-amountDue-0',
        opts: { ...base, amountDue: 0 },
        show: false,
      },
      {
        id: 'full-prepay',
        opts: {
          ...base,
          prepaymentMode: 'full',
          dueNow: 40,
          amountDue: 40,
        },
        show: false,
      },
      {
        id: 'deposit',
        opts: {
          ...base,
          prepaymentMode: 'deposit',
          dueNow: 25,
          amountDue: 25,
        },
        show: false,
      },
      {
        id: 'cash-disabled',
        opts: { ...base, acceptCashPayments: false, dueNow: 10, amountDue: 10, prepaymentMode: 'deposit' },
        show: false,
      },
    ])('$id → show=$show', ({ opts, show }) => {
      expect(showSingleServiceCashPaymentOption(opts)).toBe(show);
    });
  });

  describe('requiresSingleServiceOnlinePayment', () => {
    it.each([
      {
        id: 'none-amountDue-0',
        opts: {
          amountDue: 0,
          paymentMethod: 'online' as const,
          purchaseType: 'one-time' as const,
          dueNow: 0,
        },
        required: false,
      },
      {
        id: 'none-legacy-amountDue-80-still-no-stripe',
        opts: {
          amountDue: 80,
          paymentMethod: 'online' as const,
          purchaseType: 'one-time' as const,
          dueNow: 0,
        },
        required: false,
      },
      {
        id: 'full',
        opts: {
          amountDue: 40,
          paymentMethod: 'online' as const,
          purchaseType: 'one-time' as const,
          dueNow: 40,
        },
        required: true,
      },
      {
        id: 'cash-selected',
        opts: {
          amountDue: 40,
          paymentMethod: 'cash' as const,
          purchaseType: 'one-time' as const,
          dueNow: 40,
        },
        required: false,
      },
      {
        id: 'subscription-plan',
        opts: {
          amountDue: 432,
          paymentMethod: 'online' as const,
          purchaseType: 'subscription' as const,
          dueNow: 0,
        },
        required: true,
      },
    ])('$id → required=$required', ({ opts, required }) => {
      expect(requiresSingleServiceOnlinePayment(opts)).toBe(required);
    });
  });
});
