import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  applyCustomerRunningLateToMetadata,
  buildCustomerRunningLateEligibility,
  buildCustomerRunningLateSnapshot,
  buildCustomerRunningLateStaffSummary,
  buildCustomerRunningLateSuccessSummary,
  readCustomerRunningLate,
} from './customer-running-late.util.js';

describe('customer-running-late.util', () => {
  const startTime = new Date('2030-06-01T14:00:00.000Z');
  const endTime = new Date('2030-06-01T15:00:00.000Z');

  it('reads and applies customer running late metadata', () => {
    const snapshot = buildCustomerRunningLateSnapshot({
      minutesLate: 15,
      customerId: 'cust-1',
    });
    const metadata = applyCustomerRunningLateToMetadata({}, snapshot);
    expect(readCustomerRunningLate(metadata)).toEqual(snapshot);
  });

  it('allows notify within the appointment window', () => {
    expect(
      buildCustomerRunningLateEligibility(
        {
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime,
        },
        new Date('2030-06-01T13:30:00.000Z'),
      ).allowed,
    ).toBe(true);
  });

  it('blocks notify too early or after visit', () => {
    expect(
      buildCustomerRunningLateEligibility(
        { status: BookingStatus.CONFIRMED, startTime, endTime },
        new Date('2030-06-01T06:00:00.000Z'),
      ).reason,
    ).toMatch(/closer to your appointment/i);
    expect(
      buildCustomerRunningLateEligibility(
        { status: BookingStatus.COMPLETED, startTime, endTime },
        new Date('2030-06-01T14:10:00.000Z'),
      ).reason,
    ).toMatch(/completed/i);
  });

  it('builds staff and success summaries', () => {
    expect(
      buildCustomerRunningLateStaffSummary({
        customerName: 'Jane',
        serviceName: 'Massage',
        minutesLate: 15,
        whenLabel: 'Jun 1 2:00 PM',
      }),
    ).toMatch(/Jane is running about 15 minutes late/);
    expect(buildCustomerRunningLateSuccessSummary(10)).toMatch(
      /notified the salon/,
    );
  });
});
