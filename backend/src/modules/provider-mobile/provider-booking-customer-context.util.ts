/** prov-exp-1.1 — customer snapshot for provider booking detail. */

import { getCustomerGdpr } from '../customer/customer-privacy.types.js';
import { REFERRAL_METADATA_CODE_USED } from '../../common/utils/referral-program.fixtures.js';
import { readReferredByCustomerId } from '../../common/utils/referral-program.util.js';
import {
  resolveProviderCustomerSnapshotBadges,
  type ProviderCustomerSnapshotBadge,
} from './provider-booking-customer-badges.util.js';
import {
  buildProviderBookingCustomerLoyaltyQuickView,
  type ProviderBookingCustomerLoyaltyQuickView,
} from './provider-booking-customer-loyalty.util.js';
import type { ProviderBookingCompletedVisitView } from './provider-booking-visit-history.util.js';

export interface ProviderBookingCustomerReferralSource {
  referredByCustomerId: string;
  referredByCustomerName: string;
  referralCodeUsed: string | null;
}

export interface ProviderBookingCustomerContextView {
  customerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPointsBalance: number;
  loyaltyPointsValue: number;
  loyaltyQuickView: ProviderBookingCustomerLoyaltyQuickView;
  completedVisitCount: number;
  lastCompletedVisitAt: string | null;
  noShowCount: number;
  marketingOptIn: boolean | null;
  referral: ProviderBookingCustomerReferralSource | null;
  badges: ProviderCustomerSnapshotBadge[];
  recentCompletedVisits: ProviderBookingCompletedVisitView[];
}

export interface BuildProviderBookingCustomerContextInput {
  customer: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown> | null;
  };
  loyalty: {
    pointsBalance: number;
    pointsValue: number;
    lifetimeEarned: number;
    lastEarn: {
      points: number;
      createdAt: Date;
      note?: string | null;
    } | null;
    lastRedeem: {
      points: number;
      createdAt: Date;
      note?: string | null;
    } | null;
  };
  completedVisitCount: number;
  lastCompletedVisitAt: Date | null;
  noShowCount: number;
  referrer?: { id: string; name: string } | null;
  recentCompletedVisits?: ProviderBookingCompletedVisitView[];
  /** prov-exp-9.1 — win-back threshold from marketing automation settings. */
  inactiveDaysThreshold?: number;
  referenceDate?: Date;
}

export function readReferralCodeUsed(
  metadata?: Record<string, unknown> | null,
): string | null {
  const raw = metadata?.[REFERRAL_METADATA_CODE_USED];
  return typeof raw === 'string' && raw.trim()
    ? raw.trim().toUpperCase()
    : null;
}

export function buildProviderBookingCustomerContextView(
  input: BuildProviderBookingCustomerContextInput,
): ProviderBookingCustomerContextView {
  const gdpr = getCustomerGdpr(input.customer.metadata ?? undefined);
  const marketingOptIn =
    gdpr.marketingOptIn === undefined ? null : Boolean(gdpr.marketingOptIn);

  const referrerId = readReferredByCustomerId(input.customer.metadata);
  const referral =
    referrerId && input.referrer
      ? {
          referredByCustomerId: input.referrer.id,
          referredByCustomerName: input.referrer.name,
          referralCodeUsed: readReferralCodeUsed(input.customer.metadata),
        }
      : null;

  const badges = resolveProviderCustomerSnapshotBadges({
    completedVisitCount: input.completedVisitCount,
    lastCompletedVisitAt: input.lastCompletedVisitAt,
    referral,
    inactiveDaysThreshold: input.inactiveDaysThreshold ?? 90,
    referenceDate: input.referenceDate,
  });

  const loyaltyQuickView = buildProviderBookingCustomerLoyaltyQuickView({
    pointsBalance: input.loyalty.pointsBalance,
    pointsValue: input.loyalty.pointsValue,
    lifetimeEarned: input.loyalty.lifetimeEarned,
    lastEarn: input.loyalty.lastEarn,
    lastRedeem: input.loyalty.lastRedeem,
  });

  return {
    customerId: input.customer.id,
    name: input.customer.name,
    phone: input.customer.phone ?? null,
    email: input.customer.email ?? null,
    loyaltyPointsBalance: loyaltyQuickView.pointsBalance,
    loyaltyPointsValue: loyaltyQuickView.pointsValue,
    loyaltyQuickView,
    completedVisitCount: input.completedVisitCount,
    lastCompletedVisitAt: input.lastCompletedVisitAt?.toISOString() ?? null,
    noShowCount: input.noShowCount,
    marketingOptIn,
    referral,
    badges,
    recentCompletedVisits: input.recentCompletedVisits ?? [],
  };
}
