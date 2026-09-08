import { PrepaymentMode } from './entities/service.entity.js';
import { ServiceService } from './service.service.js';

describe('Sprint 36 — service tax override integration', () => {
  const services: Array<Record<string, unknown>> = [];

  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = {
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        metadata: {},
        bufferMinutes: 0,
        currency: 'USD',
        ...value,
        id,
      };
      const idx = services.findIndex((s) => s.id === id);
      if (idx >= 0) services[idx] = saved;
      else services.push(saved);
      return saved;
    }),
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      const svc = services.find((s) => s.id === where.id);
      return svc ? { ...svc, category: null } : null;
    }),
    find: jest.fn(),
    update: jest.fn(),
  };

  const categoryRepo = { findOne: jest.fn() };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { stripeConnect: { chargesEnabled: true } },
    })),
  };
  const eventStore = { publish: jest.fn().mockResolvedValue(undefined) };
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(true),
  };

  const serviceService = new ServiceService(
    serviceRepo as never,
    categoryRepo as never,
    businessRepo as never,
    eventStore as never,
    stripeIntegrationService as never,
  
    undefined as never);

  beforeEach(() => {
    services.length = 0;
    jest.clearAllMocks();
  });

  it('persists taxRatePercent override on service create', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Medical consult',
      durationMinutes: 30,
      price: 80,
      taxRatePercent: 10,
    });

    expect(created.metadata).toMatchObject({ taxRatePercent: 10 });
    expect(created.taxRatePercent).toBe(10);
  });

  it('persists tax-exempt override (0%) on service create', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Exempt massage',
      durationMinutes: 60,
      price: 100,
      taxRatePercent: 0,
    });

    expect(created.metadata).toMatchObject({ taxRatePercent: 0 });
    expect(created.taxRatePercent).toBe(0);
  });

  it('inherits business default when taxRatePercent is omitted', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Haircut',
      durationMinutes: 30,
      price: 40,
    });

    expect(created.metadata).not.toHaveProperty('taxRatePercent');
    expect(created.taxRatePercent).toBeNull();
  });

  it('clears override when taxRatePercent is set to null on update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Facial',
      durationMinutes: 45,
      price: 70,
      taxRatePercent: 12,
    });

    const updated = await serviceService.update(created.id, {
      taxRatePercent: null,
    });

    expect(updated.metadata).not.toHaveProperty('taxRatePercent');
    expect(updated.taxRatePercent).toBeNull();
  });

  it('updates taxRatePercent override on service update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Spa',
      durationMinutes: 90,
      price: 150,
    });

    const updated = await serviceService.update(created.id, {
      taxRatePercent: 5,
    });

    expect(updated.metadata).toMatchObject({ taxRatePercent: 5 });
    expect(updated.taxRatePercent).toBe(5);
  });

  it('ignores invalid taxRatePercent values on create', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Invalid rate',
      durationMinutes: 20,
      price: 25,
      taxRatePercent: 'bad' as never,
    });

    expect(created.metadata).not.toHaveProperty('taxRatePercent');
    expect(created.taxRatePercent).toBeNull();
  });
});
