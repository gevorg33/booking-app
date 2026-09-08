/**
 * D5 / §236 — `bulk_smart_cancel` refuses an ambiguous *service* name.
 *
 * The D5 campaign guarded providers, customers and templates. Services tie the
 * same way and were unguarded: `fuzzyMatchServiceByName`'s fourth tier is a
 * substring match, so `"massage"` matches both `"Swedish massage"` and
 * `"Deep tissue massage"` and `.find()` returns one. Measured before fixing —
 * `resolveServices({ serviceName: 'massage' })` returned exactly one id.
 *
 * On this handler that meant cancelling one service's bookings and reporting
 * success, having silently ignored the other.
 *
 * **Refusing, not matching both.** Matching both is a defensible reading of
 * "cancel all massage bookings" — but on a destructive path it silently widens
 * the blast radius, which is the worse of the two ways to be wrong. Read-only
 * callers keep the permissive `resolveServices`.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';

const service = (id: string, name: string) => ({ id, name }) as never;

const MASSAGES = [
  service('svc-swedish', 'Swedish massage'),
  service('svc-deep', 'Deep tissue massage'),
];

function buildService() {
  const svc: any = Object.create(AiBookingCoreService.prototype);
  svc.findBookingsForCancel = jest.fn(async () => {
    throw new Error('searched for bookings to cancel on an ambiguous service');
  });
  svc.providerNameGuard = jest.fn(() => null);
  return svc;
}

const call = (svc: any, params: Record<string, unknown>) =>
  svc.handleBulkSmartCancel(
    'biz-1',
    'cancel all massage bookings tomorrow',
    params,
    MASSAGES,
    [],
    undefined,
    'user-1',
  );

describe('bulk_smart_cancel service ambiguity (D5, §236)', () => {
  it('cancels nothing when the service name matches two services', async () => {
    const svc = buildService();
    const result: any = await call(svc, { serviceName: 'massage' });

    expect(result.success).toBe(false);
    expect(svc.findBookingsForCancel).not.toHaveBeenCalled();
  });

  it('names both candidates and the ambiguous name', async () => {
    const result: any = await call(buildService(), { serviceName: 'massage' });

    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('massage');
    expect(
      (result.details.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['svc-deep', 'svc-swedish']);
  });

  it('refuses before the provider guard, so the first problem reported is the real one', async () => {
    // Ordering matters for the message the user sees: the service tie is what
    // is wrong, and reporting a provider issue first would send them to fix
    // something that is fine.
    const svc = buildService();
    await call(svc, { serviceName: 'massage', employeeName: 'Anna' });

    expect(svc.providerNameGuard).not.toHaveBeenCalled();
  });

  it('still proceeds on an exact service name', async () => {
    // An exact match beats the substring tier, so the fully-qualified name is
    // not a tie even though the shared word is.
    const svc = buildService();
    await expect(call(svc, { serviceName: 'Deep tissue massage' })).rejects.toThrow(
      /searched for bookings to cancel/,
    );
  });
});

/**
 * §237 — the other three bulk writers in this service.
 *
 * `handleCancelBookings`, `handleHideAppointmentsFromCalendar`,
 * `handleUnhideAppointmentsFromCalendar` and `handleUpdateBookings` all took
 * the same silent service pick. They share `resolveServicesVerdict`, so one
 * control disables all of them; each asserts its own action string, read out of
 * the handler's own returns (§227's lesson — a guard that invents an action is
 * a contract change smuggled into a bug fix).
 */
describe('the other bulk writers refuse a service tie (§237)', () => {
  const svcFor = () => {
    const svc: any = Object.create(AiBookingCoreService.prototype);
    const boom = (what: string) =>
      jest.fn(async () => {
        throw new Error(`${what} ran on an ambiguous service`);
      });
    svc.findBookingsForCancel = boom('cancel search');
    svc.findBookingsForCalendarVisibility = boom('visibility search');
    svc.findBookingsForBulkUpdate = boom('bulk update search');
    svc.providerNameGuard = jest.fn(() => null);
    svc.resolveCalendarVisibilityStatusFilters = jest.fn(() => []);
    return svc;
  };

  const CASES: Array<[string, string, (svc: any) => Promise<unknown>]> = [
    ['handleCancelBookings', 'cancel_bookings', (svc) =>
      svc.handleCancelBookings('biz-1', 'cancel massage bookings',
        { serviceName: 'massage' }, MASSAGES, [], [], undefined, 'user-1')],
    // Note the arity: hide/unhide take (businessId, params, services, …) with
    // **no prompt**, while cancel/update take (businessId, prompt, params, …).
    // Passing a prompt where `params` belongs made `params.serviceName`
    // undefined, so there was no tie to refuse and the test failed by reaching
    // the real lookup — the third time this session that assuming a uniform
    // signature produced a test that failed for an unrelated reason.
    ['handleHideAppointmentsFromCalendar', 'hide_appointments_from_calendar', (svc) =>
      svc.handleHideAppointmentsFromCalendar('biz-1',
        { serviceName: 'massage' }, MASSAGES, [], [], undefined, 'user-1')],
    ['handleUnhideAppointmentsFromCalendar', 'unhide_appointments_from_calendar', (svc) =>
      svc.handleUnhideAppointmentsFromCalendar('biz-1',
        { serviceName: 'massage' }, MASSAGES, [], [], undefined, 'user-1')],
    ['handleUpdateBookings', 'update_bookings', (svc) =>
      svc.handleUpdateBookings('biz-1', 'mark massage bookings confirmed',
        { serviceName: 'massage', status: 'confirmed' }, MASSAGES, [], [], undefined, 'user-1')],
  ];

  it.each(CASES)('%s refuses and names both candidates', async (_n, action, call) => {
    const svc = svcFor();
    const result: any = await call(svc);

    expect(result.success).toBe(false);
    expect(result.action).toBe(action);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('massage');
    expect(
      (result.details.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['svc-deep', 'svc-swedish']);
  });
});
