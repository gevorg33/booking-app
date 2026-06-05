/** Business compliance settings (mirrors backend business-compliance.util). */

export const DATA_RESIDENCY_REGIONS = ['eu', 'us', 'other'] as const;
export type DataResidencyRegion = (typeof DATA_RESIDENCY_REGIONS)[number];

export const RETENTION_FIELDS = [
  'bookingHistoryDays',
  'customerPiiDays',
  'aiCommandLogsDays',
  'auditLogsDays',
] as const;
export type RetentionField = (typeof RETENTION_FIELDS)[number];

export const RETENTION_LIMITS: Record<RetentionField, { min: number; max: number }> = {
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
export const DEFAULT_HIPAA_SESSION_TIMEOUT_MINUTES = 15;

export interface BusinessRetentionSettings {
  bookingHistoryDays: number;
  customerPiiDays: number;
  aiCommandLogsDays: number;
  auditLogsDays: number;
}

export interface BusinessPrivacySettings {
  retention: BusinessRetentionSettings;
  cookieBanner: { enabled: boolean; message: string };
  granularConsent: {
    requireAiProcessing: boolean;
    requireThirdPartyIntegrations: boolean;
  };
  privacyPolicyVersion: string;
  dataResidencyRegion: DataResidencyRegion;
}

export interface BusinessHipaaSettings {
  enabled: boolean;
  baaAcceptedAt: string | null;
  baaAcceptedByUserId: string | null;
  baaVersion: string | null;
  sessionTimeoutMinutes: number;
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
};

export const CLINIC_BUSINESS_TYPES = [
  'clinic',
  'polyclinic',
  'beauty_clinic',
  'dental',
] as const;

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

export function readBusinessPrivacySettings(
  settings?: Record<string, unknown> | null,
): BusinessPrivacySettings {
  const raw = (settings?.privacy as Record<string, unknown> | undefined) ?? {};
  const retentionRaw = (raw.retention as Record<string, unknown> | undefined) ?? {};
  const cookieRaw = (raw.cookieBanner as Record<string, unknown> | undefined) ?? {};
  const granularRaw =
    (raw.granularConsent as Record<string, unknown> | undefined) ?? {};
  return {
    retention: {
      bookingHistoryDays:
        normalizeRetentionDays(retentionRaw.bookingHistoryDays, 'bookingHistoryDays') ??
        DEFAULT_RETENTION_DAYS.bookingHistoryDays,
      customerPiiDays:
        normalizeRetentionDays(retentionRaw.customerPiiDays, 'customerPiiDays') ??
        DEFAULT_RETENTION_DAYS.customerPiiDays,
      aiCommandLogsDays:
        normalizeRetentionDays(retentionRaw.aiCommandLogsDays, 'aiCommandLogsDays') ??
        DEFAULT_RETENTION_DAYS.aiCommandLogsDays,
      auditLogsDays:
        normalizeRetentionDays(retentionRaw.auditLogsDays, 'auditLogsDays') ??
        DEFAULT_RETENTION_DAYS.auditLogsDays,
    },
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
    privacyPolicyVersion:
      typeof raw.privacyPolicyVersion === 'string' &&
      raw.privacyPolicyVersion.trim()
        ? raw.privacyPolicyVersion.trim()
        : DEFAULT_PRIVACY_POLICY_VERSION,
    dataResidencyRegion:
      normalizeDataResidencyRegion(raw.dataResidencyRegion as string) ?? 'other',
  };
}

export function readBusinessHipaaSettings(
  settings?: Record<string, unknown> | null,
): BusinessHipaaSettings {
  const raw = (settings?.hipaa as Record<string, unknown> | undefined) ?? {};
  const timeout = Number(raw.sessionTimeoutMinutes);
  const sessionTimeoutMinutes =
    Number.isFinite(timeout) && timeout >= 5 && timeout <= 60
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
      typeof raw.baaVersion === 'string' ? raw.baaVersion : null,
    sessionTimeoutMinutes,
  };
}

export function isClinicBusinessType(
  businessType: string | undefined | null,
): boolean {
  if (!businessType) return false;
  return (CLINIC_BUSINESS_TYPES as readonly string[]).includes(businessType);
}

export function isHipaaModeActive(
  settings?: Record<string, unknown> | null,
): boolean {
  const businessType = settings?.businessType as string | undefined;
  return (
    readBusinessHipaaSettings(settings).enabled &&
    isClinicBusinessType(businessType)
  );
}

export function shouldPromptPrivacyReconsent(
  consentedVersion: string | undefined,
  currentVersion: string,
): boolean {
  if (!consentedVersion?.trim()) return true;
  return consentedVersion.trim() !== currentVersion.trim();
}

export function getHipaaSessionTimeoutMs(
  hipaa: Pick<BusinessHipaaSettings, 'sessionTimeoutMinutes'>,
): number {
  return hipaa.sessionTimeoutMinutes * 60 * 1000;
}
