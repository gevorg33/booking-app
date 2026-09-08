/**
 * §311 (`e2e-bug.533`) — the bulk paths apply the customer scope they declare.
 *
 * `cancel_bookings` [T3] declared `customerName` as *"Only cancel appointments
 * for this customer"*, with `resolver: 'customer'`, and its first documented
 * example is `"cancel Mary's appointment"`. The filter never read it:
 * `findBookingsForCancel` built its where-clause from employee, service and
 * date scope only. So **"cancel Mary's appointments tomorrow" cancelled every
 * booking tomorrow** — a T3 irreversible command widening from one customer to
 * the whole day.
 *
 * The completion validator hid the worst case rather than preventing this one:
 * it demands a date/provider/service and does not accept `customerName` as a
 * filter, so a customer-only prompt is sent back for clarification — but a
 * customer name *plus* a date passed the gate.
 *
 * `update_bookings` had the identical gap ("mark Karo's 10am as completed"
 * marked everyone's).
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';

const person = (id: string, name: string) => ({ id, name }) as never;

const MARYS = [person('cust-1', 'Mary Smith'), person('cust-2', 'Mary Jones')];
const ONE_MARY = [person('cust-1', 'Mary Smith'), person('cust-9', 'Bob Stone')];

function buildService(capture: { where?: any }) {
  const svc: any = Object.create(AiBookingCoreService.prototype);
  svc.findBookingsForCancel = jest.fn(async (_b: string, params: any) => {
    capture.where = params;
    return [];
  });
  svc.findBookingsForBulkUpdate = jest.fn(async (_b: string, params: any) => {
    capture.where = params;
    return [];
  });
  svc.providerNameGuard = jest.fn(() => null);
  return svc;
}

const cancel = (svc: any, params: Record<string, unknown>, customers: never[]) =>
  svc.handleCancelBookings('biz-1', 'cancel them', params, [], [], customers, undefined, 'user-1');

describe('§311 — bulk cancel applies its declared customer scope', () => {
  it('resolves a customer name to an id the finder can filter on', async () => {
    const capture: { where?: any } = {};
    const svc = buildService(capture);
    await cancel(svc, { customerName: 'Mary Smith', date: '2026-09-02' }, ONE_MARY as never[]);

    // The whole point: the finder must receive something that narrows to Mary.
    expect(capture.where?.customerId).toBe('cust-1');
  });

  it('refuses when two customers share the name, instead of picking one', async () => {
    const capture: { where?: any } = {};
    const svc = buildService(capture);
    const result: any = await cancel(
      svc,
      { customerName: 'Mary', date: '2026-09-02' },
      MARYS as never[],
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('cancel_bookings');
    // D5: the tie is reported, not resolved by picking the first match.
    expect(result.details.candidates.map((c: any) => c.id).sort()).toEqual([
      'cust-1',
      'cust-2',
    ]);
    expect(svc.findBookingsForCancel).not.toHaveBeenCalled();
  });

  it('refuses an unknown customer rather than cancelling the whole day', async () => {
    // The failure mode this ticket is about: "I could not find Mary" must not
    // degrade into "cancel everything that matches the date".
    const capture: { where?: any } = {};
    const svc = buildService(capture);
    const result: any = await cancel(
      svc,
      { customerName: 'Nobody', date: '2026-09-02' },
      ONE_MARY as never[],
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Nobody');
    expect(svc.findBookingsForCancel).not.toHaveBeenCalled();
  });

  it('leaves prompts with no customer name exactly as they were', async () => {
    const capture: { where?: any } = {};
    const svc = buildService(capture);
    await cancel(svc, { date: '2026-09-02' }, ONE_MARY as never[]);

    expect(capture.where?.customerId).toBeUndefined();
    expect(svc.findBookingsForCancel).toHaveBeenCalled();
  });

  it('an explicit customerId wins outright and skips name resolution', async () => {
    const capture: { where?: any } = {};
    const svc = buildService(capture);
    await cancel(
      svc,
      { customerId: 'cust-7', customerName: 'Mary', date: '2026-09-02' },
      MARYS as never[],
    );

    // Ambiguous name, but the id is unambiguous by construction — same
    // precedence `handleCreateBooking` already uses.
    expect(capture.where?.customerId).toBe('cust-7');
  });
});

describe('§311 — the finder actually filters on it', () => {
  /**
   * The tests above mock `findBookingsForCancel` and assert what the handler
   * *passes* to it. That is not the fix. Deleting the where-clause line left
   * all five green — the negative control caught it — so this exercises the
   * real finder and asserts the query itself.
   */
  const finderService = (captured: { where?: any }) => {
    const svc: any = Object.create(AiBookingCoreService.prototype);
    svc.bookingRepo = {
      find: jest.fn(async (opts: any) => {
        captured.where = opts.where;
        return [];
      }),
    };
    return svc;
  };

  it('puts customerId into the booking query', async () => {
    const captured: { where?: any } = {};
    const svc = finderService(captured);
    await svc.findBookingsForCancel(
      'biz-1',
      { customerId: 'cust-1', date: '2026-09-02' },
      [],
      [],
    );
    expect(captured.where?.customerId).toBe('cust-1');
  });

  it('omits customerId when none was resolved, so unscoped cancels still work', async () => {
    const captured: { where?: any } = {};
    const svc = finderService(captured);
    await svc.findBookingsForCancel('biz-1', { date: '2026-09-02' }, [], []);
    expect(captured.where).toBeDefined();
    expect('customerId' in (captured.where ?? {})).toBe(false);
  });

  it('the bulk-update finder filters the same way', async () => {
    const captured: { where?: any } = {};
    const svc = finderService(captured);
    await svc.findBookingsForBulkUpdate(
      'biz-1',
      { customerId: 'cust-2', date: '2026-09-02' },
      [],
      [],
    );
    expect(captured.where?.customerId).toBe('cust-2');
  });
});
