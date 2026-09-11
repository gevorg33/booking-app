/**
 * D5 / §225 — `mark_paid` refuses a namesake tie instead of picking one.
 *
 * This handler **writes**: it calls `bookingService.update` to flip payment
 * status. Its customer lookup used `fuzzyMatchByName`, which returns the first
 * match and cannot say "ambiguous", so two customers with the same name meant
 * the command marked *whichever namesake sorted first* as paid — and reported
 * success. The lookup did not fail; it succeeded against the wrong person.
 *
 * That is slice 5's reschedule failure mode (act on the wrong record, tell
 * nobody) applied to money. `bookingService.update` is left throwing in the tie
 * test on purpose: anything that slips past the refusal fails loudly rather
 * than passing quietly.
 */
import { handleMarkPaidLogic } from './ai-booking-depth.logic.js';

const customer = (id: string, name: string) => ({ id, name }) as never;

const twoNamesakes = [
  customer('cust-1', 'John Smith'),
  customer('cust-2', 'John Smith'),
];

// A real, unpaid booking belonging to the *first* namesake. Without this the
// tie test passes for the wrong reason: with the refusal disabled the handler
// finds nothing, writes nothing, and still returns `success: false`, so the
// assertion cannot tell "refused the tie" from "found no bookings". With it,
// the unguarded handler reaches `bookingService.update` and the negative
// control bites.
const namesakeBooking = {
  id: 'bk-1',
  customerId: 'cust-1',
  customer: { id: 'cust-1', name: 'John Smith' },
  paymentStatus: 'unpaid',
  status: 'confirmed',
  startTime: new Date('2026-08-20T10:00:00.000Z'),
  totalPrice: 40,
} as never;

function buildDeps(overrides: Record<string, unknown> = {}) {
  const manager = {
    transaction: jest.fn(async (fn: (m: unknown) => Promise<void>) => fn({})),
  };
  return {
    businessRepo: { findOne: jest.fn().mockResolvedValue({ settings: {} }) },
    packageRepo: { find: jest.fn().mockResolvedValue([]) },
    bookingRepo: {
      find: jest.fn().mockResolvedValue([namesakeBooking]),
      findOne: jest.fn().mockResolvedValue(namesakeBooking),
      manager,
    },
    bookingService: {
      update: jest.fn(async () => {
        throw new Error('mark_paid wrote during an ambiguous customer match');
      }),
    },
    ...overrides,
  } as never;
}

describe('mark_paid customer ambiguity (D5, §225)', () => {
  it('refuses when two customers share the named person, and does not write', async () => {
    const deps = buildDeps();
    const result = await handleMarkPaidLogic(
      deps,
      'biz-1',
      { customerName: 'John Smith' },
      'user-1',
      { customers: twoNamesakes, prompt: 'mark John Smith as paid' },
    );

    expect(result.success).toBe(false);
    expect(
      (deps as never as { bookingService: { update: jest.Mock } })
        .bookingService.update,
    ).not.toHaveBeenCalled();
  });

  it('names the candidates back rather than asking for a booking id alone', async () => {
    // The generic "specify a booking ID" miss message would be wrong here: the
    // name is valid, it is merely not unique, and the user cannot tell which
    // record the system had in mind without being shown the options.
    const result: any = await handleMarkPaidLogic(
      buildDeps(),
      'biz-1',
      { customerName: 'John Smith' },
      'user-1',
      { customers: twoNamesakes, prompt: 'mark John Smith as paid' },
    );

    expect(result.details?.candidates).toHaveLength(2);
    expect(result.details.candidates.map((c: any) => c.id).sort()).toEqual([
      'cust-1',
      'cust-2',
    ]);
    expect(result.details?.clarify).toBe(true);
  });

  it('still resolves an unambiguous name', async () => {
    // The refusal must not swallow the ordinary case: one match, no tie, the
    // handler proceeds to its normal "no bookings found" path rather than the
    // ambiguity one.
    const result: any = await handleMarkPaidLogic(
      buildDeps(),
      'biz-1',
      { customerName: 'Maria Lopez' },
      'user-1',
      {
        customers: [customer('cust-3', 'Maria Lopez'), ...twoNamesakes],
        prompt: 'mark Maria Lopez as paid',
      },
    );

    expect(result.details?.candidates).toBeUndefined();
  });
});
