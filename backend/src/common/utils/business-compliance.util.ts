import { createHash } from 'node:crypto';
import { resolveVerticalPlaybookId } from '../../modules/onboarding/vertical-playbooks.constants.js';

export const DATA_RESIDENCY_REGIONS = ['eu', 'us', 'other'] as const;
export type DataResidencyRegion = (typeof DATA_RESIDENCY_REGIONS)[number];

export const RETENTION_FIELDS = [
  'bookingHistoryDays',
  'customerPiiDays',
  'aiCommandLogsDays',
  'auditLogsDays',
] as const;
export type RetentionField = (typeof RETENTION_FIELDS)[number];

export const RETENTION_LIMITS: Record<
  RetentionField,
  { min: number; max: number }
> = {
  bookingHistoryDays: { min: 365, max: 3650 },
  customerPiiDays: { min: 30, max: 3650 },
  aiCommandLogsDays: { min: 30, max: 730 },
  auditLogsDays: { min: 365, max: 3650 },
};

export const DEFAULT_RETENTION_DAYS: Record<RetentionField, number> = {
  bookingHistoryDays: 2555,
  customerPiiDays: 1095,
  aiCommandLogsDays: 365,
  auditLogsDays: 2555,
};

export const DEFAULT_PRIVACY_POLICY_VERSION = '1.0';
export const DEFAULT_HIPAA_BAA_VERSION = '1.0';
export const DEFAULT_HIPAA_SESSION_TIMEOUT_MINUTES = 15;
export const MIN_HIPAA_SESSION_TIMEOUT_MINUTES = 5;
export const MAX_HIPAA_SESSION_TIMEOUT_MINUTES = 60;
/** HIPAA PHI access audit log minimum retention (6 years). */
export const MIN_PHI_AUDIT_RETENTION_DAYS = 2190;

export const PHI_FIELD_NAMES = [
  'referralNotes',
  'symptoms',
  'patient_test_results',
  'notes',
] as const;
export type PhiFieldName = (typeof PHI_FIELD_NAMES)[number];

export interface BusinessRetentionSettings {
  bookingHistoryDays: number;
  customerPiiDays: number;
  aiCommandLogsDays: number;
  auditLogsDays: number;
}

export interface BusinessCookieBannerSettings {
  enabled: boolean;
  message: string;
}

export interface BusinessGranularConsentSettings {
  requireAiProcessing: boolean;
  requireThirdPartyIntegrations: boolean;
}

export interface BusinessPrivacySettings {
  retention: BusinessRetentionSettings;
  cookieBanner: BusinessCookieBannerSettings;
  granularConsent: BusinessGranularConsentSettings;
  privacyPolicyVersion: string;
  dataResidencyRegion: DataResidencyRegion;
}

export interface BusinessHipaaSettings {
  enabled: boolean;
  baaAcceptedAt: string | null;
  baaAcceptedByUserId: string | null;
  baaVersion: string | null;
  sessionTimeoutMinutes: number;
  /** Per-business PHI encryption key id (KMS / secrets manager reference). */
  phiEncryptionKeyId?: string | null;
  /** Platform-wrapped per-business AES key (encrypted at rest). */
  phiEncryptionKeyEnc?: string | null;
}

export interface PublicBusinessPrivacySettings {
  cookieBannerEnabled: boolean;
  cookieBannerMessage?: string;
  privacyPolicyVersion: string;
  requireAiProcessingConsent: boolean;
  requireThirdPartyIntegrationsConsent: boolean;
  dataResidencyRegion: DataResidencyRegion;
}

export const DEFAULT_BUSINESS_PRIVACY_SETTINGS: BusinessPrivacySettings = {
  retention: { ...DEFAULT_RETENTION_DAYS },
  cookieBanner: { enabled: false, message: '' },
  granularConsent: {
    requireAiProcessing: false,
    requireThirdPartyIntegrations: false,
  },
  privacyPolicyVersion: DEFAULT_PRIVACY_POLICY_VERSION,
  dataResidencyRegion: 'other',
};

export const DEFAULT_BUSINESS_HIPAA_SETTINGS: BusinessHipaaSettings = {
  enabled: false,
  baaAcceptedAt: null,
  baaAcceptedByUserId: null,
  baaVersion: null,
  sessionTimeoutMinutes: DEFAULT_HIPAA_SESSION_TIMEOUT_MINUTES,
  phiEncryptionKeyId: null,
  phiEncryptionKeyEnc: null,
};

export interface SubProcessorEntry {
  name: string;
  purpose: string;
  dataTypes: string[];
  region: string;
}

