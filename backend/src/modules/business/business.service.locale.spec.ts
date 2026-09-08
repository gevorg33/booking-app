import { BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service.js';
import type { Business } from './entities/business.entity.js';
import { makeBusiness } from './entities/business.test-fixture.js';

describe('BusinessService locale (Sprint 29)', () => {
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: Business) => b),
  };
  const memberRepo = { find: jest.fn() };
  const service = new BusinessService(
    businessRepo as never,
    memberRepo as never,
  );

  const baseBusiness: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { locale: 'en', enabledLocales: ['en', 'hy', 'ru'] },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({ ...baseBusiness });
  });

  it('persists enabledLocales and defaultLocale', async () => {
    await service.update('biz-1', {
      settings: {
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'hy',
      },
    });

    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enabledLocales: ['en', 'hy'],
          defaultLocale: 'hy',
          locale: 'hy',
        }),
      }),
    );
  });

  it('rejects empty enabledLocales', async () => {
    await expect(
      service.update('biz-1', { settings: { enabledLocales: [] } }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects defaultLocale outside enabled list', async () => {
    await expect(
      service.update('biz-1', {
        settings: { enabledLocales: ['en'], defaultLocale: 'hy' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects public profile locale not enabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...baseBusiness,
      settings: { enabledLocales: ['en'], defaultLocale: 'en' },
    });

    await expect(
      service.updateProfile('biz-1', { locale: 'hy' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('strips disabled locales from public profile translations', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...baseBusiness,
      settings: { enabledLocales: ['en', 'hy'], defaultLocale: 'en' },
    });

    await service.updateProfile('biz-1', {
      publicProfileLocales: {
        en: { name: 'Salon' },
        ru: { name: 'Салон' },
      },
    });

    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          publicProfileLocales: { en: { name: 'Salon' } },
        }),
      }),
    );
  });

  it('exposes enabled and default locale helpers', () => {
    expect(
      service.getEnabledLocales({
        ...baseBusiness,
        settings: { enabledLocales: ['hy', 'en'] },
      }),
    ).toEqual(['hy', 'en']);
    expect(
      service.getDefaultLocale({
        ...baseBusiness,
        settings: { defaultLocale: 'hy', enabledLocales: ['hy', 'en'] },
      }),
    ).toBe('hy');
  });
});
