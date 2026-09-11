import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { handleExplainCheckoutTaxLogic } from './ai-business-tax.logic.js';
import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import { CHECKOUT_TAX_MULTILINGUAL_SCENARIOS } from './ai-checkout-tax-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai checkout tax integration (ai-cmd-tax-5 / ai-cmd-customer-4.20.1)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive',
        taxNumber: '',
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
    businessRepo.findOne.mockResolvedValue({ ...business });
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_CHECKOUT_TAX_PROMPTS)(
    'rescues explain checkout tax $id',
    async ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_checkout_tax');
      if (aspect) expect(rescued?.params?.aspect).toBe(aspect);

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_checkout_tax',
          params: aspect ? { aspect } : {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainCheckoutTaxLogic(
        deps(),
        'biz-1',
        aspect ? { aspect } : {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_checkout_tax');
      expect(result.summary).toContain('VAT');
    },
  );

  it.each(CHECKOUT_TAX_MULTILINGUAL_SCENARIOS)(
    'rescues multilingual checkout tax $id',
    ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_checkout_tax');
      expect(rescued?.params?.aspect).toBe(aspect);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('explains inclusive badge when tax model is inclusive', async () => {
    business.settings = {
      tax: {
        enabled: true,
        name: 'GST',
        rate: 5,
        model: 'inclusive',
        taxNumber: '',
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainCheckoutTaxLogic(
      deps(),
      'biz-1',
      { aspect: 'service_list' },
      'What does incl. VAT mean on the service cards?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.inclusiveBadge).toBe('incl. 5% GST');
    expect(result.summary).toContain('service catalog');
  });

  it('executes logic for exclusive checkout tax line on booking page', async () => {
    business.settings = {
      tax: {
        enabled: true,
        name: 'GST',
        rate: 5,
        model: 'exclusive',
        taxNumber: '',
      },
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleExplainCheckoutTaxLogic(
      deps(),
      'biz-1',
      { aspect: 'checkout' },
      'Why do I see a tax line on the booking page?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('payment summary');
    expect(result.summary).toContain('GST');
  });
});
