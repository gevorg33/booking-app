import {
  buildSequentialAppointments,
  calculateMultiServiceTotals,
  employeeQualifiesForServices,
  findIncompatiblePairs,
  validateMultiServiceSelection,
  validatePerServiceLines,
} from './multi-service-booking.util.js';
import { DEFAULT_MULTI_SERVICE_SETTINGS } from './multi-service-settings.util.js';

const services = [
  { serviceId: 'haircut', durationMinutes: 30, bufferMinutes: 0, price: 40, currency: 'USD', name: 'Haircut' },
  { serviceId: 'beard', durationMinutes: 20, bufferMinutes: 0, price: 25, currency: 'USD', name: 'Beard trim' },
  { serviceId: 'color', durationMinutes: 90, bufferMinutes: 10, price: 120, currency: 'USD', name: 'Color' },
];

describe('multi-service-booking.util', () => {
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

  it('flags unavailable services and duration over max', () => {
    const settings = { ...DEFAULT_MULTI_SERVICE_SETTINGS, enabled: true, maxDurationMinutes: 40 };
    const missing = validateMultiServiceSelection(['haircut', 'missing'], services, settings);
    expect(missing.errors).toContain('One or more selected services are unavailable');

    const tooLong = validateMultiServiceSelection(['haircut', 'color'], services, settings);
    expect(tooLong.errors[0]).toContain('exceeds the 40 minute limit');
  });

  it('builds sequential appointments within a block', () => {
    const start = new Date('2026-06-03T10:00:00Z');
    const lines = buildSequentialAppointments(
      [
        { serviceId: 'haircut', durationMinutes: 30, bufferMinutes: 0 },
        { serviceId: 'beard', durationMinutes: 20, bufferMinutes: 0 },
      ],
      start,
      5,
    );
    expect(lines).toHaveLength(2);
    expect(lines[0].startTime.toISOString()).toBe('2026-06-03T10:00:00.000Z');
    expect(lines[1].startTime.toISOString()).toBe('2026-06-03T10:35:00.000Z');
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
