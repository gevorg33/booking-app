import { describe, expect, it } from 'vitest';
import {
  isClinicBusinessType,
  isHipaaModeActive,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
  shouldPromptPrivacyReconsent,
} from './business-compliance';
import type { PublicBusinessProfile } from './public-api';

describe('Sprint 37 — business compliance scenario matrix', () => {
  it.each([
    {
      id: 'cookie-banner-on',
      settings: {
        privacy: {
          cookieBanner: { enabled: true, message: 'We use cookies' },
          privacyPolicyVersion: '2.0',
        },
      },
      cookieBanner: true,
      reconsent: true,
    },
    {
      id: 'granular-ai-consent',
      settings: {
        privacy: {
          granularConsent: { requireAiProcessing: true },
          privacyPolicyVersion: '2.0',
        },
      },
      cookieBanner: false,
      requireAi: true,
      reconsent: true,
    },
    {
      id: 'defaults',
      settings: {},
      cookieBanner: false,
      requireAi: false,
      reconsent: true,
    },
    {
      id: 'same-version-no-reconsent',
      settings: {
        privacy: { privacyPolicyVersion: '1.0' },
      },
      cookieBanner: false,
      consentedVersion: '1.0',
      reconsent: false,
    },
    {
      id: 'third-party-consent-required',
      settings: {
        privacy: {
          granularConsent: { requireThirdPartyIntegrations: true },
          dataResidencyRegion: 'us',
        },
      },
      cookieBanner: false,
      requireThirdParty: true,
      residency: 'us',
    },
    {
      id: 'hipaa-clinic-active',
      settings: {
        businessType: 'clinic',
        hipaa: {
          enabled: true,
          baaAcceptedAt: '2026-01-01',
          sessionTimeoutMinutes: 20,
        },
      },
      cookieBanner: false,
      hipaaActive: true,
      sessionTimeout: 20,
    },
    {
      id: 'hipaa-salon-ineligible',
      settings: {
        businessType: 'hair_salon',
        hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
      },
      cookieBanner: false,
      hipaaActive: false,
    },
  ])(
    'public booking compliance for $id',
    ({
      settings,
      cookieBanner,
      requireAi,
      requireThirdParty,
      residency,
      consentedVersion,
      reconsent,
      hipaaActive,
      sessionTimeout,
    }) => {
      const privacy = readBusinessPrivacySettings(settings);
      const profile: PublicBusinessProfile['privacy'] = {
        cookieBannerEnabled: privacy.cookieBanner.enabled,
        cookieBannerMessage: privacy.cookieBanner.message || undefined,
        privacyPolicyVersion: privacy.privacyPolicyVersion,
        requireAiProcessingConsent: privacy.granularConsent.requireAiProcessing,
        requireThirdPartyIntegrationsConsent:
          privacy.granularConsent.requireThirdPartyIntegrations,
        dataResidencyRegion: privacy.dataResidencyRegion,
      };

      expect(profile.cookieBannerEnabled).toBe(cookieBanner ?? false);
      if (requireAi != null) {
        expect(profile.requireAiProcessingConsent).toBe(requireAi);
      }
      if (requireThirdParty != null) {
        expect(profile.requireThirdPartyIntegrationsConsent).toBe(
          requireThirdParty,
        );
      }
      if (residency != null) {
        expect(profile.dataResidencyRegion).toBe(residency);
      }
      if (hipaaActive != null) {
        expect(isHipaaModeActive(settings)).toBe(hipaaActive);
        if (sessionTimeout != null) {
          expect(readBusinessHipaaSettings(settings).sessionTimeoutMinutes).toBe(
            sessionTimeout,
          );
        }
        if (settings.businessType) {
          expect(
            isClinicBusinessType(settings.businessType as string),
          ).toBe(hipaaActive || settings.businessType === 'clinic');
        }
      }
      if (reconsent != null) {
        expect(
          shouldPromptPrivacyReconsent(
            consentedVersion,
            profile.privacyPolicyVersion,
          ),
        ).toBe(reconsent);
      }
    },
  );
});
