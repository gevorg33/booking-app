import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { Business } from './entities/business.entity.js';

function buildPublicBookingService(): PublicBookingService {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
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
    stripeIntegrationService as unknown as StripeIntegrationService,
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
  );
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  ({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      ...settings,
    },
  }) as Business;

describe('Sprint 34 — business date format integration', () => {
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
    it('persists supported date and time formats on business settings update', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en' },
      });

      await businessService.update('biz-1', {
        settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
          }),
        }),
      );
    });

    it('rejects unsupported date format codes', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await expect(
        businessService.update('biz-1', {
          settings: { dateFormat: 'DD-MM-YYYY' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects unsupported time format codes', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await expect(
        businessService.update('biz-1', { settings: { timeFormat: '48h' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists dateFormat only without overwriting timeFormat', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en', timeFormat: '12h' },
      });

      await businessService.update('biz-1', {
        settings: { dateFormat: ' YYYY-MM-DD ' },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '12h',
          }),
        }),
      );
    });

    it('persists timeFormat only without overwriting dateFormat', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en', dateFormat: 'MM/DD/YYYY' },
      });

      await businessService.update('biz-1', {
        settings: { timeFormat: ' 12h ' },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
          }),
        }),
      );
    });
  });

  describe('public profile date format', () => {
    it.each([
      {
        id: 'explicit-formats',
        settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
      {
        id: 'defaults',
        settings: {},
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
      {
        id: 'iso-date',
        settings: { dateFormat: 'YYYY-MM-DD' },
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      },
    ])(
      'toPublicProfile resolves $id',
      ({ settings, dateFormat, timeFormat }) => {
        const profile = publicBookingService.toPublicProfile(
          baseBusiness(settings),
        );
        expect(profile.dateFormat).toBe(dateFormat);
        expect(profile.timeFormat).toBe(timeFormat);
      },
    );
  });
});
