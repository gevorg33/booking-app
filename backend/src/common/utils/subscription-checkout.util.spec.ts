import {
  resolvePublicCheckoutKind,
  buildSubscriptionLineItem,
  buildPackageLineItem,
  buildMultiServiceLineItem,
} from './subscription-checkout.util.js';

describe('subscription-checkout.util', () => {
  it('resolves checkout kind', () => {
    expect(resolvePublicCheckoutKind({ purchasePlanId: 'p1' })).toBe(
      'subscription_purchase',
    );
    expect(resolvePublicCheckoutKind({ useSubscriptionId: 's1' })).toBe(
      'subscription_credit',
    );
    expect(resolvePublicCheckoutKind({})).toBe('service_prepayment');
  });

  it('prefers package over multi-service and subscription kinds', () => {
    expect(
      resolvePublicCheckoutKind({
        packageId: 'pkg-1',
        serviceIds: ['a', 'b'],
        purchasePlanId: 'plan-1',
      }),
    ).toBe('package_purchase');
    expect(resolvePublicCheckoutKind({ serviceIds: ['a', 'b'] })).toBe(
      'multi_service_booking',
    );
    expect(
      resolvePublicCheckoutKind({
        purchasePlanId: 'plan-1',
        useSubscriptionId: 'sub-1',
      }),
    ).toBe('subscription_purchase');
  });

  it('builds subscription line item copy', () => {
    expect(buildSubscriptionLineItem('Short', 6, 3)).toEqual({
      name: 'Short subscription',
      description: '6 appointments over 3 months',
    });
    expect(buildSubscriptionLineItem('Annual', 24, 12)).toEqual({
      name: 'Annual subscription',
      description: '24 appointments over 12 months',
    });
  });

  it('builds package line item copy (gap-8.3)', () => {
    expect(buildPackageLineItem('Spa Day', 2)).toEqual({
      name: 'Spa Day',
      description: 'Bundle of 2 appointments',
    });
    expect(buildPackageLineItem('Solo', 1)).toEqual({
      name: 'Solo',
      description: 'Bundle of 1 appointment',
    });
  });

  it('builds multi-service line item copy (gap-8.7)', () => {
    expect(buildMultiServiceLineItem(2)).toEqual({
      name: 'Multi-service appointment',
      description: '2 services in one visit',
    });
    expect(buildMultiServiceLineItem(3).description).toBe(
      '3 services in one visit',
    );
  });
});
