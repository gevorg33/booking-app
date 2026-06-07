import { handleConfigurePackageLocalizedNamesLogic } from './ai-package-localized-names.logic.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai-package-localized-names.logic (ai-cmd-lang-6)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      enabledLocales: ['en', 'hy'],
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
        metadata: { localizedNames: { en: ['Spa Day'] } },
      },
      {
        id: 'pkg-2',
        name: 'Wellness',
        metadata: {},
      },
    ]),
    updatePackage: jest.fn(
      async (_businessId: string, packageId: string, dto) => {
        const pkg =
          packageId === 'pkg-1'
            ? {
                id: 'pkg-1',
                name: 'Spa Day',
                metadata: { localizedNames: dto.localizedNames ?? {} },
              }
            : {
                id: 'pkg-2',
                name: 'Wellness',
                metadata: { localizedNames: dto.localizedNames ?? {} },
              };
        return pkg;
      },
    ),
  };

  const deps = () => ({ businessRepo, packagesService });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      locale: 'en',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it('sets Armenian localized display name for a package', async () => {
    const result = await handleConfigurePackageLocalizedNamesLogic(
      deps(),
      'biz-1',
      {},
      'Add Armenian name «Սպա օր» for Spa Day package',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_package_localized_names');
    expect(packagesService.updatePackage).toHaveBeenCalledWith(
      'biz-1',
      'pkg-1',
      expect.objectContaining({
        localizedNames: expect.objectContaining({
          en: ['Spa Day'],
          hy: ['Սպա օր'],
        }),
      }),
    );
    expect(result.summary).toContain('Armenian');
    expect(result.summary).toContain('Սպա օր');
  });

  it('clears a locale-specific localized name', async () => {
    const result = await handleConfigurePackageLocalizedNamesLogic(
      deps(),
      'biz-1',
      {},
      'Clear Armenian localized name for Spa Day package',
    );

    expect(result.success).toBe(true);
    expect(packagesService.updatePackage).toHaveBeenCalledWith(
      'biz-1',
      'pkg-1',
      { localizedNames: { en: ['Spa Day'] } },
    );
  });

  it('clears all localized names when requested', async () => {
    const result = await handleConfigurePackageLocalizedNamesLogic(
      deps(),
      'biz-1',
      {},
      'Remove all localized names from Spa Day package',
    );

    expect(result.success).toBe(true);
    expect(packagesService.updatePackage).toHaveBeenCalledWith(
      'biz-1',
      'pkg-1',
      { localizedNames: {} },
    );
  });

  it('rejects locales that are not enabled for the business', async () => {
    const result = await handleConfigurePackageLocalizedNamesLogic(
      deps(),
      'biz-1',
      {},
      'Set Russian display name for Wellness package to Спа день',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not enabled');
    expect(packagesService.updatePackage).not.toHaveBeenCalled();
  });

  it('asks for clarification when package and locale are missing', async () => {
    const result = await handleConfigurePackageLocalizedNamesLogic(
      deps(),
      'biz-1',
      {},
      'Add Armenian name for package',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
