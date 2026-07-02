/** prov-exp-9.1 — referral / first-visit / win-back badges on provider customer snapshot. */

import type { ProviderBookingCustomerReferralSource } from './provider-booking-customer-context.util.js';

export type ProviderCustomerSnapshotBadgeId =
  | 'first_visit'
  | 'referred_by'
  | 'win_back';

export type ProviderCustomerSnapshotBadgeTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success';

export interface ProviderCustomerSnapshotBadge {
  id: ProviderCustomerSnapshotBadgeId;
  tone: ProviderCustomerSnapshotBadgeTone;
  referredByCustomerName?: string;
}

export interface ResolveProviderCustomerSnapshotBadgesInput {
  completedVisitCount: number;
  lastCompletedVisitAt: Date | null;
  referral: ProviderBookingCustomerReferralSource | null;
  /** From business marketingAutomation.inactiveDaysThreshold. */
  inactiveDaysThreshold: number;
  referenceDate?: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSinceDate(
  from: Date,
  referenceDate: Date = new Date(),
): number {
  const diffMs = referenceDate.getTime() - from.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / MS_PER_DAY);
}

export function isFirstVisitCustomer(completedVisitCount: number): boolean {
  return completedVisitCount === 0;
}

export function isWinBackCustomer(
  input: Pick<
    ResolveProviderCustomerSnapshotBadgesInput,
    | 'completedVisitCount'
    | 'lastCompletedVisitAt'
    | 'inactiveDaysThreshold'
    | 'referenceDate'
  >,
): boolean {
  if (input.completedVisitCount <= 0 || !input.lastCompletedVisitAt) {
    return false;
  }
  const referenceDate = input.referenceDate ?? new Date();
  return (
    daysSinceDate(input.lastCompletedVisitAt, referenceDate) >=
    input.inactiveDaysThreshold
  );
}

export function resolveProviderCustomerSnapshotBadges(
  input: ResolveProviderCustomerSnapshotBadgesInput,
): ProviderCustomerSnapshotBadge[] {
  const badges: ProviderCustomerSnapshotBadge[] = [];

  if (isFirstVisitCustomer(input.completedVisitCount)) {
    badges.push({ id: 'first_visit', tone: 'success' });
  } else if (isWinBackCustomer(input)) {
    badges.push({ id: 'win_back', tone: 'tertiary' });
  }

  if (input.referral) {
    badges.push({
      id: 'referred_by',
      tone: 'secondary',
      referredByCustomerName: input.referral.referredByCustomerName,
    });
  }

  return badges;
}

export function formatProviderCustomerSnapshotBadgeLabel(
  badge: ProviderCustomerSnapshotBadge,
): string {
  switch (badge.id) {
    case 'first_visit':
      return 'First visit';
    case 'win_back':
      return 'Win-back';
    case 'referred_by':
      return `Referred by ${badge.referredByCustomerName ?? 'another client'}`;
    default:
      return '';
  }
}

export function formatProviderCustomerSnapshotBadgesText(
  badges: ProviderCustomerSnapshotBadge[],
): string | null {
  if (!badges.length) return null;
  return badges.map(formatProviderCustomerSnapshotBadgeLabel).join(', ');
}
