import {
  buildSequentialAppointments,
  calculateMultiServiceTotals,
  employeeQualifiesForServices,
  findIncompatibleCategoryPairs,
  findIncompatibleForSelection,
  findIncompatiblePairs,
  normalizeMultiServiceIds,
  resolveSelectedCategoryKeys,
  validateMultiServiceSelection,
  validatePerServiceLines,
} from './multi-service-booking.util.js';
import { DEFAULT_MULTI_SERVICE_SETTINGS } from './multi-service-settings.util.js';

const services = [
  {
    serviceId: 'haircut',
    durationMinutes: 30,
    bufferMinutes: 0,
    price: 40,
    currency: 'USD',
    name: 'Haircut',
    categoryId: 'cat-hair',
  },
  {
    serviceId: 'beard',
    durationMinutes: 20,
    bufferMinutes: 0,
    price: 25,
    currency: 'USD',
    name: 'Beard trim',
    categoryId: 'cat-hair',
  },
  {
    serviceId: 'color',
    durationMinutes: 90,
    bufferMinutes: 10,
    price: 120,
    currency: 'USD',
    name: 'Color',
    categoryId: 'cat-color',
  },
  {
    serviceId: 'massage',
    durationMinutes: 60,
    bufferMinutes: 0,
    price: 80,
    currency: 'USD',
    name: 'Massage',
    categoryId: 'cat-spa',
  },
];

describe('multi-service-booking.util', () => {
  it('dedupes service ids while preserving order', () => {
    expect(normalizeMultiServiceIds(['a', 'b', 'a', ' c ', ''])).toEqual(['a', 'b', 'c']);
  });

  it('calculates totals with turnover buffer between services', () => {
    const totals = calculateMultiServiceTotals(
      [services[0], services[1]],
      DEFAULT_MULTI_SERVICE_SETTINGS.turnoverBufferMinutes,
      'USD',
    );
    expect(totals.totalDurationMinutes).toBe(50);
    expect(totals.blockDurationMinutes).toBe(55);
    expect(totals.totalPrice).toBe(65);
    expect(calculateMultiServiceTotals([], 5, 'EUR').currency).toBe('EUR');
  });

  it('validates minimum count, duplicates, limits, and incompatible pairs', () => {
    const settings = {
      ...DEFAULT_MULTI_SERVICE_SETTINGS,
      enabled: true,
      maxServiceCount: 2,
      maxDurationMinutes: 60,
      incompatiblePairs: [['haircut', 'color']] as Array<[string, string]>,
    };

    expect(validateMultiServiceSelection(['haircut'], services, settings).valid).toBe(false);
    expect(
      validateMultiServiceSelection(['haircut', 'haircut'], services, settings).errors,
    ).toContain('Duplicate services are not allowed');
    expect(
      validateMultiServiceSelection(['haircut', 'beard', 'color'], services, settings).errors[0],
    ).toContain('at most 2 services');
    expect(
      validateMultiServiceSelection(['haircut', 'color'], services, settings).errors[0],
    ).toContain('cannot be booked together');
    expect(
      validateMultiServiceSelection(['haircut', 'beard'], services, settings).valid,
    ).toBe(true);
  });

  it('validates incompatible category pairs when mode is category', () => {
    const settings = {
      ...DEFAULT_MULTI_SERVICE_SETTINGS,
      enabled: true,
      maxServiceCount: 4,
      maxDurationMinutes: 300,
      incompatiblePairMode: 'category' as const,
      incompatibleCategoryPairs: [['cat-hair', 'cat-spa']] as Array<[string, string]>,
    };

    expect(
      validateMultiServiceSelection(['haircut', 'massage'], services, settings).errors[0],
    ).toContain('cannot be booked together');
    expect(
      validateMultiServiceSelection(['haircut', 'beard'], services, settings).valid,
    ).toBe(true);
    expect(
      findIncompatibleForSelection(['haircut', 'massage'], services, settings),
    ).toHaveLength(1);
    expect(resolveSelectedCategoryKeys(['haircut', 'beard'], services)).toEqual(['cat-hair']);
    expect(
      findIncompatibleCategoryPairs(['cat-hair', 'cat-spa'], [['cat-hair', 'cat-spa']]),
    ).toHaveLength(1);
  });

  it('resolves uncategorized services and service-mode incompatible pairs', () => {
    const uncategorized = {
      serviceId: 'walk-in',
      durationMinutes: 15,
      bufferMinutes: 0,
      price: 20,
      currency: 'USD',
      categoryId: null,
    };
    expect(resolveSelectedCategoryKeys(['walk-in'], [uncategorized])).toEqual(['__uncategorized__']);
    expect(
      findIncompatibleForSelection(
        ['haircut', 'color'],
        services,
        {
          incompatiblePairMode: 'service',
          incompatiblePairs: [['haircut', 'color']],
          incompatibleCategoryPairs: [],
        },
      ),
    ).toHaveLength(1);
    expect(
      findIncompatibleForSelection(['haircut', 'beard'], services, {
        incompatiblePairMode: 'service',
        incompatiblePairs: [],
        incompatibleCategoryPairs: [],
      }),
    ).toHaveLength(0);
  });

  it('flags unavailable services and duration over max', () => {
    const settings = { ...DEFAULT_MULTI_SERVICE_SETTINGS, enabled: true, maxDurationMinutes: 40 };
    const missing = validateMultiServiceSelection(['haircut', 'missing'], services, settings);
    expect(missing.errors).toContain('One or more selected services are unavailable');

    const tooLong = validateMultiServiceSelection(['haircut', 'color'], services, settings);
    expect(tooLong.errors[0]).toContain('exceeds the 40 minute limit');
  });

  it('builds sequential appointments with turnover between services', () => {
    const lines = buildSequentialAppointments(
      [
        { serviceId: 'a', durationMinutes: 60, bufferMinutes: 0 },
        { serviceId: 'b', durationMinutes: 45, bufferMinutes: 0 },
      ],
      new Date('2026-05-31T09:00:00.000Z'),
      5,
    );
    expect(lines[1].startTime.toISOString()).toBe('2026-05-31T10:05:00.000Z');
    expect(lines[1].endTime.toISOString()).toBe('2026-05-31T10:50:00.000Z');
  });

  it('checks employee qualification and per-service line validation', () => {
    expect(employeeQualifiesForServices(['haircut'], ['haircut', 'beard'])).toBe(false);
    expect(employeeQualifiesForServices(undefined, ['haircut'])).toBe(true);
    expect(findIncompatiblePairs(['haircut', 'color'], [['haircut', 'color']])).toHaveLength(1);

    expect(() =>
      validatePerServiceLines(['a', 'b'], [{ serviceId: 'a', startTime: '2026-01-01T10:00:00Z' }]),
    ).toThrow('Multi-service line count');
    expect(() =>
      validatePerServiceLines(['a', 'b'], [
        { serviceId: 'a', startTime: '2026-01-01T10:00:00Z' },
        { serviceId: 'c', startTime: '2026-01-01T11:00:00Z' },
      ]),
    ).toThrow('each selected service');
  });
});
