/** Canonical shared entity param ids (ai-cmd-0.1). */
export const SHARED_ENTITY_PARAM_IDS = [
  'packageId',
  'packagePurchaseId',
  'multiServiceGroupId',
  'subscriptionPlanId',
  'customerSubscriptionId',
  'giftCardCode',
  'giftCardOrderId',
  'resourceId',
  'locationId',
  'paymentMethod',
  'serviceIds',
  'categoryDraft',
] as const;

export type SharedEntityParamId = (typeof SHARED_ENTITY_PARAM_IDS)[number];

export type SharedPaymentMethod =
  | 'cash'
  | 'online'
  | 'gift_card'
  | 'subscription_credit'
  | 'card'
  | 'stripe';

export interface CategoryDraftService {
  serviceName: string;
  durationMinutes: number;
  price: number;
  description?: string;
  bufferMinutes?: number;
  currency?: string;
}

export interface CategoryDraftEntry {
  categoryName: string;
  description?: string;
  services: CategoryDraftService[];
}

export type SharedEntityParamValue = {
  packageId?: string;
  packagePurchaseId?: string;
  multiServiceGroupId?: string;
  subscriptionPlanId?: string;
  customerSubscriptionId?: string;
  giftCardCode?: string;
  giftCardOrderId?: string;
  resourceId?: string;
  locationId?: string;
  paymentMethod?: SharedPaymentMethod;
  serviceIds?: string[];
  categoryDraft?: CategoryDraftEntry[];
};