export const SUB_PROCESSORS: SubProcessorEntry[] = [
  {
    name: 'Amazon Web Services (AWS)',
    purpose: 'Cloud hosting, database, object storage',
    dataTypes: ['Customer PII', 'Bookings', 'Business settings'],
    region: 'EU / US (deployment-dependent)',
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing',
    dataTypes: ['Payment metadata', 'Customer email'],
    region: 'Global',
  },
  {
    name: 'OpenAI / Anthropic / Google (LLM providers)',
    purpose: 'AI assistant (when enabled)',
    dataTypes: ['Prompt text (PII-redacted when HIPAA mode on)'],
    region: 'US',
  },
  {
    name: 'Twilio',
    purpose: 'SMS / WhatsApp notifications',
    dataTypes: ['Phone numbers', 'Appointment reminders'],
    region: 'Global',
  },
  {
    name: 'Resend / SendGrid',
    purpose: 'Transactional email',
    dataTypes: ['Email addresses', 'Booking confirmations'],
    region: 'US / EU',
  },
  {
    name: 'Firebase (Google)',
    purpose: 'Push notifications (provider app)',
    dataTypes: ['Device tokens', 'Staff user IDs'],
    region: 'Global',
  },
];

const REGION_SET = new Set<string>(DATA_RESIDENCY_REGIONS);

export function normalizeDataResidencyRegion(
  value: string | null | undefined,
): DataResidencyRegion | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return REGION_SET.has(trimmed) ? (trimmed as DataResidencyRegion) : null;
}

