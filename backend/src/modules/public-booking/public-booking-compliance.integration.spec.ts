import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { PublicBookingService } from './public-booking.service.js';
import {
  buildComplianceStatusSummary,
  readBusinessPrivacySettings,
  toPublicBusinessPrivacySettings,
} from '../../common/utils/business-compliance.util.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function buildPublicBookingService(): PublicBookingService {
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as never,
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn() } as never,
  );
  return new PublicBookingService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      isConnectReady: jest.fn().mockReturnValue(false),
    } as unknown as StripeIntegrationService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  
    // e2e-bug: PublicBookingService gained four repositories;
    // `undefined as never` keeps the runtime identical to omitting them.
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never);
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  makeBusiness({
    id: 'biz-1',
    name: 'Clinic',
    slug: 'clinic',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      businessType: 'clinic',
      ...settings,
    },
  });

describe('Sprint 37 — public booking compliance integration', () => {
  const publicBookingService = buildPublicBookingService();

  it.each([
    {
      id: 'cookie-banner-eu',
      settings: {
        privacy: {
          cookieBanner: { enabled: true, message: 'Cookie notice' },
          privacyPolicyVersion: '2.0',
          dataResidencyRegion: 'eu',
        },
      },
      publicPrivacy: {
        cookieBannerEnabled: true,
        cookieBannerMessage: 'Cookie notice',
        privacyPolicyVersion: '2.0',
        requireAiProcessingConsent: false,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'eu',
      },
    },
    {
      id: 'granular-ai-and-third-party',
      settings: {
        privacy: {
          granularConsent: {
            requireAiProcessing: true,
            requireThirdPartyIntegrations: true,
          },
          privacyPolicyVersion: '3.0',
          dataResidencyRegion: 'us',
        },
      },
      publicPrivacy: {
        cookieBannerEnabled: false,
        privacyPolicyVersion: '3.0',
        requireAiProcessingConsent: true,
        requireThirdPartyIntegrationsConsent: true,
        dataResidencyRegion: 'us',
      },
    },
    {
      id: 'defaults',
      settings: {},
      publicPrivacy: {
        cookieBannerEnabled: false,
        privacyPolicyVersion: '1.0',
        requireAiProcessingConsent: false,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'other',
      },
    },
    {
      id: 'invalid-region-fallback',
      settings: {
        privacy: {
          dataResidencyRegion: 'invalid',
          privacyPolicyVersion: '1.5',
        },
      },
      publicPrivacy: {
        cookieBannerEnabled: false,
        privacyPolicyVersion: '1.5',
        requireAiProcessingConsent: false,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'other',
      },
    },
    {
      id: 'hipaa-clinic-summary',
      settings: {
        hipaa: {
          enabled: true,
          baaAcceptedAt: '2026-01-01',
          sessionTimeoutMinutes: 20,
        },
        businessType: 'clinic',
      },
      publicPrivacy: {
        cookieBannerEnabled: false,
        privacyPolicyVersion: '1.0',
        requireAiProcessingConsent: false,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'other',
      },
      hipaaEnabled: true,
    },
  ])(
    'profile + compliance pipeline for $id',
    ({ settings, publicPrivacy, hipaaEnabled }) => {
      const business = baseBusiness(settings);
      const profile = publicBookingService.toPublicProfile(business);

      const stored = readBusinessPrivacySettings(settings);
      expect(toPublicBusinessPrivacySettings(stored)).toEqual(publicPrivacy);
      expect(profile.privacy).toEqual(publicPrivacy);

      const summary = buildComplianceStatusSummary(
        business.settings as Record<string, unknown>,
        business.settings?.businessType as string,
      );
      if (hipaaEnabled) {
        expect(summary.hipaa.enabled).toBe(true);
        expect(summary.hipaa.baaSigned).toBe(true);
      } else {
        expect(summary.gdpr.retentionConfigured).toBe(true);
      }
    },
  );

  it('does not expose internal retention settings on public profile', () => {
    const profile = publicBookingService.toPublicProfile(
      baseBusiness({
        privacy: {
          retention: { customerPiiDays: 400 },
          privacyPolicyVersion: '2.0',
        },
      }),
    );
    expect(profile.privacy).not.toHaveProperty('retention');
    expect(profile.privacy?.privacyPolicyVersion).toBe('2.0');
  });
});
