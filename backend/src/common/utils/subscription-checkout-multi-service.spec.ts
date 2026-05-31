import {
  buildMultiServiceLineItem,
  resolvePublicCheckoutKind,
} from './subscription-checkout.util.js';

describe('subscription-checkout.util multi-service', () => {
  it('resolves multi-service checkout kind', () => {
    expect(resolvePublicCheckoutKind({ serviceIds: ['a', 'b'] })).toBe('multi_service_booking');
    expect(resolvePublicCheckoutKind({ packageId: 'p1' })).toBe('package_purchase');
  });

  it('builds multi-service stripe line item', () => {
    expect(buildMultiServiceLineItem(2).description).toContain('2 services');
  });
});
