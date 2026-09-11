import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import type { ServiceCategory } from '../service/entities/service-category.entity.js';
import type { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleConfigureBusinessLanguagesLogic,
  handleExplainBusinessLanguagesLogic,
  handleBulkStripDisabledLocaleTranslationsLogic,
} from './ai-business-languages.logic.js';
import {
  BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS,
  CONFIGURE_BUSINESS_LANGUAGES_PROMPTS,
  EXPLAIN_BUSINESS_LANGUAGES_PROMPTS,
} from './ai-business-languages.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai business languages integration (ai-cmd-lang-1)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      locale: 'en',
    },
  });

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    save: jest.fn(async (item: Service) => item),
    find: jest.fn(async () => [
      makeService({
        id: 's1',
        metadata: { localizedNames: { en: ['Cut'], ru: ['Стрижка'] } },
      }),
    ]),
  };

  // Declared returns, not inferred: `async () => ({})` infers `Promise<{}>` and
  // `async () => []` infers `Promise<never[]>`, neither of which is the entity
  // these repositories deal in.
  const categoryRepo = {
    save: jest.fn(async (item: ServiceCategory) => item),
    find: jest.fn(async (): Promise<ServiceCategory[]> => []),
  };

  const packageRepo = {
    save: jest.fn(async (item: ServicePackage) => item),
    find: jest.fn(async (): Promise<ServicePackage[]> => []),
  };

  const deps = () => ({
    businessRepo,
    serviceRepo,
    categoryRepo,
    packageRepo,
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      locale: 'en',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_BUSINESS_LANGUAGES_PROMPTS)(
    'rescues and executes business language explain $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_business_languages');

      const result = await handleExplainBusinessLanguagesLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_business_languages');
      expect(result.details?.enabledLocales).toEqual(['en', 'hy']);
    },
  );

  it.each(BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS)(
    'rescues and previews bulk strip disabled locale translations $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('bulk_strip_disabled_locale_translations');

      const result = await handleBulkStripDisabledLocaleTranslationsLogic(
        deps(),
        'biz-1',
        {},
        prompt,
        false,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('bulk_strip_disabled_locale_translations');
    },
  );

  it.each(CONFIGURE_BUSINESS_LANGUAGES_PROMPTS)(
    'rescues and executes business language configuration $id',
    async ({ prompt, operation, locales }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_business_languages');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'configure_business_languages',
          params: { operation, locales: [...locales] },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.ok).toBe(true);

      const result = await handleConfigureBusinessLanguagesLogic(
        deps(),
        'biz-1',
        { operation, locales: [...locales] },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_business_languages');
    },
  );
});
