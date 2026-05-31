import {
  resolvePublicCheckoutKind,
  buildSubscriptionLineItem,
} from './subscription-checkout.util.js';

describe('subscription-checkout.util', () => {
  it('resolves checkout kind', () => {
    expect(resolvePublicCheckoutKind({ purchasePlanId: 'p1' })).toBe('subscription_purchase');
    expect(resolvePublicCheckoutKind({ useSubscriptionId: 's1' })).toBe('subscription_credit');
    expect(resolvePublicCheckoutKind({})).toBe('service_prepayment');
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

  it('prefers subscription purchase over subscription credit', () => {
    expect(
      resolvePublicCheckoutKind({ purchasePlanId: 'plan-1', useSubscriptionId: 'sub-1' }),
    ).toBe('subscription_purchase');
  });
});
