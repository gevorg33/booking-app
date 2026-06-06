import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

describe('Sprint 29 — public booking package locale integration', () => {
  const business = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    timezone: 'UTC',
    settings: {
      locale: 'en',
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      publicBooking: { enabled: true },
    },
  };

  const packagesService = {
    listPublicPackages: jest.fn(),
    getPublicPackage: jest.fn(),
  };

  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };

  const service = new PublicBookingService(
    { findBySlug: jest.fn(async () => business) } as never,
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
    packagesService as never,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    { find: jest.fn() } as never,
    { findOne: jest.fn(), find: jest.fn() } as never,
    { find: jest.fn(), createQueryBuilder: jest.fn() } as never,
    { find: jest.fn() } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    packagesService.listPublicPackages.mockResolvedValue([
      { id: 'pkg-1', kind: 'package', name: 'Սպա օր' },
    ]);
    packagesService.getPublicPackage.mockResolvedValue({
      id: 'pkg-1',
      kind: 'package',
      name: 'Սպա օր',
    });
  });

  it('passes resolved display locale to listPublicPackages', async () => {
    const { packages } = await service.getPublicPackages('salon', 'hy');

    expect(packagesService.listPublicPackages).toHaveBeenCalledWith(
      'biz-1',
      0,
      'hy',
    );
    expect(packages[0]?.name).toBe('Սպա օր');
  });

  it('falls back to tenant default locale when query locale is disabled', async () => {
    await service.getPublicPackages('salon', 'ru');

    expect(packagesService.listPublicPackages).toHaveBeenCalledWith(
      'biz-1',
      0,
      'en',
    );
  });

  it('passes resolved display locale to getPublicPackage', async () => {
    const { package: pkg } = await service.getPublicPackage(
      'salon',
      'pkg-1',
      'hy',
    );

    expect(packagesService.getPublicPackage).toHaveBeenCalledWith(
      'biz-1',
      'pkg-1',
      0,
      'hy',
    );
    expect(pkg.name).toBe('Սպա օր');
  });
});
