import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BusinessService } from './business.service.js';
import { createPublicBookingServiceHarness } from '../public-booking/public-booking-test.harness.js';

describe('Business public profile locales integration', () => {
  let business: Record<string, unknown>;

  const businessRepo = {
    findOne: jest.fn(async () => business),
    save: jest.fn(async (value: Record<string, unknown>) => {
      business = value;
      return value;
    }),
  };

  const memberRepo = {};

  const dashboardBusinessService = new BusinessService(
    businessRepo as any,
    memberRepo as any,
  );

  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };

  const publicBusinessService = {
    findBySlug: jest.fn(async () => business),
  };

  const subscriptionsService = {
    serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
  };

  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn().mockReturnValue({ enabled: false }),
  };

  const publicBookingService = createPublicBookingServiceHarness({
    businessService: publicBusinessService as any,
    stripeIntegrationService: stripeIntegrationService as any,
    subscriptionsService: subscriptionsService as any,
    multiServiceBookingsService: multiServiceBookingsService as any,
    configService: {
      get: jest.fn((key: string) => {
        if (key === 'PUBLIC_API_URL') return 'http://127.0.0.1:3001';
        if (key === 'FRONTEND_URL') return 'http://127.0.0.1:3000';
        return undefined;
      }),
    } as any,
  });

  beforeEach(() => {
    business = {
      id: 'biz-1',
      name: 'Default Salon',
      slug: 'salon',
      description: 'Default description',
      address: 'Default address',
      phone: '+10000000000',
      email: 'hello@salon.com',
      timezone: 'Asia/Yerevan',
      isActive: true,
      settings: {
        locale: 'en',
        branding: { tagline: 'Default tagline', primaryColor: '#7c3aed' },
        publicBooking: { enabled: true },
      },
    };
    jest.clearAllMocks();
    businessRepo.findOne.mockImplementation(async () => business);
    businessRepo.save.mockImplementation(
      async (value: Record<string, unknown>) => {
        business = value;
        return value;
      },
    );
  });

  it('persists dashboard locale content and serves it on the public profile API', async () => {
    await dashboardBusinessService.updateProfile('biz-1', {
      publicProfileLocales: {
        hy: {
          name: 'Սալոն Հայերեն',
          description: 'Հայերեն նկարագրություն',
          tagline: 'Հայերեն կարգախոս',
          address: 'Երևան, Հայաստան',
        },
        ru: { tagline: 'Русский слоган' },
      },
    });

    expect((business.settings as any).publicProfileLocales).toEqual({
      hy: {
        name: 'Սալոն Հայերեն',
        description: 'Հայերեն նկարագրություն',
        tagline: 'Հայերեն կարգախոս',
        address: 'Երևան, Հայաստան',
      },
      ru: { tagline: 'Русский слоган' },
    });

    const profileHy = await publicBookingService.getProfile('salon', 'hy');
    expect(profileHy.name).toBe('Սալոն Հայերեն');
    expect(profileHy.description).toBe('Հայերեն նկարագրություն');
    expect(profileHy.branding.tagline).toBe('Հայերեն կարգախոս');
    expect(profileHy.address).toBe('Երևան, Հայաստան');
    expect(profileHy.phone).toBe('+10000000000');

    const profileRu = await publicBookingService.getProfile('salon', 'ru');
    expect(profileRu.name).toBe('Default Salon');
    expect(profileRu.branding.tagline).toBe('Русский слоган');
    expect(profileRu.description).toBe('Default description');

    const profileEn = await publicBookingService.getProfile('salon', 'en');
    expect(profileEn.name).toBe('Default Salon');
    expect(profileEn.branding.tagline).toBe('Default tagline');
  });

  it('clears locale overrides when dashboard sends an empty map', async () => {
    await dashboardBusinessService.updateProfile('biz-1', {
      publicProfileLocales: { hy: { name: 'Temporary' } },
    });
    await dashboardBusinessService.updateProfile('biz-1', {
      publicProfileLocales: {},
    });

    expect((business.settings as any).publicProfileLocales).toBeUndefined();

    const profile = await publicBookingService.getProfile('salon', 'hy');
    expect(profile.name).toBe('Default Salon');
  });

  it('uses business default locale when public locale query is invalid', async () => {
    (business.settings as any).locale = 'hy';
    (business.settings as any).publicProfileLocales = {
      hy: { name: 'Հայերեն անուն' },
    };

    const profile = await publicBookingService.getProfile('salon', 'invalid');
    expect(profile.name).toBe('Հայերեն անուն');
  });

  it('rejects unsupported locales from the dashboard profile API', async () => {
    await expect(
      dashboardBusinessService.updateProfile('biz-1', {
        publicProfileLocales: { de: { name: 'German' } },
      }),
    ).rejects.toThrow(
      new BadRequestException('Unsupported locale in translations: de'),
    );
  });

  it('blocks public profile when business is inactive', async () => {
    business.isActive = false;
    await expect(
      publicBookingService.getProfile('salon', 'hy'),
    ).rejects.toThrow(ForbiddenException);
  });
});
