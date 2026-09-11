/**
 * tech-debt D5 slice 9 — `executeReadOnlySubIntent` refuses a tied provider.
 *
 * This is the third service carrying its own private `fuzzyMatchByName`, after
 * `AiBookingCoreService` and `PublicBookingAssistantService`. The method
 * dispatches the provider-scoped reads (`list_bookings`, `show_appointments`,
 * …) and passes `resolvedEmployee?.name` down as the heading, so a tie listed
 * one namesake's bookings under a heading bearing that name — wrong data and a
 * label that makes it look right.
 *
 * Driven through the real private method on a prototype instance: nothing in
 * the refusal path touches an injected dependency, and stubbing none of them
 * means a test that slips past the guard fails loudly.
 */
import { AiCommandService } from './ai-command.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';

const emp = (id: string, name: string) => ({ id, name }) as Employee;
const TIED = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];

const CATALOG = {
  employees: TIED,
  services: [],
  customers: [],
  templates: [],
} as any;

const run = (params: Record<string, unknown>, action = 'list_bookings') => {
  const svc: any = Object.create(AiCommandService.prototype);
  return svc.executeReadOnlySubIntent(
    'b1',
    'show annas bookings',
    action,
    params,
    CATALOG,
    'UTC',
  );
};

describe('tech-debt D5 — read-only sub-intent refuses a tied provider', () => {
  it('refuses instead of listing the wrong namesake’s bookings', async () => {
    const r = await run({ employeeName: 'Anna' });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
    expect(r.details.candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('echoes the action it refused, so the caller keeps its context', async () => {
    const r = await run({ employeeName: 'Anna' }, 'show_appointments');
    expect(r.action).toBe('show_appointments');
  });

  it('an explicit employeeId still wins outright, as on the other dashboard callers', async () => {
    // Not the refusal: the id resolves it, so the method proceeds into the
    // switch and fails later on the unstubbed collaborators.
    await expect(
      run({ employeeId: 'e2', employeeName: 'Anna' }),
    ).rejects.toThrow();
  });

  it('an unambiguous provider name is not refused', async () => {
    await expect(run({ employeeName: 'Anna Petrova' })).rejects.toThrow();
  });

  it('a genuine miss is not reported as ambiguity', async () => {
    await expect(run({ employeeName: 'Zebediah' })).rejects.toThrow();
  });
});
