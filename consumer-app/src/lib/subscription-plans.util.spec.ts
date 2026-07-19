import { describe, expect, it } from 'vitest';
import {
  buildQuoteRequest,
  filterActiveSubscriptionPlans,
  isSubscriptionCheckoutSelection,
  resolveCheckoutAmountDue,
  resolveCheckoutSubtotal,
  subscriptionCheckoutPayload,
  subscriptionPlansForService,
} from './subscription-plans.util.js';

const plans = [
  {
    id: 'p1',
    name: 'Short',
    serviceId: 'svc-1',
    durationMonths: 3,
    includedAppointments: 6,
    isActive: true,
    preview: { pricing: { subscriptionPrice: 142.5 } },
  },
  {
    id: 'p2',
    name: 'Long',
    serviceId: 'svc-1',
    durationMonths: 12,
    includedAppointments: 24,
    isActive: true,
    preview: { pricing: { subscriptionPrice: 480 } },
  },
  {
    id: 'p3',
    name: 'Other service',
    serviceId: 'svc-2',
    durationMonths: 6,
    includedAppointments: 12,
    isActive: false,
    preview: { pricing: { subscriptionPrice: 270 } },
  },
];

describe('subscription-plans.util', () => {
  it('filters active plans only', () => {
    expect(filterActiveSubscriptionPlans(plans)).toHaveLength(2);
  });

  it('returns plans for a single service', () => {
    expect(subscriptionPlansForService(plans, 'svc-1')).toHaveLength(2);
  });

  it('detects subscription checkout selection', () => {
    expect(isSubscriptionCheckoutSelection('subscription', 'p1')).toBe(true);
    expect(isSubscriptionCheckoutSelection('subscription', '')).toBe(false);
    expect(isSubscriptionCheckoutSelection('one-time', 'p1')).toBe(false);
  });

  it('builds subscription checkout payload', () => {
    expect(subscriptionCheckoutPayload('subscription', 'p2')).toEqual({
      purchasePlanId: 'p2',
      useSubscriptionCreditOnPurchase: true,
    });
    expect(subscriptionCheckoutPayload('one-time', 'p2')).toEqual({});
  });

  it('resolves checkout amount due with subscription credit', () => {
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: true,
        quoteAmountDue: 120,
        fallback: 120,
      }),
    ).toBe(0);
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: false,
        quoteAmountDue: 672,
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(672);
  });

  it('builds quote request with subscription plan', () => {
    expect(
      buildQuoteRequest({
        serviceId: 'svc-1',
        purchaseType: 'subscription',
        selectedPlanId: 'plan-1',
        promoCode: 'SAVE12',
      }),
    ).toEqual({
      serviceId: 'svc-1',
      purchasePlanId: 'plan-1',
      promoCode: 'SAVE12',
    });
  });

  it('e2e-bug.28: buildQuoteRequest includes useSubscriptionId', () => {
    expect(
      buildQuoteRequest({
        serviceId: 'svc-1',
        purchaseType: 'one-time',
        selectedPlanId: '',
        useSubscriptionId: 'sub-1',
      }),
    ).toEqual({
      serviceId: 'svc-1',
      useSubscriptionId: 'sub-1',
    });
  });

  it('resolves checkout subtotal for subscription plans', () => {
    expect(
      resolveCheckoutSubtotal({
        purchaseType: 'subscription',
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(684);
    expect(
      resolveCheckoutSubtotal({
        purchaseType: 'one-time',
        quoteSubtotal: 120,
        fallback: 120,
      }),
    ).toBe(120);
  });
});
