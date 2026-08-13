/**
 * tech-debt D5 slice 7 — the guest booking path refuses an ambiguous provider.
 *
 * This is the unauthenticated surface, and `handleBookAppointment` is the
 * mutating end of it: on a tie the old code picked a namesake and booked the
 * guest with the wrong specialist, reporting success.
 *
 * Two things here differ from the dashboard slices, both deliberate:
 *
 * 1. **Name-first precedence is preserved.** This surface consults
 *    `employeeName` before `employeeId`, the opposite of `handleCreateBooking`.
 *    Flipping it would be a second behaviour change inside a D5 slice.
 * 2. **The clarification is localized.** Returning `resolveEntity`'s
 *    English-only string would be e2e-bug.108 again, so the refusal goes
 *    through `t(locale, 'assistant.providerAmbiguous', …)` — asserted below in
 *    Armenian, not just English, because an English-only assertion passes
 *    whether or not the localization works.
 */
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

const emp = (id: string, name: string) => ({ id, name }) as Employee;
const TIED = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];

/**
 * `handleBookAppointment` reads only `publicBookingService.resolveBusiness`
 * before the ambiguity check, so a prototype instance with that one stub
 * reaches the guard. Everything else is left undefined on purpose: a test that
 * slips past the refusal throws instead of passing quietly.
 */
const build = () => {
  // `as any` throughout: the deps are private, and the point is to construct
  // the real prototype without its 30-argument constructor.
  const svc: any = Object.create(PublicBookingAssistantService.prototype);
  svc.publicBookingService = {
    resolveBusiness: async () => ({ id: 'b1', timezone: 'UTC' }),
  };
  return svc;
};

const book = (params: Record<string, unknown>, locale = 'en') =>
  (build() as any).handleBookAppointment(
    'salon-slug',
    params,
    TIED,
    [] as Service[],
    locale,
    'book me with anna',
  );

describe('tech-debt D5 — public book_appointment refuses an ambiguous provider', () => {
  it('refuses instead of booking with a guessed specialist', async () => {
    const r = await book({ employeeName: 'Anna' });
    expect(r.success).toBe(false);
    expect(r.action).toBe('book_appointment');
    expect(r.details.candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('names both candidates in the summary so the guest can choose', async () => {
    const r = await book({ employeeName: 'Anna' });
    expect(r.summary).toContain('Anna Petrova');
    expect(r.summary).toContain('Anna Kowalski');
  });

  it('the refusal is localized, not raw English (e2e-bug.108)', async () => {
    const en = await book({ employeeName: 'Anna' }, 'en');
    const hy = await book({ employeeName: 'Anna' }, 'hy');
    expect(hy.summary).not.toBe(en.summary);
    expect(hy.summary).toMatch(/\p{Script=Armenian}/u);
  });

  // Getting past the guard does not throw: the handler falls through to its
  // normal "still missing some details" reply. So these assert the *absence* of
  // the refusal — no `candidates`, and the summary is the ordinary prompt for
  // the remaining fields.
  it('an unambiguous provider name is not refused', async () => {
    const r = await book({ employeeName: 'Anna Petrova' });
    expect(r.details?.candidates).toBeUndefined();
    expect(r.summary).toMatch(/still need/i);
  });

  it('no provider named at all is not refused', async () => {
    const r = await book({});
    expect(r.details?.candidates).toBeUndefined();
    expect(r.summary).toMatch(/still need/i);
  });

  it('name-first precedence is preserved: a tied name still refuses even with an id present', async () => {
    // The dashboard would let `employeeId` win here. This surface has always
    // consulted the name first, and D5 does not change that — only the tie.
    const r = await book({ employeeName: 'Anna', employeeId: 'e2' });
    expect(r.success).toBe(false);
    expect(r.details.candidates).toHaveLength(2);
  });
});

describe('tech-debt D5 — list_services refuses a tied provider', () => {
  const listServices = (params: Record<string, unknown>, locale = 'en') => {
    const svc: any = Object.create(PublicBookingAssistantService.prototype);
    svc.publicBookingService = {
      // Only reached if the guard lets it through; returns an empty catalog so
      // the non-refusal path ends in a normal reply rather than a crash.
      getServices: async () => ({ services: [] }),
    };
    return svc.handleListServices('salon-slug', params, TIED, locale, '');
  };

  it('refuses instead of listing the wrong namesake’s catalog', async () => {
    const r = await listServices({ employeeName: 'Anna' });
    expect(r.success).toBe(false);
    expect(r.action).toBe('list_services');
    expect(r.details.candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('the refusal is localized here too', async () => {
    const en = await listServices({ employeeName: 'Anna' }, 'en');
    const hy = await listServices({ employeeName: 'Anna' }, 'hy');
    expect(hy.summary).not.toBe(en.summary);
    expect(hy.summary).toMatch(/\p{Script=Armenian}/u);
  });

  it('an unambiguous name still lists that provider’s catalog', async () => {
    const r = await listServices({ employeeName: 'Anna Petrova' });
    expect(r.details?.candidates).toBeUndefined();
    expect(r.action).toBe('list_services');
    expect(r.success).toBe(true);
  });
});

describe('tech-debt D5 — attachSession records the typed name, not a guess', () => {
  const attach = (params: Record<string, unknown>) => {
    const svc: any = Object.create(PublicBookingAssistantService.prototype);
    return svc.attachSession(
      { success: true, action: 'x', summary: 's' },
      params,
      TIED,
      [] as Service[],
      'en',
    );
  };

  it('a tie leaves the guest’s own words in session context', () => {
    // No question can be asked here — the result is already built — so the
    // correct behaviour is to not resolve at all rather than persist a
    // namesake that would steer later turns.
    const r = attach({ employeeName: 'Anna' });
    expect(r.sessionContext?.employeeName).toBe('Anna');
  });

  it('an unambiguous name is still resolved to the canonical spelling', () => {
    const r = attach({ employeeName: 'anna petrova' });
    expect(r.sessionContext?.employeeName).toBe('Anna Petrova');
  });
});

