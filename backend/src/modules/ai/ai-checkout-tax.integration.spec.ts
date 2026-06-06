import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleExplainCheckoutTaxLogic } from './ai-business-tax.logic.js';
import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai checkout tax integration (ai-cmd-tax-5)', () => {
  const business: Business = {
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
  } as Business;

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
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_checkout_tax');

      const result = await handleExplainCheckoutTaxLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_checkout_tax');
      expect(result.summary).toContain('VAT');
    },
  );

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

    const result = await handleExplainCheckoutTaxLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.details?.inclusiveBadge).toBe('incl. 5% GST');
    expect(result.summary).toContain('incl.');
  });
});
