import type { GiftCardShippingAddress } from './gift-card.types.js';
import type { GiftCardChangeRequestStatus, GiftCardChangeRequestType } from './entities/gift-card-change-request.entity.js';

export interface GiftCardModifyPayload {
  amount?: number;
  serviceId?: string;
  bundleId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  personalMessage?: string;
  shippingAddress?: GiftCardShippingAddress;
  shippingMethodId?: string;
  expiresAt?: string | null;
}

export interface GiftCardOrderPolicyView {
  canCancel: boolean;
  canModify: boolean;
  cancelModifyEnabled: boolean;
  windowExpiresAt: string | null;
  windowRemainingMs: number;
  blockReason: string | null;
}

export interface GiftCardCustomerOrderView {
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
  policy: GiftCardOrderPolicyView;
  changeRequest: {
    id: string;
    requestType: GiftCardChangeRequestType;
    status: GiftCardChangeRequestStatus;
    createdAt: string;
  } | null;
}

export interface SubmitGiftCardModifyInput {
  modifyPayload: GiftCardModifyPayload;
  customerNotes?: string;
}

export type GiftCardChangeRequestResolution =
  | 'approve'
  | 'deny'
  | 'needs_info';
