import {
  expandPackageServiceIds,
  packageLineKey,
  validatePackageBookingLines,
  validatePackageSameDayBlock,
} from './package-booking.util.js';

describe('package-booking.util', () => {
  it('expands package item quantities into service ids', () => {
    expect(
      expandPackageServiceIds([
        { serviceId: 'a', quantity: 2 },
        { serviceId: 'b', quantity: 1 },
      ]),
    ).toEqual(['a', 'a', 'b']);
  });

  it('validates matching package booking lines', () => {
    expect(() =>
      validatePackageBookingLines(
        ['a', 'b'],
        [
          { serviceId: 'b', startTime: '2026-06-01T10:00:00Z' },
          { serviceId: 'a', startTime: '2026-06-01T11:00:00Z' },
        ],
      ),
    ).not.toThrow();
  });

  it('rejects wrong line count or missing services', () => {
    expect(() =>
      validatePackageBookingLines(
        ['a', 'b'],
        [{ serviceId: 'a', startTime: '2026-06-01T10:00:00Z' }],
      ),
    ).toThrow('Package line count does not match included services');

    expect(() =>
      validatePackageBookingLines(
        ['a', 'b'],
        [
          { serviceId: 'a', startTime: '2026-06-01T10:00:00Z' },
          { serviceId: 'c', startTime: '2026-06-01T11:00:00Z' },
        ],
      ),
    ).toThrow('Package lines must include each bundled service');
  });

  it('builds stable line keys', () => {
    expect(packageLineKey('svc-1', 0)).toBe('svc-1:0');
  });

  it('validates same-day back-to-back package block', () => {
    const services = [
      { serviceId: 'a', durationMinutes: 30, bufferMinutes: 0 },
      { serviceId: 'b', durationMinutes: 45, bufferMinutes: 0 },
    ];
    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
          {
            serviceId: 'b',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:35:00.000Z',
          },
        ],
        5,
      ),
    ).not.toThrow();
  });

  it('rejects package lines on different days or wrong order', () => {
    const services = [
      { serviceId: 'a', durationMinutes: 30, bufferMinutes: 0 },
      { serviceId: 'b', durationMinutes: 45, bufferMinutes: 0 },
    ];
    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
          {
            serviceId: 'b',
            employeeId: 'emp-1',
            startTime: '2026-06-02T10:35:00.000Z',
          },
        ],
        5,
      ),
    ).toThrow('All package services must be scheduled on the same day');

    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'b',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:45:00.000Z',
          },
        ],
        5,
      ),
    ).toThrow('Package lines must follow the included service order');
  });

  it('rejects mismatched line count, providers, or non-sequential times', () => {
    const services = [
      { serviceId: 'a', durationMinutes: 30, bufferMinutes: 0 },
      { serviceId: 'b', durationMinutes: 45, bufferMinutes: 0 },
    ];
    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
        ],
        5,
      ),
    ).toThrow('Package line count does not match included services');

    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
          {
            serviceId: 'b',
            employeeId: 'emp-2',
            startTime: '2026-06-01T10:35:00.000Z',
          },
        ],
        5,
      ),
    ).toThrow('All package services must use the same provider');

    expect(() =>
      validatePackageSameDayBlock(
        services,
        [
          {
            serviceId: 'a',
            employeeId: 'emp-1',
            startTime: '2026-06-01T10:00:00.000Z',
          },
          {
            serviceId: 'b',
            employeeId: 'emp-1',
            startTime: '2026-06-01T11:00:00.000Z',
          },
        ],
        5,
      ),
    ).toThrow(
      'Package services must be scheduled back-to-back on the same visit',
    );
  });

  it('allows empty lines and lines without employee ids', () => {
    expect(() => validatePackageSameDayBlock([], [], 5)).not.toThrow();
    expect(() =>
      validatePackageSameDayBlock(
        [{ serviceId: 'a', durationMinutes: 30, bufferMinutes: 0 }],
        [{ serviceId: 'a', startTime: '2026-06-01T10:00:00.000Z' }],
        5,
      ),
    ).not.toThrow();
  });
});
