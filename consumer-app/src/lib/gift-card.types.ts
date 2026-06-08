export type PublicGiftCardType = 'monetary' | 'service' | 'bundle' | 'package' | 'subscription';
export type PublicGiftCardDeliveryMethod = 'digital' | 'physical';

export interface PublicGiftCardCatalogSettings {
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
  presetAmounts: number[];
  purchasableServices: Array<{ serviceId: string; price?: number | null }>;
  purchasablePackages: Array<{
    packageId: string;
    price?: number | null;
    name: string;
    packagePrice: number;
    regularTotal?: number;
    savingsPercent?: number;
    itemSummary: string;
    currency: string;
  }>;
  purchasableSubscriptionPlans: Array<{
    planId: string;
    price?: number | null;
    name: string;
    serviceName: string;
    includedAppointments: number;
    durationMonths: number;
    subscriptionPrice: number;
    regularTotal: number;
    savings: number;
    savingsPercent: number;
    currency: string;
  }>;
  bundles: Array<{
    id: string;
    name: string;
    lines: Array<{ serviceId: string; serviceName: string; quantity: number }>;
    price: number;
  }>;
  shippingMethods: Array<{ id: string; label: string; fee: number; estimatedDays: string }>;
  cancelModifyEnabled: boolean;
  cancelModifyWindowHours: number;
  acceptCashPayments?: boolean;
}

export interface PublicGiftCardCatalog {
  purchaseEnabled: boolean;
  settings: PublicGiftCardCatalogSettings | null;
}

export interface PublicGiftCardPurchaseQuote {
  cardType: PublicGiftCardType;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  label: string;
}

export interface PublicGiftCardShippingAddress {
  recipientName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  stateRegion?: string;
  postalCode: string;
  country: string;
  instructions?: string;
}

export interface PurchasePublicGiftCardBody {
  cardType: PublicGiftCardType;
  amount?: number;
  serviceId?: string;
  serviceIds?: string[];
  bundleId?: string;
  packageId?: string;
  subscriptionPlanId?: string;
  deliveryMethod: PublicGiftCardDeliveryMethod;
  buyForSelf?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  purchaserEmail: string;
  purchaserName?: string;
  personalMessage?: string;
  shippingAddress?: PublicGiftCardShippingAddress;
  shippingMethodId?: string;
  paymentMethod?: 'online' | 'cash';
}

export interface PublicGiftCardOrderPolicy {
  canCancel: boolean;
  canModify: boolean;
  cancelModifyEnabled: boolean;
  windowExpiresAt: string | null;
  windowRemainingMs: number;
  blockReason: string | null;
}

export interface PublicGiftCardOrder {
  id: string;
  code: string;
  cardType: string;
  balance: number;
  currency: string;
  deliveryMethod: string | null;
  fulfillmentStatus: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  expiresAt: string | null;
  isActive: boolean;
  purchaseAmount: number | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  serviceCredits: Array<{
    serviceId: string;
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
  policy: PublicGiftCardOrderPolicy;
  changeRequest: {
    id: string;
    requestType: 'cancel' | 'modify';
    status: string;
    createdAt: string;
  } | null;
}

export interface PublicGiftCardRedeemed {
  id: string;
  code: string;
  cardType: string;
  currency: string;
  claimedAt: string;
  purchaseAmount: number | null;
  packageId: string | null;
  subscriptionPlanId: string | null;
  serviceCredits: Array<{
    serviceId: string;
    serviceName: string;
    quantityRemaining: number;
    quantityTotal: number;
  }>;
}

export interface PublicCustomerGiftCardAccount {
  orders: PublicGiftCardOrder[];
  redeemed: PublicGiftCardRedeemed[];
}
