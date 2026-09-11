import { ServicePackagesService } from './service-packages.service.js';

describe('Sprint 28 — service packages currency integration', () => {
  const packageRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { currency: 'AMD' },
    })),
  };

  const service = new ServicePackagesService(
    packageRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    businessRepo as never,
  
    undefined as never);

  const basePackage = {
    id: 'pkg-1',
    businessId: 'biz-1',
    name: 'Spa day',
    discountType: 'percent',
    discountValue: 10,
    isActive: true,
    expiresAt: null,
    items: [
      {
        serviceId: 'svc-1',
        quantity: 1,
        service: {
          id: 'svc-1',
          name: 'Massage',
          price: 80,
          durationMinutes: 60,
          bufferMinutes: 0,
          currency: 'USD',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      id: 'explicit-service-usd',
      serviceCurrency: 'USD',
      businessCurrency: 'AMD',
      expected: 'USD',
    },
    {
      id: 'missing-service-amd-default',
      serviceCurrency: null,
      businessCurrency: 'AMD',
      expected: 'AMD',
    },
    {
      id: 'invalid-service-gel-default',
      serviceCurrency: 'BOGUS',
      businessCurrency: 'GEL',
      expected: 'GEL',
    },
  ])(
    'previewPackagePricing resolves $id',
    async ({ serviceCurrency, businessCurrency, expected }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { currency: businessCurrency },
      });
      packageRepo.findOne.mockResolvedValue({
        ...basePackage,
        items: [
          {
            ...basePackage.items[0],
            service: {
              ...basePackage.items[0].service,
              currency: serviceCurrency,
            },
          },
        ],
      });

      const preview = await service.previewPackagePricing('biz-1', 'pkg-1');
      expect(preview.currency).toBe(expected);
    },
  );

  it('mapPublicPackage uses business default when service currency missing', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'RUB' },
    });
    packageRepo.find.mockResolvedValue([
      {
        ...basePackage,
        items: [
          {
            ...basePackage.items[0],
            service: { ...basePackage.items[0].service, currency: null },
          },
        ],
      },
    ]);

    const [mapped] = await service.listPublicPackages('biz-1');
    expect(mapped.currency).toBe('RUB');
  });
});
