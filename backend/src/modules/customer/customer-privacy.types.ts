export interface CustomerGdprConsent {
  privacyAcceptedAt?: string;
  privacyVersion?: string;
  marketingOptIn?: boolean;
  marketingOptInAt?: string;
  source?: 'checkout' | 'account' | 'admin';
}

export interface CustomerPrivacyExport {
  exportedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    tags: string[] | null;
    isVip: boolean;
    createdAt: string;
    updatedAt: string;
  };
  gdpr: CustomerGdprConsent | null;
  notifications: Record<string, boolean> | null;
  bookings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus: string;
    serviceName: string | null;
    employeeName: string | null;
  }>;
}

export function getCustomerGdpr(metadata?: Record<string, unknown>): CustomerGdprConsent {
  return (metadata?.gdpr as CustomerGdprConsent) || {};
}

export function buildGdprMetadata(
  existing: Record<string, unknown> | undefined,
  consent: {
    privacyAccepted?: boolean;
    privacyVersion?: string;
    marketingOptIn?: boolean;
    source?: CustomerGdprConsent['source'];
  },
): Record<string, unknown> {
  const gdpr = getCustomerGdpr(existing);
  const now = new Date().toISOString();

  if (consent.privacyAccepted) {
    gdpr.privacyAcceptedAt = now;
    gdpr.privacyVersion = consent.privacyVersion || '1.0';
    gdpr.source = consent.source || gdpr.source;
  }
  if (consent.marketingOptIn !== undefined) {
    gdpr.marketingOptIn = consent.marketingOptIn;
    gdpr.marketingOptInAt = now;
    gdpr.source = consent.source || gdpr.source;
  }

  return { ...(existing || {}), gdpr };
}
