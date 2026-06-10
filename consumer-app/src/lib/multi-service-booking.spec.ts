import { describe, expect, it, vi } from 'vitest';
import {
  buildMultiServiceAvailabilityPath,
  buildMultiServiceCheckoutPath,
  buildMultiServiceConfirmPath,
  buildMultiServicePickerPath,
  buildMultiServiceSchedulePath,
  findIncompatiblePairLabels,
  getDisabledMultiServiceIds,
  multiServiceCartErrors,
  parseMultiServiceIds,
  persistMultiServiceCart,
  readPersistedMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  resolveMultiServiceSelection,
  resolvePathAfterRemovingService,
  serviceCategoryKey,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  UNCATEGORIZED_CATEGORY_KEY,
  uniqueMultiServiceIds,
} from './multi-service-booking.js';

describe('multi-service-booking', () => {
  const services = [
    { id: 'a', name: 'Haircut', durationMinutes: 30, bufferMinutes: 5, price: 40 },
    { id: 'b', name: 'Beard', durationMinutes: 20, bufferMinutes: 0, price: 25 },
  ];

  it('sums duration and price for cart', () => {
    expect(sumMultiServiceDuration(services, 5)).toBe(60);
    expect(sumMultiServicePrice(services)).toBe(65);
  });

  it('dedupes service ids from query strings', () => {
    expect(parseMultiServiceIds('a,b,a,c')).toEqual(['a', 'b', 'c']);
    expect(uniqueMultiServiceIds(['a', 'b', 'a'])).toEqual(['a', 'b']);
    expect(resolveMultiServiceSelection('a,b,b', [{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
  });

  it('persists and restores multi-service cart from session storage', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    persistMultiServiceCart('salon', ['a', 'b', 'a']);
    expect(readPersistedMultiServiceCart('salon')).toEqual(['a', 'b']);
    expect(
      resolveMultiServiceCartFromLocation('salon', null, [{ id: 'a' }, { id: 'b' }]),
    ).toEqual(['a', 'b']);

    vi.unstubAllGlobals();
  });

  it('builds consumer navigation paths', () => {
    expect(buildMultiServicePickerPath('salon', ['a', 'b'])).toBe(
      '/s/salon/book/any?services=a%2Cb',
    );
    expect(buildMultiServiceSchedulePath('salon', ['a', 'b'])).toBe(
      '/s/salon/book/multi/availability?services=a%2Cb',
    );
    expect(buildMultiServiceSchedulePath('salon', ['a', 'b'], 'per_service')).toBe(
      '/s/salon/book/multi/confirm?services=a%2Cb',
    );
    expect(buildMultiServiceCheckoutPath('salon', { services: 'a,b', startTime: 't1' })).toBe(
      '/s/salon/book/multi/checkout?services=a%2Cb&startTime=t1',
    );
    expect(resolvePathAfterRemovingService('salon', ['a', 'b'], 'b')).toBe(
      '/s/salon/book/a',
    );
    expect(resolvePathAfterRemovingService('salon', ['a', 'b', 'c'], 'b')).toBe(
      '/s/salon/book/multi/availability?services=a%2Cc',
    );
    expect(buildMultiServiceAvailabilityPath('salon', ['a', 'b'])).toBe(
      '/s/salon/book/multi/availability?services=a%2Cb',
    );
    expect(buildMultiServiceConfirmPath('salon', ['a', 'b'])).toBe(
      '/s/salon/book/multi/confirm?services=a%2Cb',
    );
  });

  it('flags incompatible pair labels and cart limit errors', () => {
    const warnings = findIncompatiblePairLabels(['a', 'b'], [['a', 'b']], {
      a: 'Haircut',
      b: 'Beard',
    });
    expect(warnings).toHaveLength(1);
    expect(
      multiServiceCartErrors({
        selectedIds: ['a', 'b', 'c'],
        settings: {
          enabled: true,
          maxServiceCount: 2,
          maxDurationMinutes: 60,
          schedulingMode: 'same_visit',
        },
        totalDurationMinutes: 70,
        incompatibleWarnings: warnings,
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining('at most 2')]));
  });

  it('resolves service category keys', () => {
    expect(serviceCategoryKey({ category: { id: 'cat-1' } })).toBe('cat-1');
    expect(serviceCategoryKey({ category: null })).toBe(UNCATEGORIZED_CATEGORY_KEY);
  });

  it('disables incompatible services for multi-select', () => {
    expect(
      getDisabledMultiServiceIds({
        services: [
          { id: 'a', category: { id: 'cat-hair' } },
          { id: 'c', category: { id: 'cat-nails' } },
        ],
        selectedIds: ['a'],
        settings: {
          incompatiblePairMode: 'service',
          incompatiblePairs: [['a', 'c']],
          incompatibleCategoryPairs: [],
          maxServiceCount: 5,
          maxDurationMinutes: 600,
          turnoverBufferMinutes: 5,
        },
      }),
    ).toEqual(new Set(['c']));
  });

  it('disables extra services when max service count is reached', () => {
    expect(
      getDisabledMultiServiceIds({
        services: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }],
        selectedIds: ['a', 'b', 'c', 'd', 'e'],
        settings: {
          incompatiblePairMode: 'service',
          incompatiblePairs: [],
          incompatibleCategoryPairs: [],
          maxServiceCount: 5,
          maxDurationMinutes: 600,
          turnoverBufferMinutes: 5,
        },
      }),
    ).toEqual(new Set(['f']));
  });

  it('disables services that would exceed max total duration', () => {
    const catalog = [
      { id: 'a', durationMinutes: 60, bufferMinutes: 0 },
      { id: 'b', durationMinutes: 60, bufferMinutes: 0 },
      { id: 'c', durationMinutes: 60, bufferMinutes: 0 },
      { id: 'd', durationMinutes: 60, bufferMinutes: 0 },
    ];
    const settings = {
      incompatiblePairMode: 'service' as const,
      incompatiblePairs: [] as Array<[string, string]>,
      incompatibleCategoryPairs: [] as Array<[string, string]>,
      maxServiceCount: 5,
      maxDurationMinutes: 180,
      turnoverBufferMinutes: 5,
    };

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['a', 'b', 'c'],
        settings,
      }),
    ).toEqual(new Set(['d']));

    expect(
      getDisabledMultiServiceIds({
        services: catalog,
        selectedIds: ['a', 'b'],
        settings: { ...settings, maxDurationMinutes: 130 },
      }),
    ).toEqual(new Set(['c', 'd']));
  });
});
