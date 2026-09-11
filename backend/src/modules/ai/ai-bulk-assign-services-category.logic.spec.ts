import { handleBulkAssignServicesCategoryLogic } from './ai-bulk-assign-services-category.logic.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';

describe('ai-bulk-assign-services-category.logic', () => {
  const services = [
    {
      id: 'svc-1',
      name: 'Haircut',
      isActive: true,
      categoryId: 'cat-old',
      category: { name: 'General' },
    },
    {
      id: 'svc-2',
      name: 'Hair Blowdry',
      isActive: true,
      categoryId: 'cat-old',
      category: { name: 'General' },
    },
    {
      id: 'svc-3',
      name: 'Massage',
      isActive: true,
      categoryId: 'cat-massage',
      category: { name: 'Massage' },
    },
  ];

  const categoryService = {
    findAll: jest.fn(async () => [
      makeService({ id: 'cat-hair', name: 'Hair' }),
      makeService({ id: 'cat-massage', name: 'Massage' }),
    ]),
  };

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const service = services.find((entry) => entry.id === id)!;
      return { ...service, ...dto, categoryId: dto.categoryId };
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('moves services matching a source hint', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Move all hair services under Hair category',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledTimes(2);
    expect(result.summary).toContain('Hair');
  });

  it('moves services from a source category', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Move all services from Massage category to Massage category',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).not.toHaveBeenCalled();
    expect(result.summary).toContain('already');
  });

  it('moves named services', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Move Haircut, Blowdry and Color under Hair category',
    );
    expect(result.success).toBe(true);
    expect(serviceService.update).toHaveBeenCalledTimes(2);
  });

  it('returns clarify when target category is missing', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      { sourceCategoryHint: 'hair' },
      services as any,
      'Move all hair services',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when category is not found', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Move all hair services under Missing category',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not found');
  });
});
