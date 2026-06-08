import { describe, expect, it } from 'vitest';
import {
  buildBookingSubscriptionFields,
  isUsingSubscriptionCredit,
  requiresCheckoutOnlinePayment,
  shouldShowSubscriptionCheckoutOptions,
  showCheckoutCashOption,
} from './checkout-subscription.util.js';

describe('checkout-subscription.util', () => {
  const service = {
    price: 120,
    onlinePaymentEnabled: true,
    prepaymentMode: 'none' as const,
    depositAmount: null,
  };

  it('detects subscription credit usage', () => {
    expect(
      isUsingSubscriptionCredit({
        activeSubscription: { appointmentsRemaining: 2 },
        useExistingSubscription: true,
        purchaseType: 'one-time',
      }),
    ).toBe(true);
    expect(
      isUsingSubscriptionCredit({
        activeSubscription: { appointmentsRemaining: 2 },
        useExistingSubscription: false,
        purchaseType: 'one-time',
      }),
    ).toBe(false);
  });

  it('builds booking subscription fields', () => {
    expect(
      buildBookingSubscriptionFields({
        usingSubscriptionCredit: true,
        activeSubscriptionId: 'sub-1',
        purchaseType: 'one-time',
        selectedPlanId: '',
      }),
    ).toEqual({ useSubscriptionId: 'sub-1' });
    expect(
      buildBookingSubscriptionFields({
        usingSubscriptionCredit: false,
        purchaseType: 'subscription',
        selectedPlanId: 'plan-1',
      }),
    ).toEqual({
      purchasePlanId: 'plan-1',
      useSubscriptionCreditOnPurchase: true,
    });
  });

  it('requires online payment for subscription purchase', () => {
    expect(
      requiresCheckoutOnlinePayment({
        amountDue: 480,
        paymentMethod: 'online',
        purchaseType: 'subscription',
        service,
      }),
    ).toBe(true);
    expect(
      requiresCheckoutOnlinePayment({
        amountDue: 0,
        paymentMethod: 'online',
        purchaseType: 'subscription',
        service,
      }),
    ).toBe(false);
  });

  it('hides cash option for subscription purchase and credit visits', () => {
    expect(
      showCheckoutCashOption({
        profile: { acceptCashPayments: true },
        purchaseType: 'subscription',
        usingSubscriptionCredit: false,
        amountDue: 480,
        service,
      }),
    ).toBe(false);
    expect(
      showCheckoutCashOption({
        profile: { acceptCashPayments: true },
        purchaseType: 'one-time',
        usingSubscriptionCredit: true,
        amountDue: 0,
        service,
      }),
    ).toBe(false);
    expect(
      showCheckoutCashOption({
        profile: { acceptCashPayments: true },
        purchaseType: 'one-time',
        usingSubscriptionCredit: false,
        amountDue: 120,
        service,
      }),
    ).toBe(true);
  });

  it('shows subscription checkout options when plans or active credit exist', () => {
    expect(
      shouldShowSubscriptionCheckoutOptions({
        hasSubscriptionPlans: false,
        activeSubscription: null,
        subscriptionPlans: [],
      }),
    ).toBe(false);
    expect(
      shouldShowSubscriptionCheckoutOptions({
        hasSubscriptionPlans: true,
        activeSubscription: null,
        subscriptionPlans: [],
      }),
    ).toBe(true);
  });
});
