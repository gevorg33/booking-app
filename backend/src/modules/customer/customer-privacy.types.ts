export interface CustomerConsentLogEntry {
  type:
    | 'privacy'
    | 'marketing'
    | 'ai_processing'
    | 'third_party_integrations'
    | 'cookies';
  accepted: boolean;
  at: string;
  ip?: string;
  version?: string;
}

export interface CustomerGdprConsent {
  privacyAcceptedAt?: string;
  privacyVersion?: string;
  marketingOptIn?: boolean;
  marketingOptInAt?: string;
  aiProcessingOptIn?: boolean;
  aiProcessingOptInAt?: string;
  thirdPartyIntegrationsOptIn?: boolean;
  thirdPartyIntegrationsOptInAt?: string;
  cookiesAcceptedAt?: string;
  source?: 'checkout' | 'account' | 'admin';
  consentLog?: CustomerConsentLogEntry[];
  deletedAt?: string;
  deletionRequested?: boolean;
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

export function getCustomerGdpr(
  metadata?: Record<string, unknown>,
): CustomerGdprConsent {
  return (metadata?.gdpr as CustomerGdprConsent) || {};
}

function appendConsentLog(
  gdpr: CustomerGdprConsent,
  entry: CustomerConsentLogEntry,
): void {
  const log = [...(gdpr.consentLog ?? [])];
  log.push(entry);
  gdpr.consentLog = log.slice(-50);
}

export function buildGdprMetadata(
  existing: Record<string, unknown> | undefined,
  consent: {
    privacyAccepted?: boolean;
    privacyVersion?: string;
    marketingOptIn?: boolean;
    aiProcessingOptIn?: boolean;
    thirdPartyIntegrationsOptIn?: boolean;
    cookiesAccepted?: boolean;
    source?: CustomerGdprConsent['source'];
    ip?: string;
  },
): Record<string, unknown> {
  const gdpr = getCustomerGdpr(existing);
  const now = new Date().toISOString();
  const source = consent.source || gdpr.source;

  if (consent.privacyAccepted) {
    gdpr.privacyAcceptedAt = now;
    gdpr.privacyVersion = consent.privacyVersion || '1.0';
    gdpr.source = source;
    appendConsentLog(gdpr, {
      type: 'privacy',
      accepted: true,
      at: now,
      ip: consent.ip,
      version: gdpr.privacyVersion,
    });
  }
  if (consent.marketingOptIn !== undefined) {
    gdpr.marketingOptIn = consent.marketingOptIn;
    gdpr.marketingOptInAt = now;
    gdpr.source = source;
    appendConsentLog(gdpr, {
      type: 'marketing',
      accepted: consent.marketingOptIn,
      at: now,
      ip: consent.ip,
    });
  }
  if (consent.aiProcessingOptIn !== undefined) {
    gdpr.aiProcessingOptIn = consent.aiProcessingOptIn;
    gdpr.aiProcessingOptInAt = now;
    gdpr.source = source;
    appendConsentLog(gdpr, {
      type: 'ai_processing',
      accepted: consent.aiProcessingOptIn,
      at: now,
      ip: consent.ip,
    });
  }
  if (consent.thirdPartyIntegrationsOptIn !== undefined) {
    gdpr.thirdPartyIntegrationsOptIn = consent.thirdPartyIntegrationsOptIn;
    gdpr.thirdPartyIntegrationsOptInAt = now;
    gdpr.source = source;
    appendConsentLog(gdpr, {
      type: 'third_party_integrations',
      accepted: consent.thirdPartyIntegrationsOptIn,
      at: now,
      ip: consent.ip,
    });
  }
  if (consent.cookiesAccepted) {
    gdpr.cookiesAcceptedAt = now;
    gdpr.source = source;
    appendConsentLog(gdpr, {
      type: 'cookies',
      accepted: true,
      at: now,
      ip: consent.ip,
    });
  }

  return { ...(existing || {}), gdpr };
}
