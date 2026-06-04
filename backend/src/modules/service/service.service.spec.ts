import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrepaymentMode } from './entities/service.entity.js';
import { ServiceService } from './service.service.js';
import { EventType } from '../../events/event-types.js';

describe('ServiceService', () => {
  const services: Array<Record<string, unknown>> = [];
  const categories: Array<Record<string, unknown>> = [];

  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = { isActive: true, prepaymentMode: PrepaymentMode.NONE, metadata: {}, ...value, id };
      const idx = services.findIndex((s) => s.id === id);
      if (idx >= 0) services[idx] = saved;
      else services.push(saved);
      return saved;
    }),
    find: jest.fn(async ({ where }: { where: { businessId: string; isActive: boolean } }) =>
      services
        .filter((s) => s.businessId === where.businessId && s.isActive === where.isActive)
        .map((s) => ({
          ...s,
          category: categories.find((c) => c.id === s.categoryId) ?? null,
        })),
    ),
    findOne: jest.fn(
      async ({
        where,
        relations,
      }: {
        where: Record<string, unknown>;
        relations?: { category?: boolean };
      }) => {
        if (!where.id) return null;
        const svc = services.find((s) => s.id === where.id);
        if (!svc) return null;
        return {
          ...svc,
          category:
            relations?.category
              ? categories.find((c) => c.id === svc.categoryId) ?? null
              : undefined,
        };
      },
    ),
    update: jest.fn(),
  };

  const categoryRepo = {
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
      categories.find(
        (c) =>
          c.id === where.id &&
          c.businessId === where.businessId &&
          c.isActive === where.isActive,
      ) ?? null,
    ),
  };

  const businessRepo = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      where.id === 'biz-1'
        ? { id: 'biz-1', settings: { stripeConnect: { chargesEnabled: true } } }
        : null,
    ),
  };

  const eventStore = { publish: jest.fn().mockResolvedValue(undefined) };
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(true),
  };

  const serviceService = new ServiceService(
    serviceRepo as any,
    categoryRepo as any,
    businessRepo as any,
    eventStore as any,
    stripeIntegrationService as any,
  );

  beforeEach(() => {
    services.length = 0;
    categories.length = 0;
    jest.clearAllMocks();
    stripeIntegrationService.isConnectReady.mockReturnValue(true);
    categories.push({
      id: 'cat-1',
      businessId: 'biz-1',
      name: 'Hair',
      sortOrder: 0,
      isActive: true,
      metadata: { localizedNames: { hy: ['Մազեր'] } },
    });
  });

  it('creates a service with localized names in metadata', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Haircut',
      durationMinutes: 30,
      price: 25,
      bufferMinutes: 5,
      currency: 'EUR',
      localizedNames: { en: ['Cut'], hy: ['Կտրում'] },
    } as any, 'user-1');

    expect(created.bufferMinutes).toBe(5);
    expect(created.currency).toBe('EUR');
    expect(created.localizedNames).toEqual({ en: ['Cut'], hy: ['Կտրում'] });
    expect(created.metadata).toMatchObject({
      localizedNames: { en: ['Cut'], hy: ['Կտրում'] },
    });
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: EventType.SERVICE_CREATED }),
    );
  });

  it('enriches services without a related category', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Solo',
      durationMinutes: 20,
      price: 10,
      bufferMinutes: 0,
    } as any);

    const one = await serviceService.findOne(created.id as string);
    expect(one.category).toBeNull();
    expect(one.localizedNames).toBeUndefined();
  });

  it('allows online prepayment when Stripe connect is ready', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Deposit service',
      durationMinutes: 30,
      price: 50,
      prepaymentMode: PrepaymentMode.DEPOSIT,
      depositAmount: 10,
    } as any);

    expect(created.prepaymentMode).toBe(PrepaymentMode.DEPOSIT);
  });

  it('creates a service without localized names', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Trim',
      durationMinutes: 20,
      price: 15,
    } as any);

    expect(created.localizedNames).toBeUndefined();
    expect(created.metadata).toEqual({});
  });

  it('rejects invalid category on create', async () => {
    await expect(
      serviceService.create('biz-1', {
        name: 'X',
        durationMinutes: 30,
        price: 10,
        categoryId: 'missing',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects online prepayment when Stripe is not ready', async () => {
    stripeIntegrationService.isConnectReady.mockReturnValue(false);
    await expect(
      serviceService.create('biz-1', {
        name: 'Paid',
        durationMinutes: 30,
        price: 40,
        prepaymentMode: PrepaymentMode.FULL,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects online prepayment when business record is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      serviceService.create('biz-missing', {
        name: 'Paid',
        durationMinutes: 30,
        price: 40,
        prepaymentMode: PrepaymentMode.FULL,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists services with enriched category localized names', async () => {
    await serviceService.create('biz-1', {
      name: 'Color',
      durationMinutes: 60,
      price: 80,
      categoryId: 'cat-1',
    } as any);

    const list = await serviceService.findAll('biz-1');
    expect(list).toHaveLength(1);
    expect(list[0].category?.localizedNames).toEqual({ hy: ['Մազեր'] });
  });

  it('findOne throws when service is missing', async () => {
    await expect(serviceService.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates scalar fields without touching localized metadata', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Keep names',
      durationMinutes: 30,
      price: 20,
      localizedNames: { en: ['Label'] },
    } as any);

    const updated = await serviceService.update(created.id as string, {
      price: 25,
    } as any);

    expect(updated.price).toBe(25);
    expect(updated.localizedNames).toEqual({ en: ['Label'] });
  });

  it('updates localized names and clears them', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Spa',
      durationMinutes: 45,
      price: 90,
      localizedNames: { en: ['Relax'] },
    } as any);

    const updated = await serviceService.update(created.id as string, {
      localizedNames: { ru: ['Спа'] },
    } as any);
    expect(updated.localizedNames).toEqual({ ru: ['Спа'] });

    const cleared = await serviceService.update(created.id as string, {
      localizedNames: {},
    } as any);
    expect(cleared.localizedNames).toBeUndefined();
    expect(cleared.metadata?.localizedNames).toBeUndefined();

    services[0].metadata = null;
    const withNullMetadata = await serviceService.update(created.id as string, {
      localizedNames: { en: ['Again'] },
    } as any);
    expect(withNullMetadata.localizedNames).toEqual({ en: ['Again'] });
  });

  it('clears category when categoryId is null on update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Linked',
      durationMinutes: 30,
      price: 20,
      categoryId: 'cat-1',
    } as any);

    const updated = await serviceService.update(created.id as string, {
      categoryId: null,
    } as any);

    expect(updated.categoryId).toBeNull();
  });

  it('updates category assignment and scalar fields', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Blowout',
      durationMinutes: 40,
      price: 55,
    } as any);

    const updated = await serviceService.update(created.id as string, {
      name: 'Blowout Pro',
      categoryId: 'cat-1',
      isActive: true,
    } as any);

    expect(updated.name).toBe('Blowout Pro');
    expect(updated.categoryId).toBe('cat-1');
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: EventType.SERVICE_UPDATED }),
    );
  });

  it('soft-deletes a service', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Remove me',
      durationMinutes: 15,
      price: 10,
    } as any);

    await serviceService.remove(created.id as string);
    expect(serviceRepo.update).toHaveBeenCalledWith(created.id, { isActive: false });
  });
});
