/** prov-exp-9.2 — read-only loyalty quick view on provider customer snapshot. */

import { formatDateDisplay } from '../../common/utils/date-format.util.js';

export interface ProviderLoyaltyActivityView {
  points: number;
  occurredAt: string;
  note: string | null;
}

export interface ProviderBookingCustomerLoyaltyQuickView {
  pointsBalance: number;
  pointsValue: number;
  lifetimeEarned: number;
  lastEarn: ProviderLoyaltyActivityView | null;
  lastRedeem: ProviderLoyaltyActivityView | null;
  /** prov-exp-9.2 — staff cannot adjust points on provider mobile v1. */
  staffCanAdjust: false;
}

export interface LoyaltyTransactionSnapshot {
  points: number;
  createdAt: Date;
  note?: string | null;
}

export interface BuildProviderBookingCustomerLoyaltyQuickViewInput {
  pointsBalance: number;
  pointsValue: number;
  lifetimeEarned: number;
  lastEarn: LoyaltyTransactionSnapshot | null;
  lastRedeem: LoyaltyTransactionSnapshot | null;
}

export const PROVIDER_LOYALTY_QUICK_VIEW_STAFF_CAN_ADJUST = false as const;

export function normalizeLoyaltyActivityPoints(
  rawPoints: number,
  type: 'earn' | 'redeem',
): number | null {
  if (!Number.isFinite(rawPoints) || rawPoints === 0) return null;
  const points = type === 'redeem' ? Math.abs(rawPoints) : rawPoints;
  return points > 0 ? points : null;
}

export function mapLoyaltyTransactionToActivity(
  tx: LoyaltyTransactionSnapshot | null,
  type: 'earn' | 'redeem',
): ProviderLoyaltyActivityView | null {
  if (!tx) return null;
  const points = normalizeLoyaltyActivityPoints(Number(tx.points), type);
  if (points == null) return null;
  const note =
    typeof tx.note === 'string' && tx.note.trim() ? tx.note.trim() : null;
  return {
    points,
    occurredAt: tx.createdAt.toISOString(),
    note,
  };
}

export function buildProviderBookingCustomerLoyaltyQuickView(
  input: BuildProviderBookingCustomerLoyaltyQuickViewInput,
): ProviderBookingCustomerLoyaltyQuickView {
  return {
    pointsBalance: input.pointsBalance,
    pointsValue: input.pointsValue,
    lifetimeEarned: input.lifetimeEarned,
    lastEarn: mapLoyaltyTransactionToActivity(input.lastEarn, 'earn'),
    lastRedeem: mapLoyaltyTransactionToActivity(input.lastRedeem, 'redeem'),
    staffCanAdjust: PROVIDER_LOYALTY_QUICK_VIEW_STAFF_CAN_ADJUST,
  };
}

export function formatProviderLoyaltyQuickViewSummary(
  loyalty: ProviderBookingCustomerLoyaltyQuickView,
): string {
  const parts = [
    `${loyalty.pointsBalance} loyalty pts (${loyalty.pointsValue} value, ${loyalty.lifetimeEarned} lifetime)`,
  ];
  if (loyalty.lastEarn) {
    parts.push(
      `last earn +${loyalty.lastEarn.points} on ${formatDateDisplay(loyalty.lastEarn.occurredAt)}`,
    );
  }
  if (loyalty.lastRedeem) {
    parts.push(
      `last redeem ${loyalty.lastRedeem.points} on ${formatDateDisplay(loyalty.lastRedeem.occurredAt)}`,
    );
  }
  return parts.join(' · ');
}
