import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { handleExplainPackageDisplayNameLogic } from './ai-package-localized-names.logic.js';
import { EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS } from './ai-package-display-name.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';

describe('ai package display name integration (ai-cmd-lang-7)', () => {
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

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockImplementation(async () => ({ ...business }));
    packagesService.listPackages.mockImplementation(async () => [
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
    ]);
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS)(
    'rescues and executes explain package display name $id',
    async ({ prompt, packageName, locale }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_package_display_name');

      const validation = validateCommand({
        action: 'explain_package_display_name',
        params: {
          packageName,
          ...(locale ? { locale } : {}),
        },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainPackageDisplayNameLogic(
        deps(),
        'biz-1',
        {},
        prompt,
        locale,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_package_display_name');
      expect(result.details?.packageName).toBeTruthy();
    },
  );
});
