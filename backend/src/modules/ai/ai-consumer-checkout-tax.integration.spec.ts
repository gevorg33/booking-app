import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS } from './ai-consumer-checkout-tax.fixtures.js';
import { EN_TAX_DISPLAY_EVAL_SCENARIOS } from './ai-tax-display-en.fixtures.js';
import { handleExplainConsumerCheckoutTaxLogic } from './ai-business-tax.logic.js';
import {
  AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES,
  AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai consumer checkout tax integration (ai-cmd-tax-14)', () => {
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
        model: 'inclusive',
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

  it.each(EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS)(
    'rescues explain_consumer_checkout_tax for $id',
    async ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_consumer_checkout_tax');
      if (aspect) expect(rescued?.params?.aspect).toBe(aspect);

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_consumer_checkout_tax',
          params: aspect ? { aspect } : {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(
    EN_TAX_DISPLAY_EVAL_SCENARIOS.filter(
      (scenario) => scenario.expectedAction === 'explain_consumer_checkout_tax',
    ),
  )('rescues consumer tax EN scenario $id', ({ prompt, aspect }) => {
    const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
    expect(rescued?.action).toBe('explain_consumer_checkout_tax');
    if (aspect) expect(rescued?.params?.aspect).toBe(aspect);
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES,
      ...AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES.filter((entry) =>
        entry.id.startsWith('tax-display-en-en-consumer'),
      ),
    ]) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic for service list incl. badge', async () => {
    const result = await handleExplainConsumerCheckoutTaxLogic(
      deps(),
      'biz-1',
      { aspect: 'service_list' },
      'What does incl. VAT mean on services in the salon app?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_consumer_checkout_tax');
    expect(result.summary).toContain('incl.');
    expect(result.details?.inclusiveBadge).toBe('incl. 20% VAT');
  });

  it('executes logic for exclusive checkout tax line', async () => {
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

    const result = await handleExplainConsumerCheckoutTaxLogic(
      deps(),
      'biz-1',
      { aspect: 'checkout' },
      'Why is there a tax line on checkout in the consumer app?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('payment summary');
    expect(result.summary).toContain('GST');
  });
});
