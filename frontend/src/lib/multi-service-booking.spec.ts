import { describe, expect, it, vi } from 'vitest';
import {
  buildMultiServicePickerHref,
  buildMultiServiceScheduleHref,
  findIncompatiblePairLabels,
  getDisabledMultiServiceIds,
  multiServiceCartErrors,
  resolvePathAfterRemovingService,
  serviceCategoryKey,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  UNCATEGORIZED_CATEGORY_KEY,
  parseMultiServiceIds,
  resolveMultiServiceSelection,
  uniqueMultiServiceIds,
  persistMultiServiceCart,
  readPersistedMultiServiceCart,
  resolveMultiServiceCartFromLocation,
} from './multi-service-booking';

describe('multi-service-booking', () => {
  const services = [
    { id: 'a', name: 'Haircut', durationMinutes: 30, bufferMinutes: 5, price: 40 },
    { id: 'b', name: 'Beard', durationMinutes: 20, bufferMinutes: 0, price: 25 },
  ];

  it('sums duration and price for cart', () => {
    expect(sumMultiServiceDuration(services, 5)).toBe(60);
    expect(sumMultiServiceDuration([services[0]], 5)).toBe(35);
    expect(sumMultiServicePrice(services)).toBe(65);
    expect(sumMultiServicePrice([{ price: 10.005 }, { price: 20.004 }])).toBe(30.01);
  });

  it('resolves service category keys', () => {
    expect(serviceCategoryKey({ category: { id: 'cat-1' } })).toBe('cat-1');
    expect(serviceCategoryKey({ category: null })).toBe(UNCATEGORIZED_CATEGORY_KEY);
  });

  it('flags incompatible pair labels and cart limit errors', () => {
    const warnings = findIncompatiblePairLabels(['a', 'b'], [['a', 'b']], {
      a: 'Haircut',
      b: 'Beard',
    });
    expect(warnings).toEqual(['Haircut cannot be combined with Beard']);
    expect(findIncompatiblePairLabels(['a', 'b'], [['a', 'b']], {})).toEqual([
      'a cannot be combined with b',
    ]);

    expect(
      multiServiceCartErrors({
        selectedIds: ['a', 'b'],
        settings: { enabled: true, maxServiceCount: 5, maxDurationMinutes: 120, schedulingMode: 'same_visit' },
        totalDurationMinutes: 50,
        incompatibleWarnings: warnings,
      }),
    ).toEqual(warnings);

    expect(
      multiServiceCartErrors({
        selectedIds: ['a', 'b', 'c'],
        settings: { enabled: true, maxServiceCount: 2, maxDurationMinutes: 60, schedulingMode: 'same_visit' },
        totalDurationMinutes: 70,
        incompatibleWarnings: warnings,
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining('at most 2'), expect.stringContaining('exceeds')]));
  });

  it('dedupes service ids from query strings', () => {
    expect(parseMultiServiceIds('a,b,a,c')).toEqual(['a', 'b', 'c']);
    expect(uniqueMultiServiceIds(['a', 'b', 'a'])).toEqual(['a', 'b']);
    expect(resolveMultiServiceSelection('a,b,b', [{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual([
      'a',
      'b',
    ]);
    expect(resolveMultiServiceSelection(null, [{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
  });

  it('persists and restores multi-service cart from session storage', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });

    persistMultiServiceCart('salon', ['a', 'b', 'a']);
    expect(readPersistedMultiServiceCart('salon')).toEqual(['a', 'b']);
    expect(
      resolveMultiServiceCartFromLocation('salon', null, [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ]),
    ).toEqual(['a', 'b']);
    expect(
      resolveMultiServiceCartFromLocation('salon', 'c', [{ id: 'a' }, { id: 'c' }]),
    ).toEqual(['c']);

    persistMultiServiceCart('salon', []);
    expect(readPersistedMultiServiceCart('salon')).toEqual([]);

    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
      removeItem: () => {},
    });
    expect(readPersistedMultiServiceCart('salon')).toEqual([]);

    vi.unstubAllGlobals();
  });

  it('disables incompatible services and categories for multi-select', () => {
    const catalog = [
      { id: 'a', category: { id: 'cat-hair' } },
      { id: 'b', category: { id: 'cat-hair' } },
      { id: 'c', category: { id: 'cat-nails' } },
      { id: 'd', category: null },
    ];

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['a'],
        settings: {
          incompatiblePairMode: 'service',
          incompatiblePairs: [['a', 'c']],
          incompatibleCategoryPairs: [],
        },
      }),
    ).toEqual(new Set(['c']));

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['a', 'c'],
        settings: {
          incompatiblePairMode: 'service',
          incompatiblePairs: [['a', 'c']],
          incompatibleCategoryPairs: [],
        },
      }),
    ).toEqual(new Set());

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['a'],
        settings: {
          incompatiblePairMode: 'category',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [['cat-hair', 'cat-nails']],
        },
      }),
    ).toEqual(new Set(['c']));

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['d'],
        settings: {
          incompatiblePairMode: 'category',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [[UNCATEGORIZED_CATEGORY_KEY, 'cat-hair']],
        },
      }),
    ).toEqual(new Set(['a', 'b']));
  });

  it('builds picker, schedule, and remove navigation paths', () => {
    expect(buildMultiServicePickerHref('salon', ['a', 'b'])).toBe('/book/salon/any?services=a%2Cb');
    expect(buildMultiServiceScheduleHref('salon', ['a', 'b'])).toBe(
      '/book/salon/multi/availability?services=a%2Cb',
    );
    expect(buildMultiServiceScheduleHref('salon', ['a', 'b'], 'per_service')).toBe(
      '/book/salon/multi/confirm?services=a%2Cb',
    );
    expect(resolvePathAfterRemovingService('salon', ['a', 'b', 'c'], 'b')).toBe(
      '/book/salon/multi/availability?services=a%2Cc',
    );
    expect(resolvePathAfterRemovingService('salon', ['a', 'b'], 'b', 'per_service')).toBe(
      '/book/salon/any/availability?serviceId=a',
    );
    expect(resolvePathAfterRemovingService('salon', ['a', 'b'], 'b')).toBe(
      '/book/salon/any/availability?serviceId=a',
    );
    expect(resolvePathAfterRemovingService('salon', ['a'], 'a')).toBe('/book/salon/any');
  });

  it('handles missing catalog entries and empty incompatible lists', () => {
    expect(
      getDisabledMultiServiceIds({
        services: [],
        selectedIds: ['missing'],
        settings: {
          incompatiblePairMode: 'category',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [['cat-a', 'cat-b']],
        },
      }),
    ).toEqual(new Set());

    expect(
      getDisabledMultiServiceIds({
        services: [{ id: 'a' }],
        selectedIds: ['a'],
        settings: {
          incompatiblePairMode: 'service',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [],
        },
      }),
    ).toEqual(new Set());
  });
});
