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
    businessService: { findBySlug: jest.fn(async () => business) },
    packagesService: packagesService,
    configService: config as unknown as ConfigService,
    serviceRepo: { findOne: jest.fn(), find: jest.fn() },
    slotRepo: { find: jest.fn(), createQueryBuilder: jest.fn() },
    schedulingPeriodRepo: { find: jest.fn() },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    packagesService.listPublicPackages.mockResolvedValue([
      { id: 'ed9c3ac3-f7c7-4161-8e38-0944e672b647', kind: 'package', name: 'Սպա օր' },
    ]);
    packagesService.getPublicPackage.mockResolvedValue({
      id: 'ed9c3ac3-f7c7-4161-8e38-0944e672b647',
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
      'ed9c3ac3-f7c7-4161-8e38-0944e672b647',
      'hy',
    );

    expect(packagesService.getPublicPackage).toHaveBeenCalledWith(
      'biz-1',
      'ed9c3ac3-f7c7-4161-8e38-0944e672b647',
      0,
      'hy',
    );
    expect(pkg.name).toBe('Սպա օր');
  });
});
