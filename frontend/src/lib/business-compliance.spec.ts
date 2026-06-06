import { describe, expect, it } from 'vitest';
import {
  CLINIC_BUSINESS_TYPES,
  DEFAULT_BUSINESS_PRIVACY_SETTINGS,
  DEFAULT_PRIVACY_POLICY_VERSION,
  normalizeDataResidencyRegion,
  normalizeRetentionDays,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
  isClinicBusinessType,
  isHipaaModeActive,
  shouldPromptPrivacyReconsent,
  getHipaaSessionTimeoutMs,
} from './business-compliance';

describe('business-compliance', () => {
  it('exports clinic business types', () => {
    expect(CLINIC_BUSINESS_TYPES).toContain('clinic');
    expect(CLINIC_BUSINESS_TYPES).toContain('dental');
  });

  it('reads privacy settings with defaults', () => {
    expect(readBusinessPrivacySettings(null)).toEqual(
      DEFAULT_BUSINESS_PRIVACY_SETTINGS,
    );
    expect(
      readBusinessPrivacySettings({
        privacy: {
          cookieBanner: { enabled: true, message: 'Hi' },
          granularConsent: { requireThirdPartyIntegrations: true },
          privacyPolicyVersion: '  ',
          dataResidencyRegion: 'eu',
        },
      }),
    ).toMatchObject({
      cookieBanner: { enabled: true, message: 'Hi' },
      privacyPolicyVersion: DEFAULT_PRIVACY_POLICY_VERSION,
      dataResidencyRegion: 'eu',
      granularConsent: { requireThirdPartyIntegrations: true },
    });
  });

  it('normalizes retention days and residency region', () => {
    expect(normalizeRetentionDays('', 'customerPiiDays')).toBeNull();
    expect(normalizeRetentionDays('bad', 'customerPiiDays')).toBeNull();
    expect(normalizeRetentionDays(10, 'customerPiiDays')).toBeNull();
    expect(normalizeRetentionDays(730, 'customerPiiDays')).toBe(730);
    expect(normalizeDataResidencyRegion('eu')).toBe('eu');
    expect(normalizeDataResidencyRegion('bad')).toBeNull();
    expect(normalizeDataResidencyRegion(42 as never)).toBeNull();
  });

  it('reads HIPAA settings with BAA metadata', () => {
    expect(
      readBusinessHipaaSettings({
        hipaa: {
          enabled: true,
          baaAcceptedAt: '2026-01-01',
          baaAcceptedByUserId: 'user-1',
          baaVersion: '1.0',
          sessionTimeoutMinutes: 4,
        },
      }),
    ).toMatchObject({
      enabled: true,
      baaAcceptedAt: '2026-01-01',
      baaAcceptedByUserId: 'user-1',
      baaVersion: '1.0',
      sessionTimeoutMinutes: 15,
    });
    expect(
      readBusinessHipaaSettings({
        hipaa: { baaAcceptedByUserId: 42, baaVersion: null },
      }),
    ).toMatchObject({ baaAcceptedByUserId: null, baaVersion: null });
    expect(readBusinessHipaaSettings({})).toMatchObject({ enabled: false });
    expect(
      readBusinessHipaaSettings({ hipaa: { baaVersion: 99 as never } }),
    ).toMatchObject({ baaVersion: null });
  });

  it('reads HIPAA settings', () => {
    expect(readBusinessHipaaSettings(null)).toEqual({
      enabled: false,
      baaAcceptedAt: null,
      baaAcceptedByUserId: null,
      baaVersion: null,
      sessionTimeoutMinutes: 15,
    });
    expect(
      readBusinessHipaaSettings({
        hipaa: { enabled: true, sessionTimeoutMinutes: 20 },
      }),
    ).toMatchObject({ enabled: true, sessionTimeoutMinutes: 20 });
  });

  it.each([
    ['clinic', true],
    ['hair_salon', false],
    [null, false],
  ])('isClinicBusinessType(%s) -> %s', (type, expected) => {
    expect(isClinicBusinessType(type)).toBe(expected);
  });

  it('isHipaaModeActive requires clinic type and enabled flag', () => {
    expect(
      isHipaaModeActive({ businessType: 'clinic', hipaa: { enabled: true } }),
    ).toBe(true);
    expect(
      isHipaaModeActive({ businessType: 'hair_salon', hipaa: { enabled: true } }),
    ).toBe(false);
  });

  it('shouldPromptPrivacyReconsent detects version changes', () => {
    expect(shouldPromptPrivacyReconsent('1.0', '2.0')).toBe(true);
    expect(shouldPromptPrivacyReconsent('2.0', '2.0')).toBe(false);
  });

  it('getHipaaSessionTimeoutMs converts minutes', () => {
    expect(getHipaaSessionTimeoutMs({ sessionTimeoutMinutes: 15 })).toBe(900000);
  });
});
