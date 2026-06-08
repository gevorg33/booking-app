import { resolveTenantLocale } from '../../common/utils/business-locale.util.js';
import { BusinessService } from './business.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { ConfigService } from '@nestjs/config';
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

describe('Sprint 29 — business locale integration', () => {
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

  it('exposes enabledLocales and defaultLocale on public profile', () => {
    const profile = publicBookingService.toPublicProfile(
      baseBusiness({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      }),
    );

    expect(profile.enabledLocales).toEqual(['en', 'hy']);
    expect(profile.defaultLocale).toBe('hy');
    expect(profile.locale).toBe('hy');
  });

  it('defaults to all locales when unset', () => {
    const profile = publicBookingService.toPublicProfile(baseBusiness({}));
    expect(profile.enabledLocales).toEqual(['en', 'hy', 'ru']);
    expect(profile.defaultLocale).toBe('en');
  });

  it('resolveTenantLocale constrains visitor preference to enabled locales', () => {
    const settings = {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'hy',
    };
    expect(resolveTenantLocale('en', settings)).toBe('en');
    expect(resolveTenantLocale('ru', settings)).toBe('hy');
    expect(resolveTenantLocale(null, settings)).toBe('hy');
  });

  it('rejects unsupported currency-like locale codes on settings update', async () => {
    businessRepo.findOne.mockResolvedValue(baseBusiness({}));

    await expect(
      businessService.update('biz-1', {
        settings: { enabledLocales: ['en', 'xyz'] },
      }),
    ).rejects.toThrow();
  });

  it('persists tenant language settings via business update', async () => {
    businessRepo.findOne.mockResolvedValue(baseBusiness({}));

    await businessService.update('biz-1', {
      settings: {
        enabledLocales: ['hy', 'ru'],
        defaultLocale: 'ru',
      },
    });

    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enabledLocales: ['hy', 'ru'],
          defaultLocale: 'ru',
          locale: 'ru',
        }),
      }),
    );
  });
});
