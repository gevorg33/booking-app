import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleConfigureBusinessTaxLogic,
  handleExplainBusinessTaxLogic,
  handleSetServiceTaxRateLogic,
} from './ai-business-tax.logic.js';
import {
  CONFIGURE_BUSINESS_TAX_PROMPTS,
  EXPLAIN_BUSINESS_TAX_PROMPTS,
  SET_SERVICE_TAX_RATE_PROMPTS,
} from './ai-business-tax.fixtures.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
} from './ai-business-tax.util.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai business tax integration (ai-cmd-tax-1..3)', () => {
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
        taxNumber: 'GB123456789',
      },
    },
  } as Business;

  const services: Service[] = [
    {
      id: 'svc-1',
      businessId: 'biz-1',
      name: 'Swedish Massage',
      metadata: {},
    } as Service,
    {
      id: 'svc-2',
      businessId: 'biz-1',
      name: 'Medical Consultation',
      metadata: {},
    } as Service,
    {
      id: 'svc-3',
      businessId: 'biz-1',
      name: 'Spa Treatment Deluxe',
      metadata: {},
    } as Service,
    {
      id: 'svc-4',
      businessId: 'biz-1',
      name: 'Classic Facial',
      metadata: {},
    } as Service,
    {
      id: 'svc-5',
      businessId: 'biz-1',
      name: 'Dental Cleaning',
      metadata: {},
    } as Service,
    {
      id: 'svc-6',
      businessId: 'biz-1',
      name: 'General Consultation',
      metadata: {},
    } as Service,
  ];

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const serviceRepo = {
    find: jest.fn(async () => services.map((service) => ({ ...service }))),
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
    services.forEach((service) => {
      service.metadata = {};
    });
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue(
      services.map((service) => ({ ...service })),
    );
    rescue = new AiIntentRescueService();
  });

  it.each(CONFIGURE_BUSINESS_TAX_PROMPTS)(
    'rescues and validates configure $id',
    async ({ prompt }) => {
      const parsed = parseBusinessTaxFromPrompt(prompt);
      expect(parsed).not.toBeNull();

      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_business_tax');

      const validation = validateCommand({
        action: 'configure_business_tax',
        params: parsed ?? {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.ok).toBe(true);

      const result = await handleConfigureBusinessTaxLogic(
        deps(),
        'biz-1',
        parsed ?? {},
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(SET_SERVICE_TAX_RATE_PROMPTS)(
    'rescues and validates set service tax $id',
    async ({ prompt, serviceQuery, taxRatePercent }) => {
      const parsed = parseSetServiceTaxRateFromPrompt(prompt);
      expect(parsed).toEqual({ serviceQuery, taxRatePercent });

      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('set_service_tax_rate');
      expect(rescued?.params).toEqual(
        expect.objectContaining({ serviceQuery, taxRatePercent }),
      );

      const validation = validateCommand({
        action: 'set_service_tax_rate',
        params: parsed ?? {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.ok).toBe(true);

      const preview = await handleSetServiceTaxRateLogic(
        deps(),
        'biz-1',
        parsed ?? {},
        prompt,
        false,
      );
      expect(preview.success).toBe(true);
      expect(preview.details?.requiresExecutionConfirmation).toBe(true);
    },
  );

  it.each(EXPLAIN_BUSINESS_TAX_PROMPTS)(
    'rescues explain business tax $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_business_tax');

      const result = await handleExplainBusinessTaxLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_business_tax');
    },
  );
});
