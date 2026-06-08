import { describe, expect, it } from 'vitest';
import {
  buildGiftCardPurchasePayload,
  canQuoteGiftCardPurchase,
  parseGiftCardServiceIdsFromSearch,
  resolveGiftCardClaimSuccessCopyKey,
  resolveGiftCardDeliveryOptions,
} from './gift-card-purchase.util.js';

describe('gift-card-purchase.util', () => {
  it('parses service ids from search params', () => {
    expect(parseGiftCardServiceIdsFromSearch(new URLSearchParams('serviceId=svc-1'))).toEqual(['svc-1']);
    expect(parseGiftCardServiceIdsFromSearch(new URLSearchParams('serviceIds=a,b'))).toEqual(['a', 'b']);
  });

  it('builds digital self-purchase payload', () => {
    const payload = buildGiftCardPurchasePayload({
      cardType: 'monetary',
      amount: '50',
      serviceIds: [],
      bundleId: '',
      packageId: '',
      subscriptionPlanId: '',
      deliveryMethod: 'digital',
      buyForSelf: true,
      shippingMethodId: 'standard',
      form: {
        purchaserName: 'Alex',
        purchaserEmail: 'alex@example.com',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        personalMessage: '',
        line1: '',
        line2: '',
        city: '',
        stateRegion: '',
        postalCode: '',
        country: 'US',
        instructions: '',
        consent: true,
      },
    });
    expect(payload).toMatchObject({
      cardType: 'monetary',
      amount: 50,
      purchaserEmail: 'alex@example.com',
      recipientEmail: 'alex@example.com',
    });
  });

  it('requires address fields for physical quote', () => {
    const form = {
      purchaserName: 'Alex',
      purchaserEmail: 'alex@example.com',
      recipientName: 'Sam',
      recipientEmail: 'sam@example.com',
      recipientPhone: '',
      personalMessage: '',
      line1: '',
      line2: '',
      city: '',
      stateRegion: '',
      postalCode: '',
      country: 'US',
      instructions: '',
      consent: true,
    };
    const payload = buildGiftCardPurchasePayload({
      cardType: 'monetary',
      amount: '50',
      serviceIds: [],
      bundleId: '',
      packageId: '',
      subscriptionPlanId: '',
      deliveryMethod: 'physical',
      buyForSelf: false,
      shippingMethodId: 'standard',
      form,
    });
    expect(
      canQuoteGiftCardPurchase({ payload, deliveryMethod: 'physical', form }),
    ).toBe(false);
  });

  it('resolves delivery options', () => {
    expect(
      resolveGiftCardDeliveryOptions({ digitalDeliveryEnabled: true, physicalDeliveryEnabled: false }),
    ).toEqual(['digital']);
  });

  it('maps claim success copy keys', () => {
    expect(resolveGiftCardClaimSuccessCopyKey('package')).toBe('giftCardClaimPackageSuccess');
    expect(resolveGiftCardClaimSuccessCopyKey('monetary')).toBe('giftCardClaimSuccess');
  });
});
