import {
  formatBookingOverlapConflict,
  formatBookingWindowFullyBooked,
} from './booking-conflict-messages.util.js';

describe('booking-conflict-messages.util', () => {
  it('formats overlap with provider, time, and customer', () => {
    const msg = formatBookingOverlapConflict({
      employeeName: 'Gevorg Gasparyan',
      startTime: new Date('2026-06-02T13:00:00.000Z'),
      existingCustomerName: 'Anna',
    });
    expect(msg).toMatch(/Gevorg Gasparyan already has an appointment/i);
    expect(msg).toMatch(/Anna/);
    expect(msg).toMatch(/another time or provider/i);
  });

  it('formats overlap with provider but no parsed time', () => {
    expect(
      formatBookingOverlapConflict({ employeeName: 'Gevorg Gasparyan' }),
    ).toMatch(/already booked at that time/i);
  });

  it('formats overlap with provider, time, without customer', () => {
    const msg = formatBookingOverlapConflict({
      employeeName: 'Mary',
      startTime: '2026-06-02T14:00:00.000Z',
    });
    expect(msg).toMatch(/Mary already has an appointment/);
    expect(msg).not.toMatch(/ with /);
  });

  it('formats generic overlap when context is missing', () => {
    expect(formatBookingOverlapConflict()).toMatch(/already booked/i);
  });

  it('formats fully booked window with provider name', () => {
    expect(formatBookingWindowFullyBooked('Mary Torgomyan')).toMatch(
      /Mary Torgomyan/,
    );
  });

  it('formats fully booked window without provider name', () => {
    expect(formatBookingWindowFullyBooked()).toMatch(/already booked/i);
    expect(formatBookingWindowFullyBooked('  ')).toMatch(/already booked/i);
  });
});
