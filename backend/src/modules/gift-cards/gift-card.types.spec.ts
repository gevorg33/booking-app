import {
  mergeGiftCardSettings,
  readBusinessGiftCardSettings,
} from './gift-card.types.js';

describe('gift-card.types', () => {
  it('merges defaults and normalizes preset amounts', () => {
    expect(
      mergeGiftCardSettings({
        purchaseEnabled: true,
        presetAmounts: [25, 0, 50],
      }),
    ).toMatchObject({
      purchaseEnabled: true,
      presetAmounts: [25, 50],
    });
  });

  it('reads nested business settings', () => {
    expect(
      readBusinessGiftCardSettings({
        giftCards: {
          physicalDeliveryEnabled: true,
          cardCreatorStaffIds: ['emp-1'],
        },
      }),
    ).toMatchObject({
      physicalDeliveryEnabled: true,
      cardCreatorStaffIds: ['emp-1'],
    });
    expect(readBusinessGiftCardSettings(null)).toMatchObject({
      purchaseEnabled: false,
    });
  });

  it('falls back to defaults for invalid array fields', () => {
    expect(mergeGiftCardSettings()).toMatchObject({
      purchaseEnabled: false,
      purchasablePackages: [],
      purchasableSubscriptionPlans: [],
    });
    expect(
      mergeGiftCardSettings({ presetAmounts: 'bad' as unknown as number[] }),
    ).toMatchObject({
      presetAmounts: [25, 50, 100],
    });
    expect(
      mergeGiftCardSettings({ bundles: null as unknown as [] }),
    ).toMatchObject({
      bundles: [],
    });
    expect(mergeGiftCardSettings({ shippingMethods: undefined })).toMatchObject(
      {
        shippingMethods: expect.arrayContaining([
          expect.objectContaining({ id: 'standard' }),
        ]),
      },
    );
  });

  it('preserves purchasable package and subscription plan settings', () => {
    expect(
      mergeGiftCardSettings({
        purchasablePackages: [{ packageId: 'pkg-1', price: 99 }],
        purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
      }),
    ).toMatchObject({
      purchasablePackages: [{ packageId: 'pkg-1', price: 99 }],
      purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
    });
  });
});
