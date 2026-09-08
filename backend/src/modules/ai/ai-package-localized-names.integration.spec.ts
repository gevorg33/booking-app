import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { handleConfigurePackageLocalizedNamesLogic } from './ai-package-localized-names.logic.js';
import { CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS } from './ai-package-localized-names.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai package localized names integration (ai-cmd-lang-6)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      enabledLocales: ['en', 'hy', 'ru'],
      defaultLocale: 'en',
      locale: 'en',
    },
  });

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
      {
        id: 'pkg-3',
        name: 'Bridal',
        metadata: { localizedNames: { ru: ['Свадьба'] } },
      },
    ]),
    updatePackage: jest.fn(
      async (_businessId: string, packageId: string, dto) => {
        const base = [
          { id: 'pkg-1', name: 'Spa Day' },
          { id: 'pkg-2', name: 'Wellness' },
          { id: 'pkg-3', name: 'Bridal' },
        ].find((item) => item.id === packageId);
        return {
          ...base,
          metadata: { localizedNames: dto.localizedNames ?? {} },
        };
      },
    ),
  };

  const deps = () => ({ businessRepo, packagesService });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each(CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS)(
    'rescues and executes configure package localized names $id',
    async ({ prompt, operation, packageName, locale, displayName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_package_localized_names');

      const validation = validateCommand(makeResolvedCommand({
        action: 'configure_package_localized_names',
        params: {
          operation,
          packageName,
          ...(locale ? { locale } : {}),
          ...(displayName ? { displayName } : {}),
        },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleConfigurePackageLocalizedNamesLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_package_localized_names');
      expect(packagesService.updatePackage).toHaveBeenCalled();
    },
  );
});
