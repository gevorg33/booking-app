import { describe, it, expect } from 'vitest';
import {
  filterActiveSubscriptionPlans,
  formatSubscriptionPlanAssignLabel,
  isSubscriptionCheckoutSelection,
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
});