export function normalizeRetentionDays(
  value: unknown,
  field: RetentionField,
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  const { min, max } = RETENTION_LIMITS[field];
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export function readBusinessRetentionSettings(
  raw?: Record<string, unknown>,
): BusinessRetentionSettings {
  const source =
    (raw?.retention as Record<string, unknown> | undefined) ?? raw ?? {};
  return {
    bookingHistoryDays:
      normalizeRetentionDays(source.bookingHistoryDays, 'bookingHistoryDays') ??
      DEFAULT_RETENTION_DAYS.bookingHistoryDays,
    customerPiiDays:
      normalizeRetentionDays(source.customerPiiDays, 'customerPiiDays') ??
      DEFAULT_RETENTION_DAYS.customerPiiDays,
    aiCommandLogsDays:
      normalizeRetentionDays(source.aiCommandLogsDays, 'aiCommandLogsDays') ??
      DEFAULT_RETENTION_DAYS.aiCommandLogsDays,
    auditLogsDays:
      normalizeRetentionDays(source.auditLogsDays, 'auditLogsDays') ??
      DEFAULT_RETENTION_DAYS.auditLogsDays,
  };
}

export function readBusinessPrivacySettings(
  settings?: Record<string, unknown>,
): BusinessPrivacySettings {
  const raw = (settings?.privacy as Record<string, unknown> | undefined) ?? {};
  const retention = readBusinessRetentionSettings(raw);
  const cookieRaw =
    (raw.cookieBanner as Record<string, unknown> | undefined) ?? {};
  const granularRaw =
    (raw.granularConsent as Record<string, unknown> | undefined) ?? {};
  const version =
    typeof raw.privacyPolicyVersion === 'string' &&
    raw.privacyPolicyVersion.trim()
      ? raw.privacyPolicyVersion.trim().slice(0, 16)
      : DEFAULT_PRIVACY_POLICY_VERSION;
  const region =
    normalizeDataResidencyRegion(raw.dataResidencyRegion as string) ?? 'other';
  return {
    retention,
    cookieBanner: {
      enabled: cookieRaw.enabled === true,
      message:
        typeof cookieRaw.message === 'string' ? cookieRaw.message.trim() : '',
    },
    granularConsent: {
      requireAiProcessing: granularRaw.requireAiProcessing === true,
      requireThirdPartyIntegrations:
        granularRaw.requireThirdPartyIntegrations === true,
    },
    privacyPolicyVersion: version,
    dataResidencyRegion: region,
  };
}

export function readBusinessHipaaSettings(
  settings?: Record<string, unknown>,
): BusinessHipaaSettings {
  const raw = (settings?.hipaa as Record<string, unknown> | undefined) ?? {};
  const timeout = Number(raw.sessionTimeoutMinutes);
  const sessionTimeoutMinutes =
    Number.isFinite(timeout) &&
    timeout >= MIN_HIPAA_SESSION_TIMEOUT_MINUTES &&
    timeout <= MAX_HIPAA_SESSION_TIMEOUT_MINUTES
      ? Math.round(timeout)
      : DEFAULT_HIPAA_SESSION_TIMEOUT_MINUTES;
  return {
    enabled: raw.enabled === true,
    baaAcceptedAt:
      typeof raw.baaAcceptedAt === 'string' ? raw.baaAcceptedAt : null,
    baaAcceptedByUserId:
      typeof raw.baaAcceptedByUserId === 'string'
        ? raw.baaAcceptedByUserId
        : null,
    baaVersion:
      typeof raw.baaVersion === 'string' ? raw.baaVersion.slice(0, 16) : null,
    sessionTimeoutMinutes,
    phiEncryptionKeyId:
      typeof raw.phiEncryptionKeyId === 'string'
        ? raw.phiEncryptionKeyId
        : null,
    phiEncryptionKeyEnc:
      typeof raw.phiEncryptionKeyEnc === 'string'
        ? raw.phiEncryptionKeyEnc
        : null,
  };
}

export function assertBusinessPrivacySettings(
  input: Partial<BusinessPrivacySettings>,
  existing?: Record<string, unknown>,
): BusinessPrivacySettings {
  const current = readBusinessPrivacySettings(existing);
  const retentionInput = input.retention ?? current.retention;
  const retention: BusinessRetentionSettings = {
    bookingHistoryDays:
      normalizeRetentionDays(
        retentionInput.bookingHistoryDays,
        'bookingHistoryDays',
      ) ?? current.retention.bookingHistoryDays,
    customerPiiDays:
      normalizeRetentionDays(
        retentionInput.customerPiiDays,
        'customerPiiDays',
      ) ?? current.retention.customerPiiDays,
    aiCommandLogsDays:
      normalizeRetentionDays(
        retentionInput.aiCommandLogsDays,
        'aiCommandLogsDays',
      ) ?? current.retention.aiCommandLogsDays,
    auditLogsDays:
      normalizeRetentionDays(retentionInput.auditLogsDays, 'auditLogsDays') ??
      current.retention.auditLogsDays,
  };
  const cookieInput = input.cookieBanner ?? current.cookieBanner;
  const granularInput = input.granularConsent ?? current.granularConsent;
  const version =
    typeof input.privacyPolicyVersion === 'string' &&
    input.privacyPolicyVersion.trim()
      ? input.privacyPolicyVersion.trim().slice(0, 16)
      : current.privacyPolicyVersion;
  const region =
    normalizeDataResidencyRegion(input.dataResidencyRegion) ??
    current.dataResidencyRegion;
  return {
    retention,
    cookieBanner: {
      enabled: cookieInput.enabled === true,
      message:
        typeof cookieInput.message === 'string'
          ? cookieInput.message.trim().slice(0, 500)
          : '',
    },
    granularConsent: {
      requireAiProcessing: granularInput.requireAiProcessing === true,
      requireThirdPartyIntegrations:
        granularInput.requireThirdPartyIntegrations === true,
    },
    privacyPolicyVersion: version,
    dataResidencyRegion: region,
  };
}

export function assertBusinessHipaaSettings(
  input: Partial<BusinessHipaaSettings>,
  businessType?: string | null,
  existing?: Record<string, unknown>,
): BusinessHipaaSettings {
  const current = readBusinessHipaaSettings(existing);
  const enabled = input.enabled === true;
  if (enabled && !isHipaaEligibleBusinessType(businessType)) {
    throw new Error(
      'HIPAA mode is only available for clinic, polyclinic, beauty clinic, and dental businesses',
    );
  }
  if (enabled && !input.baaAcceptedAt && !current.baaAcceptedAt) {
    throw new Error(
      'Business Associate Agreement must be accepted before enabling HIPAA mode',
    );
  }
  const timeout = Number(
    input.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
  );
  if (
    !Number.isFinite(timeout) ||
    timeout < MIN_HIPAA_SESSION_TIMEOUT_MINUTES ||
    timeout > MAX_HIPAA_SESSION_TIMEOUT_MINUTES
  ) {
    throw new Error(
      `HIPAA session timeout must be between ${MIN_HIPAA_SESSION_TIMEOUT_MINUTES} and ${MAX_HIPAA_SESSION_TIMEOUT_MINUTES} minutes`,
    );
  }
  return {
    enabled,
    baaAcceptedAt:
      typeof input.baaAcceptedAt === 'string'
        ? input.baaAcceptedAt
        : current.baaAcceptedAt,
    baaAcceptedByUserId:
      typeof input.baaAcceptedByUserId === 'string'
        ? input.baaAcceptedByUserId
        : current.baaAcceptedByUserId,
    baaVersion:
      typeof input.baaVersion === 'string'
        ? input.baaVersion.slice(0, 16)
        : current.baaVersion,
    sessionTimeoutMinutes: Math.round(timeout),
  };
}

export function toPublicBusinessPrivacySettings(
  privacy: BusinessPrivacySettings,
): PublicBusinessPrivacySettings {
  return {
    cookieBannerEnabled: privacy.cookieBanner.enabled,
    ...(privacy.cookieBanner.message
      ? { cookieBannerMessage: privacy.cookieBanner.message }
      : {}),
    privacyPolicyVersion: privacy.privacyPolicyVersion,
    requireAiProcessingConsent: privacy.granularConsent.requireAiProcessing,
    requireThirdPartyIntegrationsConsent:
      privacy.granularConsent.requireThirdPartyIntegrations,
    dataResidencyRegion: privacy.dataResidencyRegion,
  };
}

export function isHipaaEligibleBusinessType(
  businessType: string | null | undefined,
): boolean {
  if (!businessType) return false;
  return resolveVerticalPlaybookId(businessType) === 'clinic';
}

export function isHipaaModeActive(
  settings: Record<string, unknown> | undefined,
  businessType?: string | null,
): boolean {
  const hipaa = readBusinessHipaaSettings(settings);
  return hipaa.enabled && isHipaaEligibleBusinessType(businessType);
}

export function getHipaaSessionTimeoutMs(
  hipaa: Pick<BusinessHipaaSettings, 'sessionTimeoutMinutes'>,
): number {
  return hipaa.sessionTimeoutMinutes * 60 * 1000;
}

export function anonymizePiiPlaceholder(
  customerId: string,
  field: 'name' | 'email' | 'phone',
): string {
  const hash = createHash('sha256')
    .update(`${customerId}:${field}`)
    .digest('hex')
    .slice(0, 12);
  if (field === 'name') return `Deleted customer (${hash})`;
  if (field === 'email') return `deleted-${hash}@anonymized.local`;
  return `+0000000${hash.slice(0, 7)}`;
}

export function mergeBusinessPrivacySettings(
  settings: Record<string, unknown>,
  privacy: BusinessPrivacySettings,
): Record<string, unknown> {
  return { ...settings, privacy };
}

export function mergeBusinessHipaaSettings(
  settings: Record<string, unknown>,
  hipaa: BusinessHipaaSettings,
): Record<string, unknown> {
  return { ...settings, hipaa };
}

export function shouldPromptPrivacyReconsent(
  consentedVersion: string | undefined,
  currentVersion: string,
): boolean {
  if (!consentedVersion?.trim()) return true;
  return consentedVersion.trim() !== currentVersion.trim();
}

export function objectContainsPhiFields(value: unknown, depth = 0): boolean {
  if (depth > 4 || value == null) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((item) => objectContainsPhiFields(item, depth + 1));
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if ((PHI_FIELD_NAMES as readonly string[]).includes(key)) return true;
    if (objectContainsPhiFields(nested, depth + 1)) return true;
  }
  return false;
}

