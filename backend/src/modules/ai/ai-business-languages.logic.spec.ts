import {
  handleConfigureBusinessLanguagesLogic,
  handleExplainBusinessLanguagesLogic,
  handleBulkStripDisabledLocaleTranslationsLogic,
  handleExplainBookingLanguagesLogic,
} from './ai-business-languages.logic.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ServiceCategory } from '../service/entities/service-category.entity.js';
import type { ServicePackage } from '../service-packages/entities/service-package.entity.js';

describe('ai-business-languages.logic (ai-cmd-lang-1)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      locale: 'en',
    },
  } as Business;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    save: jest.fn(async (item: Service) => item),
    find: jest.fn(async () => [
      {
        id: 's1',
        metadata: { localizedNames: { en: ['Cut'], ru: ['Стрижка'] } },
      },
      { id: 's2', metadata: { localizedNames: { en: ['Color'] } } },
    ]),
  };

  const categoryRepo = {
    save: jest.fn(async (item: ServiceCategory) => item),
    find: jest.fn(async () => [
      {
        id: 'c1',
        metadata: { localizedNames: { hy: ['Մազեր'], ru: ['Волосы'] } },
      },
    ]),
  };

  const packageRepo = {
    save: jest.fn(async (item: ServicePackage) => item),
    find: jest.fn(async () => [
      { id: 'p1', metadata: { localizedNames: { en: ['Spa Day'] } } },
    ]),
  };

  const deps = () => ({
    businessRepo,
    serviceRepo,
    categoryRepo,
    packageRepo,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      locale: 'en',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it('enables Armenian and Russian', async () => {
    const result = await handleConfigureBusinessLanguagesLogic(
      deps(),
      'biz-1',
      {},
      'Enable Armenian and Russian',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_business_languages');
    expect(result.details?.enabledLocales).toEqual(['en', 'hy', 'ru']);
    expect(result.details?.defaultLocale).toBe('en');
    expect(result.summary).toContain('Armenian');
    expect(result.summary).toContain('Russian');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('disables Russian and moves default when needed', async () => {
    business.settings = {
      enabledLocales: ['en', 'hy', 'ru'],
      defaultLocale: 'ru',
      locale: 'ru',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleConfigureBusinessLanguagesLogic(
      deps(),
      'biz-1',
      {},
      'Turn off Russian for our salon',
    );

    expect(result.success).toBe(true);
    expect(result.details?.enabledLocales).toEqual(['en', 'hy']);
    expect(result.details?.defaultLocale).toBe('en');
    expect(result.summary).toContain('Disabled');
  });

  it('sets default language to English', async () => {
    business.settings = {
      enabledLocales: ['hy', 'ru'],
      defaultLocale: 'hy',
      locale: 'hy',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleConfigureBusinessLanguagesLogic(
      deps(),
      'biz-1',
      {},
      'Set default language to English',
    );

    expect(result.success).toBe(true);
    expect(result.details?.enabledLocales).toEqual(['hy', 'ru', 'en']);
    expect(result.details?.defaultLocale).toBe('en');
    expect(result.summary).toContain('Default language: English');
  });

  it('explains booking page language menu for visitors (ai-cmd-lang-5)', async () => {
    business.settings = {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      locale: 'en',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainBookingLanguagesLogic(
      deps(),
      'biz-1',
      'ru',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_booking_languages');
    expect(result.details?.enabledLocales).toEqual(['en', 'hy']);
    expect(result.details?.defaultLocale).toBe('en');
    expect(result.details?.disabledLocales).toEqual(['ru']);
    expect(result.details?.resolvedVisitorLocale).toBe('en');
    expect(result.summary).toContain('booking page');
    expect(result.summary).toContain('Russian');
  });

  it('explains enabled locales, default locale, and disabled-locale catalog counts (ai-cmd-lang-2)', async () => {
    const result = await handleExplainBusinessLanguagesLogic(deps(), 'biz-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_languages');
    expect(result.details?.enabledLocales).toEqual(['en']);
    expect(result.details?.defaultLocale).toBe('en');
    expect(result.details?.servicesWithDisabledLocaleTranslations).toBe(1);
    expect(result.details?.categoriesWithDisabledLocaleTranslations).toBe(1);
    expect(result.details?.packagesWithDisabledLocaleTranslations).toBe(0);
    expect(result.details?.servicesByDisabledLocale).toEqual({ ru: 1 });
    expect(result.details?.categoriesByDisabledLocale).toEqual({ hy: 1, ru: 1 });
    expect(result.summary).toContain('Enabled languages');
    expect(result.summary).toContain('Default language');
    expect(result.summary).toContain('disabled locales');
  });

  it('previews bulk strip cleanup before confirmation (ai-cmd-lang-3)', async () => {
    business.settings = {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      locale: 'en',
      publicProfileLocales: { ru: { name: 'Салон' } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const preview = await handleBulkStripDisabledLocaleTranslationsLogic(
      deps(),
      'biz-1',
      {},
      'Strip translations for disabled locales from our catalog',
      false,
    );

    expect(preview.success).toBe(true);
    expect(preview.action).toBe('bulk_strip_disabled_locale_translations');
    expect(preview.details?.requiresExecutionConfirmation).toBe(true);
    expect(preview.details?.serviceCount).toBe(1);
    expect(preview.details?.categoryCount).toBe(1);
    expect(serviceRepo.save).not.toHaveBeenCalled();
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('strips disabled locale translations after confirmation (ai-cmd-lang-3)', async () => {
    business.settings = {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      locale: 'en',
      publicProfileLocales: { ru: { name: 'Салон' } },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleBulkStripDisabledLocaleTranslationsLogic(
      deps(),
      'biz-1',
      {},
      'Strip translations for disabled locales from our catalog',
      true,
    );

    expect(result.success).toBe(true);
    expect(result.details?.updatedServiceIds).toEqual(['s1']);
    expect(result.details?.updatedCategoryIds).toEqual(['c1']);
    expect(result.details?.publicProfileStripped).toBe(true);
    expect(serviceRepo.save).toHaveBeenCalled();
    expect(categoryRepo.save).toHaveBeenCalled();
    expect(businessRepo.save).toHaveBeenCalled();
    expect(result.summary).toContain('Removed disabled-locale translations');
  });

  it('rejects disabling the last enabled language', async () => {
    const result = await handleConfigureBusinessLanguagesLogic(
      deps(),
      'biz-1',
      {},
      'Turn off English language support',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('At least one language');
    expect(businessRepo.save).not.toHaveBeenCalled();
  });
});
