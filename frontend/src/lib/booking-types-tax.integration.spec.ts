import { describe, expect, it } from 'vitest';
import {
  formatBookingBlockHeadline,
  formatBookingBlockSublabel,
} from './booking-types';

describe('booking-types tax display integration', () => {
  const baseTimes = {
    startTime: '2026-06-05T10:00:00.000Z',
    endTime: '2026-06-05T11:00:00.000Z',
    status: 'confirmed',
  };

  it('uses tax-inclusive amountDue in calendar headline', () => {
    const headline = formatBookingBlockHeadline({
      ...baseTimes,
      service: { price: 100, currency: 'USD' },
      metadata: {
        pricing: { amountDue: 120, taxAmount: 20 },
      },
    });

    expect(headline).toMatch(/120/);
    expect(headline).not.toMatch(/100/);
  });

  it('falls back to amountPaid when amountDue is absent', () => {
    const headline = formatBookingBlockHeadline({
      ...baseTimes,
      service: { price: 100, currency: 'USD' },
      metadata: { amountPaid: 113 },
    });

    expect(headline).toMatch(/113/);
  });

  it('appends tax amount to sublabel when present', () => {
    const sublabel = formatBookingBlockSublabel({
      service: { name: 'Massage' },
      customer: { name: 'Alex' },
      metadata: { pricing: { taxAmount: 20 } },
    });

    expect(sublabel).toBe('Massage · Alex · Tax 20');
  });

  it('omits tax suffix when tax amount is zero or missing', () => {
    expect(
      formatBookingBlockSublabel({
        service: { name: 'Massage' },
        customer: { name: 'Alex' },
        metadata: { pricing: { taxAmount: 0 } },
      }),
    ).toBe('Massage · Alex');

    expect(
      formatBookingBlockSublabel({
        service: { name: 'Massage' },
        customer: { name: 'Alex' },
      }),
    ).toBe('Massage · Alex');
  });

  it('returns early for package and multi-service bookings without tax suffix', () => {
    expect(
      formatBookingBlockSublabel({
        service: { name: 'Massage' },
        customer: { name: 'Alex' },
        metadata: { packageName: 'Relax pack', pricing: { taxAmount: 5 } },
        packagePurchaseId: 'pkg-1',
      }),
    ).toBe('Package: Relax pack · Massage · Alex');

    expect(
      formatBookingBlockSublabel({
        service: { name: 'Massage' },
        customer: { name: 'Alex' },
        metadata: { groupLabel: 'Spa day', pricing: { taxAmount: 8 } },
        multiServiceGroupId: 'grp-1',
      }),
    ).toBe('Multi-service: Spa day · Massage · Alex');
  });
});
