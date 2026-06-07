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
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai-business-tax.logic (ai-cmd-tax-1..3)', () => {
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
      name: 'Deep Tissue Massage',
      metadata: {},
    } as Service,
    {
      id: 'svc-3',
      businessId: 'biz-1',
      name: 'Medical Consultation',
      metadata: {},
    } as Service,
    {
      id: 'svc-4',
      businessId: 'biz-1',
      name: 'Spa Treatment Deluxe',
      metadata: {},
    } as Service,
    {
      id: 'svc-5',
      businessId: 'biz-1',
      name: 'Classic Facial',
      metadata: {},
    } as Service,
    {
      id: 'svc-6',
      businessId: 'biz-1',
      name: 'Dental Cleaning',
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

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive',
        taxNumber: 'GB123456789',
      },
    };
    services.forEach((service) => {
      service.metadata = {};
    });
    businessRepo.findOne.mockResolvedValue({ ...business });
    serviceRepo.find.mockResolvedValue(
      services.map((service) => ({ ...service })),
    );
  });

  it('enables 20% VAT', async () => {
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

    const result = await handleConfigureBusinessTaxLogic(
      deps(),
      'biz-1',
      {},
      'Enable 20% VAT',
    );
    expect(result.success).toBe(true);
    expect(result.details?.tax).toEqual(
      expect.objectContaining({ enabled: true, rate: 20, name: 'VAT' }),
    );
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('explains business tax with sample breakdown', async () => {
    const result = await handleExplainBusinessTaxLogic(
      deps(),
      'biz-1',
      {},
      EXPLAIN_BUSINESS_TAX_PROMPTS[3].prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_tax');
    expect(result.summary).toContain('VAT 20%');
    expect(result.summary).toContain('GB123456789');
    expect(result.summary).toContain('$100');
    expect(result.details?.exampleBreakdown).toEqual(
      expect.objectContaining({
        netAmount: 100,
        taxAmount: 20,
        grossAmount: 120,
      }),
    );
  });

  it('previews massage tax-exempt override before confirmation', async () => {
    const result = await handleSetServiceTaxRateLogic(
      deps(),
      'biz-1',
      {},
      'Make massage services tax-exempt',
      false,
    );
    expect(result.success).toBe(true);
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
    expect(result.details?.serviceCount).toBe(2);
    expect(serviceRepo.save).not.toHaveBeenCalled();
  });

  it('applies 10% tax to medical consultations when confirmed', async () => {
    const result = await handleSetServiceTaxRateLogic(
      deps(),
      'biz-1',
      {},
      'Apply 10% tax to medical consultations only',
      true,
    );
    expect(result.success).toBe(true);
    expect(result.details?.taxRatePercent).toBe(10);
    expect(result.details?.updatedServiceIds).toEqual(['svc-3']);
    expect(serviceRepo.save).toHaveBeenCalledWith({
      id: 'svc-3',
      metadata: { taxRatePercent: 10 },
    });
  });

  it.each(CONFIGURE_BUSINESS_TAX_PROMPTS)(
    'handles configure prompt $id',
    async ({ prompt }) => {
      const result = await handleConfigureBusinessTaxLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.action).toBe('configure_business_tax');
      expect(result.success).toBe(true);
    },
  );

  it.each(SET_SERVICE_TAX_RATE_PROMPTS)(
    'previews set service tax prompt $id',
    async ({ prompt }) => {
      const result = await handleSetServiceTaxRateLogic(
        deps(),
        'biz-1',
        {},
        prompt,
        false,
      );
      expect(result.action).toBe('set_service_tax_rate');
      expect(result.success).toBe(true);
    },
  );
});
