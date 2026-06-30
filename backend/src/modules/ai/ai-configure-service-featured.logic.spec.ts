import { handleConfigureServiceFeaturedLogic } from './ai-configure-service-featured.logic.js';

describe('ai-configure-service-featured.logic', () => {
  const services = [
    {
      id: 'svc-1',
      name: 'Haircut',
      isActive: true,
      category: { name: 'Hair' },
      metadata: {},
    },
    {
      id: 'svc-2',
      name: 'Blowdry',
      isActive: true,
      category: { name: 'Hair' },
      metadata: {},
    },
    {
      id: 'svc-3',
      name: 'Massage',
      isActive: true,
      category: { name: 'Massage' },
      metadata: {},
    },
  ];

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const service = services.find((entry) => entry.id === id)!;
      return { ...service, ...dto };
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks a service as featured', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Mark Haircut as a featured service',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-1',
      { isFeatured: true },
      undefined,
    );
  });

  it('sets premium tier on a service', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Set Haircut to premium tier',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-1',
      { serviceTier: 'premium' },
      undefined,
    );
  });

  it('updates multiple services', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Feature Haircut and Blowdry',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledTimes(2);
  });

  it('updates services in a category scope', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Mark all massage services as featured',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-3',
      { isFeatured: true },
      undefined,
    );
  });

  it('returns clarify when metadata is missing', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Configure featured metadata',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns clarify when service target is missing', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      { isFeatured: true },
      services as any,
      'Mark featured',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
