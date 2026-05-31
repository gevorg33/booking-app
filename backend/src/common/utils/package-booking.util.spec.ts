import {
  expandPackageServiceIds,
  packageLineKey,
  validatePackageBookingLines,
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
      validatePackageBookingLines(['a', 'b'], [
        { serviceId: 'b', startTime: '2026-06-01T10:00:00Z' },
        { serviceId: 'a', startTime: '2026-06-01T11:00:00Z' },
      ]),
    ).not.toThrow();
  });

  it('rejects wrong line count or missing services', () => {
    expect(() =>
      validatePackageBookingLines(['a', 'b'], [
        { serviceId: 'a', startTime: '2026-06-01T10:00:00Z' },
      ]),
    ).toThrow('Package line count does not match included services');

    expect(() =>
      validatePackageBookingLines(['a', 'b'], [
        { serviceId: 'a', startTime: '2026-06-01T10:00:00Z' },
        { serviceId: 'c', startTime: '2026-06-01T11:00:00Z' },
      ]),
    ).toThrow('Package lines must include each bundled service');
  });

  it('builds stable line keys', () => {
    expect(packageLineKey('svc-1', 0)).toBe('svc-1:0');
  });
});
