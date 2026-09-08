import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleConfigureStackedTaxRulesLogic,
  handleExplainStackedTaxLogic,
} from './ai-business-tax.logic.js';
import {
  CONFIGURE_STACKED_TAX_RULES_PROMPTS,
  EXPLAIN_STACKED_TAX_PROMPTS,
} from './ai-stacked-tax.fixtures.js';
import { parseConfigureStackedTaxRulesFromPrompt } from './ai-stacked-tax.util.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai stacked tax integration (ai-cmd-tax-6..7)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      tax: {
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [
          { id: 'gst', name: 'GST', rate: 5 },
          { id: 'pst', name: 'PST', rate: 8 },
        ],
      },
    },
  });

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    find: jest.fn(async () => [] as Service[]),
    save: jest.fn(async (service: Service) => service),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
  };

  const deps = () => ({ businessRepo, serviceRepo, bookingRepo });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      tax: {
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [
          { id: 'gst', name: 'GST', rate: 5 },
          { id: 'pst', name: 'PST', rate: 8 },
        ],
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(
    CONFIGURE_STACKED_TAX_RULES_PROMPTS.filter(
      (entry) =>
        !('clarify' in entry && entry.clarify) && entry.operation !== 'remove',
    ),
  )('rescues and validates configure stacked tax $id', async ({ prompt }) => {
    const parsed = parseConfigureStackedTaxRulesFromPrompt(prompt);
    expect(parsed).not.toBeNull();

    const rescued = rescue.rescue({
      prompt,
      action: 'unknown',
      params: {},
    });
    expect(rescued?.action).toBe('configure_stacked_tax_rules');

    const validation = validateCommand(makeResolvedCommand({
      action: 'configure_stacked_tax_rules',
      params: parsed ?? {},
      enrichedParams: {},
      entities: { employees: [], services: [] },
      reasoning: 'test',
      prompt,
    }));
    expect(validation.ok).toBe(true);

    const result = await handleConfigureStackedTaxRulesLogic(
      deps(),
      'biz-1',
      parsed ?? {},
      prompt,
    );
    expect(result.success).toBe(true);
  });

  it('clarifies when stacked tax rates are missing', async () => {
    const prompt = 'Stack federal and state sales tax';
    const parsed = parseConfigureStackedTaxRulesFromPrompt(prompt);
    expect(parsed).toEqual({ operation: 'add', rules: [] });

    const result = await handleConfigureStackedTaxRulesLogic(
      deps(),
      'biz-1',
      parsed ?? {},
      prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('removes a stacked tax rule by name', async () => {
    const prompt = 'Delete the PST tax rule';
    const result = await handleConfigureStackedTaxRulesLogic(
      deps(),
      'biz-1',
      parseConfigureStackedTaxRulesFromPrompt(prompt) ?? {},
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.tax).toEqual(
      expect.objectContaining({
        rate: 5,
        rules: [{ id: 'gst', name: 'GST', rate: 5 }],
      }),
    );
  });

  it('fails when removing a rule that does not exist', async () => {
    const prompt = 'Remove the state tax rule';
    const result = await handleConfigureStackedTaxRulesLogic(
      deps(),
      'biz-1',
      parseConfigureStackedTaxRulesFromPrompt(prompt) ?? {},
      prompt,
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('No stacked tax rule matched');
  });

  it('adds GST and PST stacked rules from scratch', async () => {
    business.settings = {
      tax: {
        enabled: false,
        name: 'VAT',
        rate: 0,
        model: 'exclusive',
        taxNumber: '',
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const prompt = 'Add 5% GST and 8% PST';
    const result = await handleConfigureStackedTaxRulesLogic(
      deps(),
      'biz-1',
      parseConfigureStackedTaxRulesFromPrompt(prompt) ?? {},
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.tax).toEqual(
      expect.objectContaining({
        enabled: true,
        rate: 13,
        rules: [
          { id: 'gst', name: 'GST', rate: 5 },
          { id: 'pst', name: 'PST', rate: 8 },
        ],
      }),
    );
  });

  it.each(EXPLAIN_STACKED_TAX_PROMPTS)(
    'rescues and explains stacked tax $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_stacked_tax');

      const result = await handleExplainStackedTaxLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_stacked_tax');
      expect(result.details?.hasStackedRules).toBe(true);
      expect(result.details?.effectiveRate).toBe(13);
    },
  );

  it('explains when no stacked rules are configured', async () => {
    business.settings = {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'inclusive',
        taxNumber: '',
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainStackedTaxLogic(
      deps(),
      'biz-1',
      {},
      'Explain our stacked tax rules',
    );
    expect(result.success).toBe(true);
    expect(result.details?.hasStackedRules).toBe(false);
    expect(result.summary).toContain('No stacked tax rules');
  });
});
