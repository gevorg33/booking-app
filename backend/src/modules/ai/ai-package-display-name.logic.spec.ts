import { handleExplainPackageDisplayNameLogic } from './ai-package-localized-names.logic.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai-package-display-name.logic (ai-cmd-lang-7)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      enabledLocales: ['en', 'hy', 'ru'],
      defaultLocale: 'en',
      locale: 'en',
    },
  } as Business;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
  };

  const packagesService = {
    listPackages: jest.fn(async () => [
      {
        id: 'pkg-1',
        name: 'Spa Day',
        metadata: {
          localizedNames: { en: ['Spa Day'], hy: ['Սպա օր'], ru: ['Спа день'] },
        },
      },
      {
        id: 'pkg-2',
        name: 'Wellness',
        metadata: {},
      },
      {
        id: 'pkg-3',
        name: 'Bridal',
        metadata: { localizedNames: { ru: ['Свадьба'] } },
      },
    ]),
    updatePackage: jest.fn(),
  };

  const deps = () => ({ businessRepo, packagesService });

  it('returns localized Armenian display name for Spa Day', async () => {
    const result = await handleExplainPackageDisplayNameLogic(
      deps(),
      'biz-1',
      {},
      'What is the Armenian name for the Spa Day package on this page?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_package_display_name');
    expect(result.details?.displayedName).toBe('Սպա օր');
    expect(result.details?.usedFallback).toBe(false);
    expect(result.summary).toContain('Սպա օր');
  });

  it('falls back to primary name when locale translation is missing', async () => {
    const result = await handleExplainPackageDisplayNameLogic(
      deps(),
      'biz-1',
      { packageName: 'Wellness', locale: 'en' },
      'On public booking, what display name do English visitors get for Wellness package?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.displayedName).toBe('Wellness');
    expect(result.details?.usedFallback).toBe(true);
    expect(result.summary).toContain('primary catalog name');
  });

  it('uses session visitor locale when prompt omits locale', async () => {
    const result = await handleExplainPackageDisplayNameLogic(
      deps(),
      'biz-1',
      { packageName: 'Bridal' },
      'What title does the Bridal package show here?',
      'ru',
    );
    expect(result.success).toBe(true);
    expect(result.details?.displayLocale).toBe('ru');
    expect(result.details?.displayedName).toBe('Свадьба');
  });
});
