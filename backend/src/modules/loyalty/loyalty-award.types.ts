export type LoyaltyAwardSkipReason =
  | 'not_paid'
  | 'already_awarded'
  | 'no_customer'
  | 'ambiguous_match'
  | 'zero_points'
  | 'no_eligible_cash_payment'
  | 'inactive_customer'
  | 'service_excluded';

export interface LoyaltyAwardResult {
  status: 'awarded' | 'skipped';
  bookingId: string;
  customerId?: string;
  points?: number;
  reason?: LoyaltyAwardSkipReason;
  matchMethod?: string;
  ambiguousCandidateIds?: string[];
}

export interface LoyaltyBackfillTenantSummary {
  businessId: string;
  businessName?: string;
  businessSlug?: string;
  earnPercentCashback: number;
  processedBookings: number;
  bonusesAwarded: number;
  totalPointsAwarded: number;
}

export interface LoyaltyBackfillSummary {
  scope: 'all_tenants' | 'single_tenant';
  tenantCount: number;
  processedBookings: number;
  matchedCustomers: number;
  bonusesAwarded: number;
  totalPointsAwarded: number;
  skipped: Record<LoyaltyAwardSkipReason, number>;
  ambiguousRecords: Array<{
    bookingId: string;
    businessId: string;
    emails: string[];
    phones: string[];
    candidateCustomerIds: string[];
    reason: string;
  }>;
  byTenant: LoyaltyBackfillTenantSummary[];
}
