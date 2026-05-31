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
  });
});