export function buildComplianceStatusSummary(
  settings: Record<string, unknown> | undefined,
  businessType?: string | null,
): {
  gdpr: {
    retentionConfigured: boolean;
    cookieBannerEnabled: boolean;
    granularConsentEnabled: boolean;
    privacyPolicyVersion: string;
    dataResidencyRegion: DataResidencyRegion;
  };
  hipaa: {
    eligible: boolean;
    enabled: boolean;
    baaSigned: boolean;
    sessionTimeoutMinutes: number;
    sessionTimeoutEnforced: boolean;
    phiEncryptionConfigured: boolean;
    minimumAccessEnforced: boolean;
    aiPhiGuardEnabled: boolean;
  };
} {
  const privacy = readBusinessPrivacySettings(settings);
  const hipaa = readBusinessHipaaSettings(settings);
  const eligible = isHipaaEligibleBusinessType(businessType);
  const hipaaEnabled = hipaa.enabled && eligible;
  return {
    gdpr: {
      retentionConfigured: true,
      cookieBannerEnabled: privacy.cookieBanner.enabled,
      granularConsentEnabled:
        privacy.granularConsent.requireAiProcessing ||
        privacy.granularConsent.requireThirdPartyIntegrations,
      privacyPolicyVersion: privacy.privacyPolicyVersion,
      dataResidencyRegion: privacy.dataResidencyRegion,
    },
    hipaa: {
      eligible,
      enabled: hipaaEnabled,
      baaSigned: Boolean(hipaa.baaAcceptedAt),
      sessionTimeoutMinutes: hipaa.sessionTimeoutMinutes,
      sessionTimeoutEnforced: hipaaEnabled,
      phiEncryptionConfigured:
        hipaaEnabled &&
        Boolean(hipaa.phiEncryptionKeyId && hipaa.phiEncryptionKeyEnc),
      minimumAccessEnforced: hipaaEnabled,
      aiPhiGuardEnabled: hipaaEnabled,
    },
  };
}
