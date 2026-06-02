import type { GiftCardBusinessSettings } from './gift-card.types.js';
import type { GiftCardOrderPolicyView } from './gift-card-order.types.js';

export interface GiftCardPolicyInput {
  createdAt?: Date | string;
  deliveryMethod?: string | null;
  fulfillmentStatus?: string | null;
  cardType?: string;
  balance?: number;
  isActive?: boolean;
  serviceCredits?: Array<{ quantityRemaining: number }>;
}

const OPEN_REQUEST_STATUSES = new Set(['pending', 'in_review', 'needs_info']);

const PHYSICAL_BLOCKED_STATUSES = new Set([
  'ready_for_delivery',
  'out_for_delivery',
  'shipped',
  'delivered',
]);

export function isGiftCardFullyRedeemed(card: GiftCardPolicyInput): boolean {
  if (card.isActive === false) return true;
  if (card.cardType === 'monetary') {
    return Number(card.balance ?? 0) <= 0;
  }
  const credits = card.serviceCredits ?? [];
  if (!credits.length) return false;
  return credits.every((c) => Number(c.quantityRemaining) <= 0);
}

export function evaluateGiftCardOrderPolicy(
  card: GiftCardPolicyInput,
  settings: GiftCardBusinessSettings,
  pendingRequest?: { status: string } | null,
  now: Date = new Date(),
): GiftCardOrderPolicyView {
  const createdAt =
    card.createdAt instanceof Date
      ? card.createdAt
      : card.createdAt
        ? new Date(card.createdAt)
        : now;
  const windowMs = Math.max(0, Number(settings.cancelModifyWindowHours ?? 0)) * 60 * 60 * 1000;
  const windowExpiresAt =
    windowMs > 0 ? new Date(createdAt.getTime() + windowMs) : null;
  const windowRemainingMs = windowExpiresAt
    ? Math.max(0, windowExpiresAt.getTime() - now.getTime())
    : 0;

  if (!settings.cancelModifyEnabled) {
    return {
      canCancel: false,
      canModify: false,
      cancelModifyEnabled: false,
      windowExpiresAt: windowExpiresAt?.toISOString() ?? null,
      windowRemainingMs,
      blockReason: 'Cancel and modify requests are disabled for this business',
    };
  }

  if (card.fulfillmentStatus === 'cancelled') {
    return blocked(windowExpiresAt, windowRemainingMs, 'This gift card order was cancelled');
  }

  if (pendingRequest && OPEN_REQUEST_STATUSES.has(pendingRequest.status)) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'A cancel or modify request is already in progress',
    );
  }

  if (isGiftCardFullyRedeemed(card)) {
    return blocked(windowExpiresAt, windowRemainingMs, 'This gift card has been fully redeemed');
  }

  if (windowMs > 0 && windowRemainingMs <= 0) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'The cancel/modify window has expired',
    );
  }

  if (
    settings.physicalCancelBeforeReady &&
    card.deliveryMethod === 'physical' &&
    card.fulfillmentStatus &&
    PHYSICAL_BLOCKED_STATUSES.has(card.fulfillmentStatus)
  ) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'Physical gift card orders cannot be changed after card creation',
    );
  }

  return {
    canCancel: true,
    canModify: true,
    cancelModifyEnabled: true,
    windowExpiresAt: windowExpiresAt?.toISOString() ?? null,
    windowRemainingMs,
    blockReason: null,
  };
}

function blocked(
  windowExpiresAt: Date | null,
  windowRemainingMs: number,
  blockReason: string,
): GiftCardOrderPolicyView {
  return {
    canCancel: false,
    canModify: false,
    cancelModifyEnabled: true,
    windowExpiresAt: windowExpiresAt?.toISOString() ?? null,
    windowRemainingMs,
    blockReason,
  };
}
