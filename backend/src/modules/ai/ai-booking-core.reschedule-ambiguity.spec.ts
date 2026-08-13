/**
 * tech-debt D5 slice 5 — `handleRescheduleBooking` refuses a guessed name.
 *
 * The failure mode here is the worst of the D5 set so far. The other callers
 * mis-answer; this one *acts*: on a tie it picked a namesake, loaded that
 * person's bookings, rescheduled one of them, and reported success. The wrong
 * appointment moves and nobody is told.
 *
 * Note what the old code did NOT do: fall through to the "could not find the
 * booking" message. `resolveEmployee` returned an entity, so the lookup
 * succeeded — against the wrong person.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';

const rows = <T,>(items: T[]) => ({ find: async () => items }) as any;

/**
 * Only the three repos this path reads before the ambiguity check need to be
 * real; `bookingRepo` is deliberately left null, so any test that gets past the
 * refusal and tries to load bookings fails loudly rather than silently passing.
 */
const build = (employees: any[], customers: any[]) =>
  new AiBookingCoreService(
    undefined as any, // bookingRepo — must not be reached on a tie
    rows(employees), // employeeRepo
    rows([]), // serviceRepo
    rows(customers), // customerRepo
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
  );

const TIED_EMP = [
  { id: 'e1', name: 'Anna Petrova' },
  { id: 'e2', name: 'Anna Kowalski' },
];
const TIED_CUST = [
  { id: 'c1', name: 'John Smith' },
  { id: 'c2', name: 'John Smith' },
];

describe('tech-debt D5 — reschedule_booking refuses to act on a guessed name', () => {
  it('refuses when the provider name matches two people', async () => {
    const r = await build(TIED_EMP, []).handleRescheduleBooking('b1', {
      employeeName: 'Anna',
      timeSlot: '10:00',
    });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('refuses when the customer name matches two people', async () => {
    const r = await build([], TIED_CUST).handleRescheduleBooking('b1', {
      customerName: 'John Smith',
      timeSlot: '10:00',
    });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which customer/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('refusing is not the same as "could not find the booking"', async () => {
    // The generic miss message would tell the user to supply a bookingId,
    // which is the wrong advice: the name is fine, it is just not unique.
    const r = await build(TIED_EMP, []).handleRescheduleBooking('b1', {
      employeeName: 'Anna',
      timeSlot: '10:00',
    });
    expect(r.summary).not.toMatch(/could not find the booking/i);
  });

  it('a genuine provider miss still reports "could not find the booking"', async () => {
    const r = await build(TIED_EMP, []).handleRescheduleBooking('b1', {
      employeeName: 'Zebediah',
      timeSlot: '10:00',
    });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/could not find the booking/i);
  });

  it('a genuine customer miss still reports "could not find the booking"', async () => {
    const r = await build([], TIED_CUST).handleRescheduleBooking('b1', {
      customerName: 'Zebediah',
      timeSlot: '10:00',
    });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/could not find the booking/i);
  });

  it('an unambiguous provider name proceeds to the booking lookup', async () => {
    // bookingRepo is null, so reaching the lookup throws — that throw is the
    // evidence the guard let it through, and it is asserted rather than
    // swallowed so this cannot pass for the wrong reason.
    await expect(
      build(TIED_EMP, []).handleRescheduleBooking('b1', {
        employeeName: 'Anna Petrova',
        timeSlot: '10:00',
      }),
    ).rejects.toThrow();
  });
});
