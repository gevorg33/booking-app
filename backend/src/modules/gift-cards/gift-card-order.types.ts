import type { GiftCardShippingAddress } from './gift-card.types.js';
import type {
  GiftCardChangeRequestStatus,
  GiftCardChangeRequestType,
} from './entities/gift-card-change-request.entity.js';

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

/** Gift cards the customer claimed (package/subscription) or received and activated. */
export interface GiftCardCustomerRedeemedView {
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

export interface GiftCardCustomerAccountView {
  orders: GiftCardCustomerOrderView[];
  redeemed: GiftCardCustomerRedeemedView[];
}

export interface SubmitGiftCardModifyInput {
  modifyPayload: GiftCardModifyPayload;
  customerNotes?: string;
}

export type GiftCardChangeRequestResolution = 'approve' | 'deny' | 'needs_info';

export type GiftCardRefundStatus =
  | 'refunded'
  | 'failed'
  | 'skipped'
  | 'already_refunded';

export interface GiftCardChangeRequestListItem {
  id: string;
  requestType: GiftCardChangeRequestType;
  status: GiftCardChangeRequestStatus;
  /** Human-friendly status for dashboard (e.g. cancel + completed → cancelled) */
  displayStatus: string;
  giftCardId: string;
  giftCardCode: string;
  giftCardStatus: string | null;
  customerNotes: string | null;
  specialistNotes: string | null;
  refundStatus: GiftCardRefundStatus | null;
  createdAt: string;
  resolvedAt: string | null;
}
