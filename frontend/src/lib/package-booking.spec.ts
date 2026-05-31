import { describe, expect, it } from 'vitest';
import {
  buildPackageLinesFromBlockStart,
  expandPackageServiceItems,
} from './package-booking';
import type { PublicServicePackage } from './public-api';

describe('package-booking', () => {
  const pkg: PublicServicePackage = {
    id: 'pkg-1',
    kind: 'package',
    name: 'Glow Package',
    displayOrder: 0,
    totalDurationMinutes: 105,
    currency: 'USD',
    items: [
      {
        serviceId: 'face-plasma',
        quantity: 1,
        unitPrice: 120,
        serviceName: 'Face Plasma',
        durationMinutes: 45,
        bufferMinutes: 0,
      },
      {
        serviceId: 'face-pilling',
        quantity: 1,
        unitPrice: 5,
        serviceName: 'Face Pilling',
        durationMinutes: 60,
        bufferMinutes: 0,
      },
    ],
    pricing: {
      regularTotal: 125,
      packagePrice: 100,
      savings: 25,
      savingsPercent: 20,
    },
  };

  it('expands package item quantities into sequential service rows', () => {
    expect(expandPackageServiceItems(pkg)).toEqual([
      {
        serviceId: 'face-plasma',
        serviceName: 'Face Plasma',
        durationMinutes: 45,
        bufferMinutes: 0,
      },
      {
        serviceId: 'face-pilling',
        serviceName: 'Face Pilling',
        durationMinutes: 60,
        bufferMinutes: 0,
      },
    ]);

    expect(
      expandPackageServiceItems({
        ...pkg,
        items: [{ ...pkg.items[0], quantity: 2, bufferMinutes: undefined }],
      }),
    ).toEqual([
      {
        serviceId: 'face-plasma',
        serviceName: 'Face Plasma',
        durationMinutes: 45,
        bufferMinutes: 0,
      },
      {
        serviceId: 'face-plasma',
        serviceName: 'Face Plasma',
        durationMinutes: 45,
        bufferMinutes: 0,
      },
    ]);
  });

  it('builds back-to-back booking lines from a block start', () => {
    expect(
      buildPackageLinesFromBlockStart(
        expandPackageServiceItems(pkg),
        '2026-06-02T09:00:00.000Z',
        'emp-1',
        5,
      ),
    ).toEqual([
      {
        serviceId: 'face-plasma',
        employeeId: 'emp-1',
        startTime: '2026-06-02T09:00:00.000Z',
      },
      {
        serviceId: 'face-pilling',
        employeeId: 'emp-1',
        startTime: '2026-06-02T09:50:00.000Z',
      },
    ]);
  });

  it('includes service buffers and turnover between appointments', () => {
    expect(
      buildPackageLinesFromBlockStart(
        [
          {
            serviceId: 'a',
            serviceName: 'A',
            durationMinutes: 30,
            bufferMinutes: 10,
          },
          {
            serviceId: 'b',
            serviceName: 'B',
            durationMinutes: 20,
            bufferMinutes: 0,
          },
        ],
        '2026-06-02T09:00:00.000Z',
        'emp-1',
        5,
      ),
    ).toEqual([
      {
        serviceId: 'a',
        employeeId: 'emp-1',
        startTime: '2026-06-02T09:00:00.000Z',
      },
      {
        serviceId: 'b',
        employeeId: 'emp-1',
        startTime: '2026-06-02T09:45:00.000Z',
      },
    ]);
  });
});
