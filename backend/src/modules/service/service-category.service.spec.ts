import { NotFoundException } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service.js';

describe('ServiceCategoryService', () => {
  const categories: Array<Record<string, unknown>> = [];

  const categoryRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `cat-${categories.length + 1}`;
      const saved = {
        isActive: true,
        metadata: {},
        sortOrder: 0,
        ...value,
        id,
      };
      const idx = categories.findIndex((c) => c.id === id);
      if (idx >= 0) categories[idx] = saved;
      else categories.push(saved);
      return saved;
    }),
    find: jest.fn(
      async ({ where }: { where: { businessId: string; isActive: boolean } }) =>
        categories.filter(
          (c) =>
            c.businessId === where.businessId && c.isActive === where.isActive,
        ),
    ),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        categories.find(
          (c) => c.id === where.id && c.businessId === where.businessId,
        ) ?? null,
    ),
    update: jest.fn(),
  };

  const categoryService = new ServiceCategoryService(categoryRepo as any);

  beforeEach(() => {
    categories.length = 0;
    jest.clearAllMocks();
  });

  it('creates a category without localized names', async () => {
    const created = await categoryService.create('biz-1', {
      name: 'General',
    });

    expect(created.localizedNames).toBeUndefined();
    expect(created.metadata).toEqual({});
  });

  it('creates a category with localized names', async () => {
    const created = await categoryService.create('biz-1', {
      name: 'Hair care',
      sortOrder: 1,
      localizedNames: { en: ['Hair'], hy: ['Մազեր'] },
    });

    expect(created.localizedNames).toEqual({ en: ['Hair'], hy: ['Մազեր'] });
    expect(created.metadata).toMatchObject({
      localizedNames: { en: ['Hair'], hy: ['Մազեր'] },
    });
  });

  it('lists and finds categories with localized names', async () => {
    await categoryService.create('biz-1', {
      name: 'Nails',
      localizedNames: { ru: ['Ногти'] },
    });

    const list = await categoryService.findAll('biz-1');
    expect(list).toHaveLength(1);
    expect(list[0].localizedNames).toEqual({ ru: ['Ногти'] });

    const one = await categoryService.findOne(list[0].id, 'biz-1');
    expect(one.name).toBe('Nails');
  });

  it('throws when category is missing', async () => {
    await expect(
      categoryService.findOne('nope', 'biz-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates scalar fields without changing localized metadata', async () => {
    const created = await categoryService.create('biz-1', {
      name: 'Brows',
      localizedNames: { en: ['Brows'] },
    });

    const updated = await categoryService.update(created.id, 'biz-1', {
      sortOrder: 2,
    });

    expect(updated.sortOrder).toBe(2);
    expect(updated.localizedNames).toEqual({ en: ['Brows'] });
  });

  it('updates localized names and scalar fields', async () => {
    const created = await categoryService.create('biz-1', {
      name: 'Skin',
      localizedNames: { en: ['Skin care'] },
    });

    categories[0].metadata = null;
    const updated = await categoryService.update(created.id, 'biz-1', {
      name: 'Skincare',
      sortOrder: 5,
      localizedNames: { hy: ['Մաշկ'] },
    });

    expect(updated.name).toBe('Skincare');
    expect(updated.sortOrder).toBe(5);
    expect(updated.localizedNames).toEqual({ hy: ['Մաշկ'] });
  });

  it('throws when updating a missing category', async () => {
    await expect(
      categoryService.update('missing', 'biz-1', { name: 'Nope' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates a category', async () => {
    const created = await categoryService.create('biz-1', {
      name: 'Temp',
    });
    await categoryService.remove(created.id, 'biz-1');
    expect(categoryRepo.update).toHaveBeenCalledWith(
      { id: created.id, businessId: 'biz-1' },
      { isActive: false },
    );
  });
});
