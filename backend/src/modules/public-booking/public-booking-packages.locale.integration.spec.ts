import { ConfigService } from '@nestjs/config';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
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

  const service = createPublicBookingServiceHarness({
    businessService: { findBySlug: jest.fn(async () => business) } as never,
    packagesService: packagesService as never,
    configService: config as unknown as ConfigService,
    serviceRepo: { findOne: jest.fn(), find: jest.fn() } as never,
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() } as never,
    schedulingPeriodRepo: { find: jest.fn() } as never,
  });

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
