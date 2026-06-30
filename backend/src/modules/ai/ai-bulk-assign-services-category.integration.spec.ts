import { BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS } from './ai-bulk-assign-services-category.fixtures.js';
import { handleBulkAssignServicesCategoryLogic } from './ai-bulk-assign-services-category.logic.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';

describe('bulk_assign_services_category AI scenarios', () => {
  const services = [
    {
      id: 'svc-haircut',
      name: 'Haircut',
      isActive: true,
      categoryId: 'cat-general',
      category: { name: 'General' },
    },
  ];

  const categoryService = {
    findAll: jest.fn(async () => [{ id: 'cat-hair', name: 'Hair' }]),
  };

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => ({
      id,
      name: 'Haircut',
      categoryId: dto.categoryId,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via catalog rescue',
    ({ prompt }) => {
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        'bulk_assign_services_category',
      );
    },
  );

  it('disambiguates bulk assign from single update_service', () => {
    expect(
      rescueCatalogIntent('Move all hair services under Hair category', 'unknown')
        ?.action,
    ).toBe('bulk_assign_services_category');
    expect(
      rescueCatalogIntent(
        'move Neck Massage under service category: Massage',
        'unknown',
      )?.action,
    ).toBe('update_service');
  });

  it('executes bulk_assign_services_category handler', async () => {
    const result = await handleBulkAssignServicesCategoryLogic(
      { categoryService, serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Move all hair services under Hair category',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('bulk_assign_services_category');
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-haircut',
      { categoryId: 'cat-hair' },
      undefined,
    );
  });
});
