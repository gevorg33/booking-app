import { describe, expect, it } from '@jest/globals';
import { BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import {
  aggregateEodSummaries,
  buildEodPushPayload,
  formatEodPushBody,
} from './provider-end-of-day-summary.util.js';

describe('provider-end-of-day-summary.util', () => {
  it('aggregates appointments, unpaid, and tomorrow gaps', () => {
    const summaries = aggregateEodSummaries(
      [
        {
          businessId: 'biz-1',
          employeeId: 'emp-1',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
        },
        {
          businessId: 'biz-1',
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PENDING,
        },
        {
          businessId: 'biz-1',
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
        },
        {
          businessId: 'biz-1',
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
        },
      ],
      new Map([['emp-1', 2]]),
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      appointmentCount: 4,
      unpaidCount: 1,
      gapsTomorrow: 2,
    });
  });

  it('formats push body and payload', () => {
    const body = formatEodPushBody({
      businessId: 'biz-1',
      employeeId: 'emp-1',
      appointmentCount: 4,
      unpaidCount: 1,
      gapsTomorrow: 2,
    });
    expect(body).toBe('4 appointments, 1 unpaid, 2 gaps tomorrow');

    expect(
      formatEodPushBody({
        businessId: 'biz-1',
        employeeId: 'emp-1',
        appointmentCount: 1,
        unpaidCount: 0,
        gapsTomorrow: 1,
      }),
    ).toBe('1 appointment, 1 gap tomorrow');

    const payload = buildEodPushPayload({
      businessId: 'biz-1',
      employeeId: 'emp-1',
      appointmentCount: 2,
      unpaidCount: 0,
      gapsTomorrow: 0,
    });
    expect(payload.pushType).toBe('end_of_day');
    expect(payload.aiPrompt).toMatch(/Summarize today's appointments/);
  });

  it('ignores gap-only employees that have no booking row', () => {
    expect(aggregateEodSummaries([], new Map([['emp-9', 2]]))).toEqual([]);
    expect(
      aggregateEodSummaries(
        [
          {
            businessId: 'biz-1',
            employeeId: 'emp-1',
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
          },
        ],
        new Map([['emp-2', 2]]),
      ),
    ).toHaveLength(1);
  });

  it('merges tomorrow gaps for employees without bookings in the gap map loop', () => {
    const summaries = aggregateEodSummaries(
      [
        {
          businessId: 'biz-1',
          employeeId: 'emp-2',
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      ],
      new Map([['emp-2', 3]]),
    );
    expect(summaries[0].gapsTomorrow).toBe(3);
  });
});
