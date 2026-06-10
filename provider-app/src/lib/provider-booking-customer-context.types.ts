/** prov-exp-1.1 — customer snapshot from GET .../bookings/:id/customer-context */

export interface ProviderBookingCustomerReferralSource {
  referredByCustomerId: string;
  referredByCustomerName: string;
  referralCodeUsed: string | null;
}

export interface ProviderBookingCompletedVisit {
  bookingId: string;
  serviceName: string;
  providerName: string;
  completedAt: string;
}

export interface ProviderCustomerSnapshotBadge {
  id: 'first_visit' | 'referred_by' | 'win_back';
  tone: 'primary' | 'secondary' | 'tertiary' | 'success';
  referredByCustomerName?: string;
}

export interface ProviderLoyaltyActivity {
  points: number;
  occurredAt: string;
  note: string | null;
}

export interface ProviderBookingCustomerLoyaltyQuickView {
  pointsBalance: number;
  pointsValue: number;
  lifetimeEarned: number;
  lastEarn: ProviderLoyaltyActivity | null;
  lastRedeem: ProviderLoyaltyActivity | null;
  staffCanAdjust: false;
}

export interface ProviderBookingCustomerContext {
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
  recentCompletedVisits: ProviderBookingCompletedVisit[];
}
