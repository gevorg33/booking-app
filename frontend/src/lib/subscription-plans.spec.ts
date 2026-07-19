import { describe, it, expect } from 'vitest';
import {
  buildQuoteRequest,
  filterActiveSubscriptionPlans,
  formatSubscriptionPlanAssignLabel,
  isSubscriptionCheckoutSelection,
  resolveCheckoutAmountDue,
  resolveCheckoutSubtotal,
  serviceIdsWithSubscriptionPlans,
  subscriptionCheckoutPayload,
  subscriptionPlansForService,
} from './subscription-plans';

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

describe('subscription-plans', () => {
  it('filters active plans only', () => {
    expect(filterActiveSubscriptionPlans(plans)).toHaveLength(2);
    expect(filterActiveSubscriptionPlans(plans).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('returns plans for a single service', () => {
    expect(subscriptionPlansForService(plans, 'svc-1')).toHaveLength(2);
    expect(subscriptionPlansForService(plans, 'svc-2')).toHaveLength(1);
  });

  it('collects unique service ids from active plans', () => {
    expect(serviceIdsWithSubscriptionPlans(plans)).toEqual(['svc-1']);
  });

  it('formats assign label with visits, duration, and price', () => {
    expect(formatSubscriptionPlanAssignLabel(plans[0])).toBe(
      'Short — 6 visits / 3 mo — $142.50',
    );
    expect(
      formatSubscriptionPlanAssignLabel({
        id: 'p0',
        name: 'Basic',
        serviceId: 'svc-1',
        durationMonths: 1,
        includedAppointments: 1,
      }),
    ).toBe('Basic — 1 visits / 1 mo — $0.00');
  });

  it('detects subscription checkout selection', () => {
    expect(isSubscriptionCheckoutSelection('subscription', 'p1')).toBe(true);
    expect(isSubscriptionCheckoutSelection('subscription', '')).toBe(false);
    expect(isSubscriptionCheckoutSelection('subscription', '   ')).toBe(false);
    expect(isSubscriptionCheckoutSelection('one-time', 'p1')).toBe(false);
  });

  it('builds subscription checkout payload', () => {
    expect(subscriptionCheckoutPayload('subscription', 'p2')).toEqual({
      purchasePlanId: 'p2',
      useSubscriptionCreditOnPurchase: true,
    });
    expect(subscriptionCheckoutPayload('one-time', 'p2')).toEqual({});
    expect(subscriptionCheckoutPayload('subscription', '')).toEqual({});
  });

  it('resolves checkout amount due with promo quote for subscription', () => {
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: false,
        quoteAmountDue: 672,
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(672);
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: false,
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(684);
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: true,
        quoteAmountDue: 672,
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(0);
    expect(
      resolveCheckoutAmountDue({
        usingSubscriptionCredit: false,
        fallback: 120,
      }),
    ).toBe(120);
  });

  it('resolves checkout subtotal for subscription plans', () => {
    expect(
      resolveCheckoutSubtotal({
        purchaseType: 'subscription',
        quoteSubtotal: 684,
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(684);
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
        subscriptionPlanPrice: 684,
        fallback: 120,
      }),
    ).toBe(120);
    expect(
      resolveCheckoutSubtotal({
        purchaseType: 'one-time',
        fallback: 120,
      }),
    ).toBe(120);
  });

  it('builds quote request with subscription plan and promo', () => {
    expect(
      buildQuoteRequest({
        serviceId: 'svc-1',
        purchaseType: 'subscription',
        selectedPlanId: 'plan-1',
        promoCode: 'SAVE12',
        loyaltyPointsToRedeem: 5,
      }),
    ).toEqual({
      serviceId: 'svc-1',
      purchasePlanId: 'plan-1',
      promoCode: 'SAVE12',
      loyaltyPointsToRedeem: 5,
    });
    expect(
      buildQuoteRequest({
        serviceId: 'svc-1',
        purchaseType: 'one-time',
        selectedPlanId: '',
        promoCode: 'SAVE12',
      }),
    ).toEqual({
      serviceId: 'svc-1',
      promoCode: 'SAVE12',
    });
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
});
