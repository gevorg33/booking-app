import type { PublicGiftCardCatalogSettings } from './gift-card.types.js';

export const GIFT_CARD_CATALOG_SETTINGS: PublicGiftCardCatalogSettings = {
  digitalDeliveryEnabled: true,
  physicalDeliveryEnabled: false,
  presetAmounts: [25, 50, 100],
  purchasableServices: [{ serviceId: 'svc-1', price: 40 }],
  purchasablePackages: [],
  purchasableSubscriptionPlans: [],
  bundles: [{ id: 'bundle-1', name: 'Spa day', lines: [], price: 120 }],
  shippingMethods: [
    { id: 'standard', label: 'Standard', fee: 5, estimatedDays: '3-5 days' },
    { id: 'express', label: 'Express', fee: 12, estimatedDays: '1-2 days' },
  ],
  cancelModifyEnabled: true,
  cancelModifyWindowHours: 24,
  acceptCashPayments: true,
};

export const GIFT_CARD_CONTINUE_SCENARIOS = [
  { id: 'monetary', cardType: 'monetary' as const, amount: '50', selectedServiceIds: [], bundleId: '', packageId: '', subscriptionPlanId: '', expect: true },
  { id: 'service', cardType: 'service' as const, amount: '', selectedServiceIds: ['svc-1'], bundleId: '', packageId: '', subscriptionPlanId: '', expect: true },
  { id: 'bundle', cardType: 'bundle' as const, amount: '', selectedServiceIds: [], bundleId: 'bundle-1', packageId: '', subscriptionPlanId: '', expect: true },
  { id: 'empty-service', cardType: 'service' as const, amount: '', selectedServiceIds: [], bundleId: '', packageId: '', subscriptionPlanId: '', expect: false },
] as const;
