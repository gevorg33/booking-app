import {
  DEFAULT_BUSINESS_HIPAA_SETTINGS,
  DEFAULT_BUSINESS_PRIVACY_SETTINGS,
  DEFAULT_RETENTION_DAYS,
  readBusinessRetentionSettings,
  PHI_FIELD_NAMES,
  SUB_PROCESSORS,
  anonymizePiiPlaceholder,
  assertBusinessHipaaSettings,
  assertBusinessPrivacySettings,
  buildComplianceStatusSummary,
  getHipaaSessionTimeoutMs,
  isHipaaEligibleBusinessType,
  isHipaaModeActive,
  normalizeDataResidencyRegion,
  normalizeRetentionDays,
  objectContainsPhiFields,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
  shouldPromptPrivacyReconsent,
  toPublicBusinessPrivacySettings,
} from './business-compliance.util.js';

describe('business-compliance.util', () => {
  describe('normalizeDataResidencyRegion', () => {
    it.each([
      ['eu', 'eu'],
      [' US ', 'us'],
      ['bad', null],
      [null, null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalizeDataResidencyRegion(input)).toBe(expected);
    });

    it('rejects non-string values', () => {
      expect(normalizeDataResidencyRegion(42 as never)).toBeNull();
    });
  });

  describe('readBusinessRetentionSettings', () => {
    it('reads retention from flat raw object without nested retention key', () => {
      expect(
        readBusinessRetentionSettings({ customerPiiDays: 730 }),
      ).toMatchObject({ customerPiiDays: 730 });
    });

    it('defaults when raw is undefined', () => {
      expect(readBusinessRetentionSettings(undefined)).toEqual(
        DEFAULT_RETENTION_DAYS,
      );
    });
  });

  describe('normalizeRetentionDays', () => {
    it.each([
      [365, 'bookingHistoryDays', 365],
      [' 1095 ', 'customerPiiDays', 1095],
      [29, 'customerPiiDays', null],
      [800, 'aiCommandLogsDays', null],
      ['bad', 'auditLogsDays', null],
    ])('normalizes %s for %s -> %s', (value, field, expected) => {
      expect(normalizeRetentionDays(value, field as never)).toBe(expected);
    });
  });

  describe('readBusinessPrivacySettings', () => {
    it('returns defaults when privacy block is missing', () => {
      expect(readBusinessPrivacySettings({})).toEqual(
        DEFAULT_BUSINESS_PRIVACY_SETTINGS,
      );
    });

    it('reads persisted privacy settings', () => {
      expect(
        readBusinessPrivacySettings({
          privacy: {
            retention: { bookingHistoryDays: 2000 },
            cookieBanner: { enabled: true, message: ' Cookies ' },
            granularConsent: { requireAiProcessing: true },
            privacyPolicyVersion: ' 2.1 ',
            dataResidencyRegion: 'eu',
          },
        }),
      ).toMatchObject({
        retention: { bookingHistoryDays: 2000 },
        cookieBanner: { enabled: true, message: 'Cookies' },
        granularConsent: { requireAiProcessing: true },
        privacyPolicyVersion: '2.1',
        dataResidencyRegion: 'eu',
      });
    });

    it('handles non-string cookie banner message', () => {
      const privacy = readBusinessPrivacySettings({
        privacy: { cookieBanner: { enabled: true, message: 42 } },
      });
      expect(privacy.cookieBanner.message).toBe('');
    });

    it('falls back invalid retention and region values', () => {
      const privacy = readBusinessPrivacySettings({
        privacy: {
          retention: { customerPiiDays: 10 },
          dataResidencyRegion: 'mars',
        },
      });
      expect(privacy.retention.customerPiiDays).toBe(
        DEFAULT_RETENTION_DAYS.customerPiiDays,
      );
      expect(privacy.dataResidencyRegion).toBe('other');
    });
  });

  describe('assertBusinessPrivacySettings', () => {
    it('inherits cookie banner from existing settings when omitted', () => {
      expect(
        assertBusinessPrivacySettings(
          { retention: { customerPiiDays: 800 } },
          {
            privacy: {
              cookieBanner: { enabled: true, message: 'Keep me' },
            },
          },
        ),
      ).toMatchObject({
        retention: { customerPiiDays: 800 },
        cookieBanner: { enabled: true, message: 'Keep me' },
      });
    });

    it('merges with existing settings and handles non-string cookie message', () => {
      expect(
        assertBusinessPrivacySettings(
          { cookieBanner: { enabled: true, message: 42 as never } },
          { privacy: { privacyPolicyVersion: '1.5' } },
        ),
      ).toMatchObject({
        cookieBanner: { enabled: true, message: '' },
        privacyPolicyVersion: '1.5',
      });
    });

    it('normalizes and persists privacy settings', () => {
      expect(
        assertBusinessPrivacySettings({
          cookieBanner: { enabled: true, message: ' Hello ' },
          privacyPolicyVersion: '3.0',
          dataResidencyRegion: 'us',
        }),
      ).toMatchObject({
        cookieBanner: { enabled: true, message: 'Hello' },
        privacyPolicyVersion: '3.0',
        dataResidencyRegion: 'us',
      });
    });
  });

  describe('readBusinessHipaaSettings', () => {
    it('returns defaults when hipaa block is missing', () => {
      expect(readBusinessHipaaSettings({})).toEqual(
        DEFAULT_BUSINESS_HIPAA_SETTINGS,
      );
    });

    it('accepts boundary session timeout values', () => {
      expect(
        readBusinessHipaaSettings({ hipaa: { sessionTimeoutMinutes: 5 } })
          .sessionTimeoutMinutes,
      ).toBe(5);
      expect(
        readBusinessHipaaSettings({ hipaa: { sessionTimeoutMinutes: 60 } })
          .sessionTimeoutMinutes,
      ).toBe(60);
    });

    it('defaults invalid session timeout', () => {
      expect(
        readBusinessHipaaSettings({
          hipaa: { sessionTimeoutMinutes: 'bad' },
        }).sessionTimeoutMinutes,
      ).toBe(15);
    });

    it('reads HIPAA settings with clamped session timeout', () => {
      expect(
        readBusinessHipaaSettings({
          hipaa: {
            enabled: true,
            baaAcceptedAt: '2026-01-01T00:00:00.000Z',
            baaAcceptedByUserId: 'user-1',
            baaVersion: '1.0',
            sessionTimeoutMinutes: 99,
          },
        }),
      ).toMatchObject({
        enabled: true,
        sessionTimeoutMinutes: 15,
      });
    });
  });

  describe('assertBusinessHipaaSettings', () => {
    it('accepts HIPAA enablement for clinic businesses with BAA', () => {
      expect(
        assertBusinessHipaaSettings(
          {
            enabled: true,
            baaAcceptedAt: '2026-06-01T00:00:00.000Z',
            baaAcceptedByUserId: 'owner-1',
            baaVersion: '1.0',
            sessionTimeoutMinutes: 20,
          },
          'clinic',
        ),
      ).toMatchObject({ enabled: true, sessionTimeoutMinutes: 20 });
    });

    it('rejects HIPAA for non-clinic businesses', () => {
      expect(() =>
        assertBusinessHipaaSettings(
          { enabled: true, baaAcceptedAt: 'x' },
          'hair_salon',
        ),
      ).toThrow('HIPAA mode is only available');
    });

    it('rejects enabled HIPAA without BAA acceptance', () => {
      expect(() =>
        assertBusinessHipaaSettings({ enabled: true }, 'clinic'),
      ).toThrow('Business Associate Agreement must be accepted');
    });

    it('allows disabling HIPAA without BAA re-acceptance', () => {
      expect(
        assertBusinessHipaaSettings({ enabled: false }, 'clinic', {
          hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
        }),
      ).toMatchObject({ enabled: false, baaAcceptedAt: '2026-01-01' });
    });

    it('preserves BAA fields from input when provided', () => {
      expect(
        assertBusinessHipaaSettings(
          {
            baaAcceptedByUserId: 'user-2',
            baaVersion: '2.0',
          },
          'clinic',
          {
            hipaa: {
              baaAcceptedAt: '2026-01-01',
              baaAcceptedByUserId: 'user-1',
            },
          },
        ),
      ).toMatchObject({
        baaAcceptedByUserId: 'user-2',
        baaVersion: '2.0',
      });
    });

    it('rejects invalid session timeout', () => {
      expect(() =>
        assertBusinessHipaaSettings(
          {
            enabled: true,
            baaAcceptedAt: '2026-01-01',
            sessionTimeoutMinutes: 2,
          },
          'clinic',
        ),
      ).toThrow('HIPAA session timeout must be between');
    });
  });

  describe('HIPAA eligibility helpers', () => {
    it.each([
      ['clinic', true],
      ['polyclinic', true],
      ['dental', true],
      ['hair_salon', false],
      [null, false],
    ])('isHipaaEligibleBusinessType(%s) -> %s', (type, expected) => {
      expect(isHipaaEligibleBusinessType(type)).toBe(expected);
    });

    it('isHipaaModeActive requires eligible type and enabled flag', () => {
      expect(
        isHipaaModeActive(
          { hipaa: { enabled: true }, businessType: 'clinic' },
          'clinic',
        ),
      ).toBe(true);
      expect(
        isHipaaModeActive(
          { hipaa: { enabled: true }, businessType: 'hair_salon' },
          'hair_salon',
        ),
      ).toBe(false);
    });

    it('getHipaaSessionTimeoutMs converts minutes to ms', () => {
      expect(getHipaaSessionTimeoutMs({ sessionTimeoutMinutes: 15 })).toBe(
        900000,
      );
    });
  });

  describe('anonymizePiiPlaceholder', () => {
    it('returns deterministic hashed placeholders per customer', () => {
      const name = anonymizePiiPlaceholder('cust-1', 'name');
      const email = anonymizePiiPlaceholder('cust-1', 'email');
      const phone = anonymizePiiPlaceholder('cust-1', 'phone');
      expect(name).toMatch(/^Deleted customer \([a-f0-9]{12}\)$/);
      expect(email).toMatch(/^deleted-[a-f0-9]{12}@anonymized\.local$/);
      expect(phone).toMatch(/^\+0000000[a-f0-9]{7}$/);
      expect(anonymizePiiPlaceholder('cust-2', 'email')).not.toBe(email);
    });
  });

  describe('shouldPromptPrivacyReconsent', () => {
    it('prompts when version missing or changed', () => {
      expect(shouldPromptPrivacyReconsent(undefined, '2.0')).toBe(true);
      expect(shouldPromptPrivacyReconsent('1.0', '2.0')).toBe(true);
      expect(shouldPromptPrivacyReconsent('2.0', '2.0')).toBe(false);
    });
  });

  describe('objectContainsPhiFields', () => {
    it('detects PHI field names at any depth', () => {
      expect(objectContainsPhiFields({ symptoms: 'cough' })).toBe(true);
      expect(
        objectContainsPhiFields({ nested: { referralNotes: 'Dr Smith' } }),
      ).toBe(true);
      expect(objectContainsPhiFields({ name: 'Jane' })).toBe(false);
      expect(objectContainsPhiFields([{ symptoms: 'fever' }])).toBe(true);
      expect(objectContainsPhiFields('text')).toBe(false);
      expect(objectContainsPhiFields(null)).toBe(false);
      expect(PHI_FIELD_NAMES).toContain('symptoms');
    });

    it('stops recursion beyond depth limit', () => {
      const deep = { a: { b: { c: { d: { e: { symptoms: 'late' } } } } } };
      expect(objectContainsPhiFields(deep)).toBe(false);
    });
  });

  describe('toPublicBusinessPrivacySettings', () => {
    it('omits empty cookie banner message', () => {
      const privacy = assertBusinessPrivacySettings({
        cookieBanner: { enabled: true, message: '   ' },
      });
      expect(
        toPublicBusinessPrivacySettings(privacy).cookieBannerMessage,
      ).toBeUndefined();
    });

    it('maps admin privacy to public profile summary', () => {
      const privacy = assertBusinessPrivacySettings({
        cookieBanner: { enabled: true, message: 'Cookies' },
        granularConsent: {
          requireAiProcessing: true,
          requireThirdPartyIntegrations: false,
        },
        privacyPolicyVersion: '2.0',
        dataResidencyRegion: 'eu',
      });
      expect(toPublicBusinessPrivacySettings(privacy)).toEqual({
        cookieBannerEnabled: true,
        cookieBannerMessage: 'Cookies',
        privacyPolicyVersion: '2.0',
        requireAiProcessingConsent: true,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'eu',
      });
    });
  });

  describe('buildComplianceStatusSummary', () => {
    it('marks HIPAA ineligible for salon businesses', () => {
      const summary = buildComplianceStatusSummary(
        { hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' } },
        'hair_salon',
      );
      expect(summary.hipaa.eligible).toBe(false);
      expect(summary.hipaa.enabled).toBe(false);
    });

    it('summarizes GDPR and HIPAA status', () => {
      const summary = buildComplianceStatusSummary(
        {
          privacy: {
            cookieBanner: { enabled: true },
            privacyPolicyVersion: '2.0',
            dataResidencyRegion: 'eu',
          },
          hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
          businessType: 'clinic',
        },
        'clinic',
      );
      expect(summary.gdpr.cookieBannerEnabled).toBe(true);
      expect(summary.hipaa.enabled).toBe(true);
      expect(summary.hipaa.baaSigned).toBe(true);
      expect(summary.hipaa.sessionTimeoutEnforced).toBe(true);
      expect(summary.hipaa.minimumAccessEnforced).toBe(true);
      expect(summary.hipaa.aiPhiGuardEnabled).toBe(true);
    });

    it('reports PHI encryption configured when per-business key exists', () => {
      const summary = buildComplianceStatusSummary(
        {
          businessType: 'clinic',
          hipaa: {
            enabled: true,
            baaAcceptedAt: '2026-01-01',
            phiEncryptionKeyId: 'key-1',
            phiEncryptionKeyEnc: 'enc-1',
          },
        },
        'clinic',
      );
      expect(summary.hipaa.phiEncryptionConfigured).toBe(true);
    });
  });

  it('exports sub-processor list for GDPR Article 28', () => {
    expect(SUB_PROCESSORS.length).toBeGreaterThanOrEqual(5);
    expect(SUB_PROCESSORS[0]).toHaveProperty('name');
    expect(SUB_PROCESSORS[0]).toHaveProperty('dataTypes');
  });
});
