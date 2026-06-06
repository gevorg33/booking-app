import { AiIntentRescueService } from './ai-intent-rescue.service.js';
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

describe('ai business languages integration (ai-cmd-lang-1)', () => {
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
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    save: jest.fn(async (item: Service) => item),
    find: jest.fn(async () => [
      {
        id: 's1',
        metadata: { localizedNames: { en: ['Cut'], ru: ['Стрижка'] } },
      },
    ]),
  };

  const categoryRepo = {
    save: jest.fn(async () => ({})),
    find: jest.fn(async () => []),
  };

  const packageRepo = {
    save: jest.fn(async () => ({})),
    find: jest.fn(async () => []),
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

      const validation = validateCommand({
        action: 'configure_business_languages',
        params: { operation, locales: [...locales] },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
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
