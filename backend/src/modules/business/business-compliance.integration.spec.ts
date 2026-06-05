import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { Business } from './entities/business.entity.js';

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
    multiServiceBookingsService,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  ({
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
  }) as Business;

describe('Sprint 37 — business compliance integration', () => {
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: unknown) => b),
  };
  const memberRepo = { find: jest.fn() };
  const businessService = new BusinessService(
    businessRepo as never,
    memberRepo as never,
  );
  const publicBookingService = buildPublicBookingService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('settings persistence', () => {
    it('persists privacy retention and cookie banner settings', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en', businessType: 'hair_salon' },
      });

      await businessService.update('biz-1', {
        settings: {
          privacy: {
            retention: { customerPiiDays: 730 },
            cookieBanner: { enabled: true, message: 'We use cookies' },
            privacyPolicyVersion: '2.0',
            dataResidencyRegion: 'eu',
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            privacy: expect.objectContaining({
              cookieBanner: { enabled: true, message: 'We use cookies' },
              privacyPolicyVersion: '2.0',
              dataResidencyRegion: 'eu',
            }),
          }),
        }),
      );
    });

    it('persists HIPAA settings for clinic businesses with BAA', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { businessType: 'clinic' },
      });

      await businessService.update('biz-1', {
        settings: {
          hipaa: {
            enabled: true,
            baaAcceptedAt: '2026-06-01T00:00:00.000Z',
            baaAcceptedByUserId: 'user-1',
            baaVersion: '1.0',
            sessionTimeoutMinutes: 15,
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            hipaa: expect.objectContaining({
              enabled: true,
              sessionTimeoutMinutes: 15,
            }),
          }),
        }),
      );
    });

    it('rejects HIPAA enablement for salon businesses', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { businessType: 'hair_salon' },
      });

      await expect(
        businessService.update('biz-1', {
          settings: {
            hipaa: {
              enabled: true,
              baaAcceptedAt: '2026-06-01T00:00:00.000Z',
            },
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists granular consent requirements', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await businessService.update('biz-1', {
        settings: {
          privacy: {
            granularConsent: {
              requireAiProcessing: true,
              requireThirdPartyIntegrations: true,
            },
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            privacy: expect.objectContaining({
              granularConsent: {
                requireAiProcessing: true,
                requireThirdPartyIntegrations: true,
              },
            }),
          }),
        }),
      );
    });

    it('merges partial HIPAA updates while preserving BAA', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          businessType: 'clinic',
          hipaa: {
            enabled: true,
            baaAcceptedAt: '2026-01-01T00:00:00.000Z',
            sessionTimeoutMinutes: 15,
          },
        },
      });

      await businessService.update('biz-1', {
        settings: {
          hipaa: { sessionTimeoutMinutes: 20 },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            hipaa: expect.objectContaining({
              enabled: true,
              baaAcceptedAt: '2026-01-01T00:00:00.000Z',
              sessionTimeoutMinutes: 20,
            }),
          }),
        }),
      );
    });

    it('rejects HIPAA enablement without BAA acceptance', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { businessType: 'clinic' },
      });

      await expect(
        businessService.update('biz-1', {
          settings: { hipaa: { enabled: true } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid retention period', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await businessService.update('biz-1', {
        settings: {
          privacy: {
            retention: { customerPiiDays: 10 },
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            privacy: expect.objectContaining({
              retention: expect.objectContaining({
                customerPiiDays: 1095,
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('public profile privacy', () => {
    it('exposes privacy summary on public profile', () => {
      const profile = publicBookingService.toPublicProfile(
        baseBusiness({
          privacy: {
            cookieBanner: { enabled: true, message: 'Cookie notice' },
            granularConsent: { requireAiProcessing: true },
            privacyPolicyVersion: '2.0',
            dataResidencyRegion: 'eu',
          },
        }),
      );

      expect(profile.privacy).toEqual({
        cookieBannerEnabled: true,
        cookieBannerMessage: 'Cookie notice',
        privacyPolicyVersion: '2.0',
        requireAiProcessingConsent: true,
        requireThirdPartyIntegrationsConsent: false,
        dataResidencyRegion: 'eu',
      });
    });

    it('always includes privacy defaults when not configured', () => {
      const profile = publicBookingService.toPublicProfile(baseBusiness({}));
      expect(profile.privacy?.privacyPolicyVersion).toBe('1.0');
      expect(profile.privacy?.cookieBannerEnabled).toBe(false);
    });
  });
});
