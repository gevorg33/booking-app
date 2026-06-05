import type { GiftCardBusinessSettings } from './gift-card.types.js';
import type { GiftCardOrderPolicyView } from './gift-card-order.types.js';

export interface GiftCardPolicyInput {
  createdAt?: Date | string;
  deliveryMethod?: string | null;
  fulfillmentStatus?: string | null;
  cardType?: string;
  balance?: number;
  initialBalance?: number;
  isActive?: boolean;
  claimedAt?: Date | string | null;
  serviceCredits?: Array<{ quantityRemaining: number; quantityTotal?: number }>;
}

const OPEN_REQUEST_STATUSES = new Set(['pending', 'in_review', 'needs_info']);

const PHYSICAL_BLOCKED_STATUSES = new Set([
  'ready_for_delivery',
  'out_for_delivery',
  'shipped',
  'delivered',
]);

export function isGiftCardFullyRedeemed(card: GiftCardPolicyInput): boolean {
  if (card.cardType === 'package' || card.cardType === 'subscription') {
    return Boolean(card.claimedAt);
  }
  if (card.cardType === 'monetary') {
    return Number(card.balance ?? 0) <= 0;
  }
  const credits = card.serviceCredits ?? [];
  if (credits.length) {
    return credits.every((c) => Number(c.quantityRemaining) <= 0);
  }
  if (card.isActive === false) return true;
  return false;
}

/** True when any monetary balance or service credit has been consumed. */
export function hasGiftCardValueBeenUsed(card: GiftCardPolicyInput): boolean {
  if (card.fulfillmentStatus === 'cancelled') return false;

  if (card.cardType === 'package' || card.cardType === 'subscription') {
    return Boolean(card.claimedAt);
  }

  if (card.cardType === 'monetary') {
    const initial = Number(card.initialBalance ?? card.balance ?? 0);
    const balance = Number(card.balance ?? 0);
    return initial > 0 && balance < initial;
  }

  const credits = card.serviceCredits ?? [];
  return credits.some((credit) => {
    const total = Number(credit.quantityTotal ?? credit.quantityRemaining ?? 0);
    const remaining = Number(credit.quantityRemaining ?? 0);
    return total > 0 && remaining < total;
  });
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
  const windowMs =
    Math.max(0, Number(settings.cancelModifyWindowHours ?? 0)) * 60 * 60 * 1000;
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
      blockReason: 'Cancel requests are disabled for this business',
    };
  }

  if (card.fulfillmentStatus === 'cancelled') {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'This gift card order was cancelled',
    );
  }

  if (pendingRequest && OPEN_REQUEST_STATUSES.has(pendingRequest.status)) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'A cancel request is already in progress',
    );
  }

  if (isGiftCardFullyRedeemed(card)) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'This gift card has been fully redeemed',
    );
  }

  if (hasGiftCardValueBeenUsed(card)) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'This gift card cannot be cancelled because part of it has already been used',
    );
  }

  if (windowMs > 0 && windowRemainingMs <= 0) {
    return blocked(
      windowExpiresAt,
      windowRemainingMs,
      'The cancel window has expired',
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
      'Physical gift card orders cannot be cancelled after card creation',
    );
  }

  return {
    canCancel: true,
    canModify: false,
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
