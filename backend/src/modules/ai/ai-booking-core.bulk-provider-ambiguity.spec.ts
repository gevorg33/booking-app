/**
 * tech-debt D5 slice 4 — the bulk paths refuse an ambiguous provider name.
 *
 * These five handlers shared an identical guard: resolve the name, bail with
 * "No provider found" if it missed. A *tie* passed that guard, because
 * `resolveEmployee` returns an entity either way — so the bulk operation ran
 * against whichever namesake sorted first and cancelled, hid, or rewrote a
 * whole day of the wrong person's appointments.
 *
 * The guard now refuses the tie and leaves the miss message untouched. Both
 * halves are asserted here: a change that only added the refusal, or only kept
 * the miss, would fail.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

const service = new AiBookingCoreService(
  undefined as any, // bookingRepo
  undefined as any, // employeeRepo
  undefined as any, // serviceRepo
  undefined as any, // customerRepo
  undefined as any, // businessRepo
  undefined as any, // periodRepo
  undefined as any, // slotRepo
  undefined as any, // templateRepo
  undefined as any, // orchestration
  undefined as any, // planBuilder
  undefined as any, // scheduleHandlers
  undefined as any, // operations
  undefined as any, // schedulingEngine
  undefined as any, // slotResolver
  undefined as any, // customerService
);

const emp = (id: string, name: string) => ({ id, name }) as Employee;
const TIED = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];
const SERVICES = [] as Service[];

/**
 * Each entry is a handler whose provider guard runs before any repo access, so
 * a bare instance reaches the guard and returns without touching the database.
 */
const HANDLERS: {
  action: string;
  run: (params: any) => Promise<any>;
}[] = [
  {
    action: 'bulk_smart_cancel',
    run: (params) =>
      service.handleBulkSmartCancel(
        'b1',
        'cancel them',
        params,
        SERVICES,
        TIED,
      ),
  },
  // tech-debt D5-a (2026-08-20) — these three scope through
  // `applyEmployeeScopeToWhere`, whose `employeeName` branch is first-on-ties,
  // so a tie ran the bulk write against the wrong namesake's bookings.
  // §176 listed them as blocked because that function returns `boolean`; the
  // handlers themselves return `CommandResult`, so the guard sits here.
  {
    action: 'mark_no_shows',
    run: (params) =>
      service.handleMarkNoShows(
        'b1',
        'mark them no show',
        params,
        SERVICES,
        TIED,
        undefined,
      ),
  },
  {
    // The no-show *recovery* branch, reached by its own prompt shape.
    action: 'no_show_recovery',
    run: (params) =>
      service.handleNoShowRecovery(
        'b1',
        'follow up with no shows',
        params,
        SERVICES,
        TIED,
        undefined,
      ),
  },
  {
    // Money: this sweeps unpaid bookings. A tie swept the wrong person's.
    action: 'payment_sweep',
    run: (params) =>
      service.handlePaymentSweep(
        'b1',
        'mark unpaid as paid',
        params,
        SERVICES,
        TIED,
        undefined,
      ),
  },
  {
    // `status` is required: without it the handler returns "tell me what to
    // change" before ever reaching the provider guard. COMPLETED (not
    // CANCELLED, which delegates to handleCancelBookings and would test that
    // handler twice).
    action: 'update_bookings',
    run: (params) =>
      service.handleUpdateBookings(
        'b1',
        'mark them done',
        { ...params, status: 'completed' },
        SERVICES,
        TIED,
        [],
      ),
  },
  // The two calendar handlers take (businessId, params, services, employees,
  // customers) — no `prompt` argument, unlike the other three.
  {
    action: 'hide_appointments_from_calendar',
    run: (params) =>
      service.handleHideAppointmentsFromCalendar(
        'b1',
        params,
        SERVICES,
        TIED,
        [],
      ),
  },
  {
    action: 'unhide_appointments_from_calendar',
    run: (params) =>
      service.handleUnhideAppointmentsFromCalendar(
        'b1',
        params,
        SERVICES,
        TIED,
        [],
      ),
  },
  {
    action: 'cancel_bookings',
    run: (params) =>
      service.handleCancelBookings(
        'b1',
        'cancel them',
        params,
        SERVICES,
        TIED,
        [],
      ),
  },
];

describe('tech-debt D5 — bulk handlers ask which provider instead of picking one', () => {
  it.each(HANDLERS.map((h) => [h.action, h] as const))(
    '%s refuses an ambiguous provider name',
    async (_action, handler) => {
      const r = await handler.run({ employeeName: 'Anna' });
      expect(r.success).toBe(false);
      expect(r.summary).toMatch(/which provider/i);
      expect(r.details.candidates.map((c: any) => c.id).sort()).toEqual([
        'e1',
        'e2',
      ]);
    },
  );

  it.each(HANDLERS.map((h) => [h.action, h] as const))(
    '%s still reports a genuine miss as "no provider found", not as a tie',
    async (_action, handler) => {
      const r = await handler.run({ employeeName: 'Zebediah' });
      expect(r.success).toBe(false);
      expect(r.summary).toBe('No provider found matching "Zebediah".');
    },
  );

  it.each(HANDLERS.map((h) => [h.action, h] as const))(
    '%s does not refuse an unambiguous provider name',
    async (_action, handler) => {
      // Proceeds past the guard and fails later on the null repo — the point is
      // only that it is not the ambiguity refusal.
      const r = await handler
        .run({ employeeName: 'Anna Petrova' })
        .catch((e: Error) => ({ summary: `threw: ${e.message}` }));
      expect(r.summary ?? '').not.toMatch(/which provider/i);
    },
  );
});
