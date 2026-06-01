export type GiftCardType = 'monetary' | 'service' | 'bundle';
export type GiftCardDeliveryMethod = 'digital' | 'physical';

export type GiftCardFulfillmentStatus =
  | 'pending'
  | 'awaiting_card_creation'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface GiftCardShippingAddress {
  recipientName: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  stateRegion?: string | null;
  postalCode: string;
  country: string;
  instructions?: string | null;
}

export interface GiftCardBundleLine {
  serviceId: string;
  serviceName: string;
  quantity: number;
}

export interface GiftCardProductBundle {
  id: string;
  name: string;
  lines: GiftCardBundleLine[];
  price: number;
  expiresInMonths?: number | null;
}

export interface GiftCardProductService {
  serviceId: string;
  price?: number | null;
  expiresInMonths?: number | null;
}

export interface GiftCardBusinessSettings {
  purchaseEnabled: boolean;
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
  presetAmounts: number[];
  purchasableServices: GiftCardProductService[];
  bundles: GiftCardProductBundle[];
  defaultExpiryMonths: number | null;
  shippingMethods: Array<{
    id: string;
    label: string;
    fee: number;
    estimatedDays: string;
  }>;
  cardCreatorStaffIds: string[];
  deliveryStaffIds: string[];
  cancelModifyEnabled: boolean;
  cancelModifyWindowHours: number;
  physicalCancelBeforeReady: boolean;
}

export const DEFAULT_GIFT_CARD_SETTINGS: GiftCardBusinessSettings = {
  purchaseEnabled: false,
  digitalDeliveryEnabled: true,
  physicalDeliveryEnabled: false,
  presetAmounts: [25, 50, 100],
  purchasableServices: [],
  bundles: [],
  defaultExpiryMonths: 12,
  shippingMethods: [
    { id: 'standard', label: 'Standard shipping', fee: 5, estimatedDays: '5–7 business days' },
    { id: 'express', label: 'Express shipping', fee: 12, estimatedDays: '2–3 business days' },
  ],
  cardCreatorStaffIds: [],
  deliveryStaffIds: [],
  cancelModifyEnabled: true,
  cancelModifyWindowHours: 24,
  physicalCancelBeforeReady: true,
};

export function mergeGiftCardSettings(raw?: Record<string, unknown>): GiftCardBusinessSettings {
  const partial = (raw ?? {}) as Partial<GiftCardBusinessSettings>;
  return {
    ...DEFAULT_GIFT_CARD_SETTINGS,
    ...partial,
    presetAmounts: Array.isArray(partial.presetAmounts)
      ? partial.presetAmounts.map((n) => Number(n)).filter((n) => n > 0)
      : DEFAULT_GIFT_CARD_SETTINGS.presetAmounts,
    purchasableServices: Array.isArray(partial.purchasableServices)
      ? partial.purchasableServices
      : DEFAULT_GIFT_CARD_SETTINGS.purchasableServices,
    bundles: Array.isArray(partial.bundles) ? partial.bundles : DEFAULT_GIFT_CARD_SETTINGS.bundles,
    shippingMethods: Array.isArray(partial.shippingMethods)
      ? partial.shippingMethods
      : DEFAULT_GIFT_CARD_SETTINGS.shippingMethods,
    cardCreatorStaffIds: Array.isArray(partial.cardCreatorStaffIds)
      ? partial.cardCreatorStaffIds
      : [],
    deliveryStaffIds: Array.isArray(partial.deliveryStaffIds) ? partial.deliveryStaffIds : [],
  };
}

export function readBusinessGiftCardSettings(
  settings?: Record<string, unknown> | null,
): GiftCardBusinessSettings {
  const root = settings?.giftCards;
  if (!root || typeof root !== 'object') return { ...DEFAULT_GIFT_CARD_SETTINGS };
  return mergeGiftCardSettings(root as Record<string, unknown>);
}
