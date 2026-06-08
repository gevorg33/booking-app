import type { ConsumerCopy } from './consumer-copy.types.js';
import type {
  PurchasePublicGiftCardBody,
  PublicGiftCardDeliveryMethod,
  PublicGiftCardType,
} from './gift-card.types.js';

export interface GiftCardCheckoutFormState {
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  personalMessage: string;
  line1: string;
  line2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  instructions: string;
  consent: boolean;
}

export function resolveGiftCardDeliveryOptions(input: {
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
}): PublicGiftCardDeliveryMethod[] {
  const opts: PublicGiftCardDeliveryMethod[] = [];
  if (input.digitalDeliveryEnabled) opts.push('digital');
  if (input.physicalDeliveryEnabled) opts.push('physical');
  return opts;
}

export function parseGiftCardServiceIdsFromSearch(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get('serviceIds');
  if (raw) {
    return raw.split(',').map((id) => id.trim()).filter(Boolean);
  }
  const single = searchParams.get('serviceId')?.trim();
  return single ? [single] : [];
}

export function buildGiftCardPurchasePayload(input: {
  cardType: PublicGiftCardType;
  amount: string;
  serviceIds: string[];
  bundleId: string;
  packageId: string;
  subscriptionPlanId: string;
  deliveryMethod: PublicGiftCardDeliveryMethod;
  buyForSelf: boolean;
  shippingMethodId: string;
  form: GiftCardCheckoutFormState;
  customerName?: string | null;
}): PurchasePublicGiftCardBody | null {
  if (!input.form.purchaserEmail.trim()) return null;

  const purchaserName =
    input.form.purchaserName.trim() || input.customerName?.trim() || undefined;
  const payload: PurchasePublicGiftCardBody = {
    cardType: input.cardType,
    deliveryMethod: input.deliveryMethod,
    buyForSelf: input.buyForSelf,
    purchaserEmail: input.form.purchaserEmail.trim(),
    purchaserName,
    personalMessage: input.form.personalMessage.trim() || undefined,
  };

  if (input.cardType === 'monetary') payload.amount = Number(input.amount);
  if (input.cardType === 'service') {
    if (input.serviceIds.length === 1) payload.serviceId = input.serviceIds[0];
    else if (input.serviceIds.length > 1) payload.serviceIds = input.serviceIds;
  }
  if (input.cardType === 'bundle') payload.bundleId = input.bundleId;
  if (input.cardType === 'package') payload.packageId = input.packageId;
  if (input.cardType === 'subscription') payload.subscriptionPlanId = input.subscriptionPlanId;

  if (!input.buyForSelf || input.deliveryMethod === 'physical') {
    payload.recipientName = input.form.recipientName.trim() || undefined;
    payload.recipientEmail = input.form.recipientEmail.trim() || undefined;
    payload.recipientPhone = input.form.recipientPhone.trim() || undefined;
  } else if (input.buyForSelf && input.deliveryMethod === 'digital') {
    payload.recipientEmail = input.form.purchaserEmail.trim();
    payload.recipientName = purchaserName;
  }

  if (input.deliveryMethod === 'physical') {
    payload.shippingMethodId = input.shippingMethodId;
    payload.shippingAddress = {
      recipientName: input.form.recipientName.trim(),
      phone: input.form.recipientPhone.trim() || undefined,
      line1: input.form.line1.trim(),
      line2: input.form.line2.trim() || undefined,
      city: input.form.city.trim(),
      stateRegion: input.form.stateRegion.trim() || undefined,
      postalCode: input.form.postalCode.trim(),
      country: input.form.country.trim(),
      instructions: input.form.instructions.trim() || undefined,
    };
  }

  return payload;
}

export function canQuoteGiftCardPurchase(input: {
  payload: PurchasePublicGiftCardBody | null;
  deliveryMethod: PublicGiftCardDeliveryMethod;
  form: GiftCardCheckoutFormState;
}): boolean {
  if (!input.payload?.purchaserEmail) return false;
  if (input.deliveryMethod === 'physical') {
    return Boolean(input.form.line1.trim() && input.form.city.trim() && input.form.postalCode.trim());
  }
  return true;
}

export function resolveGiftCardClaimSuccessCopyKey(cardType: string): keyof ConsumerCopy {
  if (cardType === 'package') return 'giftCardClaimPackageSuccess';
  if (cardType === 'subscription') return 'giftCardClaimSubscriptionSuccess';
  if (cardType === 'service') return 'giftCardClaimServiceSuccess';
  if (cardType === 'bundle') return 'giftCardClaimBundleSuccess';
  return 'giftCardClaimSuccess';
}
