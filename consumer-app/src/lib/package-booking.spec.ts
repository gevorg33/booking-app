import { describe, expect, it } from 'vitest';
import {
  buildPackageCheckoutPath,
  buildPackageConfirmPath,
  buildPackageLinesFromBlockStart,
  buildPackagePickerPath,
  computePackageTotalDurationMinutes,
  expandPackageServiceItems,
  formatPackageDurationMinutes,
  parsePackageBookingLines,
  shouldShowServicesCatalogEntry,
  type PublicServicePackage,
} from './package-booking.js';

const samplePackage: PublicServicePackage = {
  id: 'pkg-1',
  kind: 'package',
  name: 'Spa Day',
  displayOrder: 0,
  totalDurationMinutes: 90,
  currency: 'USD',
  items: [
    {
      serviceId: 'svc-a',
      serviceName: 'Massage',
      quantity: 1,
      unitPrice: 80,
      durationMinutes: 60,
      bufferMinutes: 5,
    },
    {
      serviceId: 'svc-b',
      serviceName: 'Facial',
      quantity: 2,
      unitPrice: 40,
      durationMinutes: 30,
      bufferMinutes: 0,
    },
  ],
  pricing: {
    regularTotal: 160,
    packagePrice: 120,
    savings: 40,
    savingsPercent: 25,
  },
};

describe('package-booking', () => {
  it('expands package items by quantity', () => {
    expect(expandPackageServiceItems(samplePackage)).toHaveLength(3);
    expect(expandPackageServiceItems(samplePackage).map((item) => item.serviceId)).toEqual([
      'svc-a',
      'svc-b',
      'svc-b',
    ]);
  });

  it('computes total duration with turnover buffers', () => {
    expect(computePackageTotalDurationMinutes(samplePackage, 5)).toBe(65 + 30 + 30 + 10);
  });

  it('formats duration labels', () => {
    expect(formatPackageDurationMinutes(45)).toBe('45 min');
    expect(formatPackageDurationMinutes(60)).toBe('1 h');
    expect(formatPackageDurationMinutes(75)).toBe('1 h 15 min');
  });

  it('builds sequential booking lines from block start', () => {
    const items = expandPackageServiceItems(samplePackage);
    const lines = buildPackageLinesFromBlockStart(
      items,
      '2026-06-08T10:00:00.000Z',
      'emp-1',
      5,
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({
      serviceId: 'svc-a',
      employeeId: 'emp-1',
      startTime: '2026-06-08T10:00:00.000Z',
    });
    expect(new Date(lines[1].startTime).getTime()).toBeGreaterThan(
      new Date(lines[0].startTime).getTime(),
    );
  });

  it('parses and rejects invalid booking lines', () => {
    const lines = [
      { serviceId: 'svc-a', employeeId: 'emp-1', startTime: '2026-06-08T10:00:00.000Z' },
    ];
    expect(parsePackageBookingLines(JSON.stringify(lines))).toEqual(lines);
    expect(parsePackageBookingLines('not-json')).toEqual([]);
    expect(parsePackageBookingLines(null)).toEqual([]);
  });

  it('builds consumer package routes', () => {
    expect(buildPackageConfirmPath('salon', 'pkg-1')).toBe('/s/salon/book/packages/pkg-1');
    expect(buildPackageCheckoutPath('salon', 'pkg-1', { employeeName: 'Alex' })).toBe(
      '/s/salon/book/packages/pkg-1/checkout?employeeName=Alex',
    );
    expect(buildPackagePickerPath('salon')).toBe('/s/salon/book/any');
  });

  it.each([
    {
      id: 'e2e-bug.7-packages-with-multi',
      input: { hasPackages: true, multiServiceEnabled: true, hasServices: true },
      expected: true,
    },
    {
      id: 'e2e-bug.7-packages-without-multi',
      input: { hasPackages: true, multiServiceEnabled: false, hasServices: true },
      expected: true,
    },
    {
      id: 'e2e-bug.7-no-packages-with-multi',
      input: { hasPackages: false, multiServiceEnabled: true, hasServices: true },
      expected: false,
    },
    {
      id: 'e2e-bug.7-legacy-any-specialist',
      input: { hasPackages: false, multiServiceEnabled: false, hasServices: true },
      expected: true,
    },
    {
      id: 'e2e-bug.7-empty-catalog',
      input: { hasPackages: false, multiServiceEnabled: false, hasServices: false },
      expected: false,
    },
  ])('$id: shouldShowServicesCatalogEntry → $expected', ({ input, expected }) => {
    expect(shouldShowServicesCatalogEntry(input)).toBe(expected);
  });
});
