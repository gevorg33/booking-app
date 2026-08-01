import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServiceCategoryFilter } from '@/components/public-booking/service-category-filter';
import {
  SERVICE_CATEGORY_FILTER_ALL,
  SERVICE_CATEGORY_FILTER_UNCATEGORIZED,
  buildServiceCategoryFilterOptions,
  filterServicesByCategory,
  groupServicesByCategory,
  resolveServiceCategoryFilterId,
  type ServiceCategoryFilterOption,
} from './service-catalog-browse.util';
import type { PublicService } from './public-api';

function svc(
  partial: Partial<PublicService> & Pick<PublicService, 'id' | 'name'>,
): PublicService {
  return {
    durationMinutes: 30,
    bufferMinutes: 0,
    price: 40,
    currency: 'USD',
    ...partial,
  };
}

describe('service-catalog-browse.util (e2e-bug.208)', () => {
  const hair = svc({
    id: 's1',
    name: 'Hairdry',
    category: { id: 'cat-hair', name: 'Hair Care', sortOrder: 1 },
  });
  const face = svc({
    id: 's2',
    name: 'Face Pilling',
    category: { id: 'cat-face', name: 'Face Care', sortOrder: 2 },
  });
  const massage = svc({
    id: 's3',
    name: 'Swedish',
    category: { id: 'cat-massage', name: 'Massage', sortOrder: 0 },
  });
  const orphan = svc({ id: 's4', name: 'Misc add-on' });

  it('buildServiceCategoryFilterOptions: All + sorted categories + uncategorized', () => {
    const options = buildServiceCategoryFilterOptions(
      [hair, face, massage, orphan],
      'All',
      'Other services',
    );
    expect(options.map((o) => o.id)).toEqual([
      SERVICE_CATEGORY_FILTER_ALL,
      'cat-massage',
      'cat-hair',
      'cat-face',
      SERVICE_CATEGORY_FILTER_UNCATEGORIZED,
    ]);
    expect(options[0].name).toBe('All');
    expect(options.at(-1)?.name).toBe('Other services');
  });

  it('buildServiceCategoryFilterOptions: empty catalog still exposes All', () => {
    expect(buildServiceCategoryFilterOptions([], 'All', 'Other')).toEqual([
      { id: SERVICE_CATEGORY_FILTER_ALL, name: 'All', sortOrder: -1 },
    ]);
  });

  it('buildServiceCategoryFilterOptions: single category still includes All', () => {
    const options = buildServiceCategoryFilterOptions([hair], 'All', 'Other');
    expect(options).toHaveLength(2);
    expect(options[1].id).toBe('cat-hair');
  });

  it.each([
    {
      id: 'all',
      categoryId: SERVICE_CATEGORY_FILTER_ALL,
      expectedIds: ['s1', 's2', 's3', 's4'],
    },
    {
      id: 'hair',
      categoryId: 'cat-hair',
      expectedIds: ['s1'],
    },
    {
      id: 'uncategorized',
      categoryId: SERVICE_CATEGORY_FILTER_UNCATEGORIZED,
      expectedIds: ['s4'],
    },
    {
      id: 'unknown-empty',
      categoryId: 'missing-cat',
      expectedIds: [],
    },
  ])('filterServicesByCategory: $id', ({ categoryId, expectedIds }) => {
    const filtered = filterServicesByCategory(
      [hair, face, massage, orphan],
      categoryId,
    );
    expect(filtered.map((s) => s.id)).toEqual(expectedIds);
  });

  it('groupServicesByCategory: sorts by category sortOrder', () => {
    const groups = groupServicesByCategory(
      [hair, face, massage, orphan],
      'Other services',
    );
    expect(groups.map((g) => g.key)).toEqual([
      'cat-massage',
      'cat-hair',
      'cat-face',
      SERVICE_CATEGORY_FILTER_UNCATEGORIZED,
    ]);
    expect(groups.at(-1)?.categoryName).toBe('Other services');
  });

  it.each([
    { id: 'null', requested: null, expected: SERVICE_CATEGORY_FILTER_ALL },
    { id: 'empty', requested: '', expected: SERVICE_CATEGORY_FILTER_ALL },
    { id: 'valid', requested: 'cat-hair', expected: 'cat-hair' },
    {
      id: 'invalid',
      requested: 'nope',
      expected: SERVICE_CATEGORY_FILTER_ALL,
    },
  ])(
    'resolveServiceCategoryFilterId: $id',
    ({ requested, expected }) => {
      const options = buildServiceCategoryFilterOptions(
        [hair, face],
        'All',
        'Other',
      );
      expect(resolveServiceCategoryFilterId(requested, options)).toBe(expected);
    },
  );

  const filterOptions: ServiceCategoryFilterOption[] = [
    { id: SERVICE_CATEGORY_FILTER_ALL, name: 'All', sortOrder: -1 },
    { id: 'cat-hair', name: 'Hair Care', sortOrder: 1 },
    { id: 'cat-face', name: 'Face Care', sortOrder: 2 },
  ];

  it('ServiceCategoryFilter: hides when only All', () => {
    const html = renderToStaticMarkup(
      createElement(ServiceCategoryFilter, {
        options: [
          { id: SERVICE_CATEGORY_FILTER_ALL, name: 'All', sortOrder: -1 },
        ],
        value: SERVICE_CATEGORY_FILTER_ALL,
        onChange: () => undefined,
        primaryColor: '#111',
      }),
    );
    expect(html).toBe('');
  });

  it('ServiceCategoryFilter: renders All + category chips', () => {
    const html = renderToStaticMarkup(
      createElement(ServiceCategoryFilter, {
        options: filterOptions,
        value: SERVICE_CATEGORY_FILTER_ALL,
        onChange: () => undefined,
        primaryColor: '#7c3aed',
      }),
    );
    expect(html).toContain('data-testid="service-category-filter"');
    expect(html).toContain('data-testid="service-category-filter-all"');
    expect(html).toContain('Hair Care');
  });
});
