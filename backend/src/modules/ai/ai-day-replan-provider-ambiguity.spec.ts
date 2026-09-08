/**
 * D5 / §232 — `day_replan` refuses an ambiguous provider.
 *
 * The handler scopes its plan to `targets.map((e) => e.id)` and then executes
 * it, so a namesake tie replanned the **wrong provider's whole day** — the
 * largest blast radius in the `e2e-bug.513` set, since a replan moves every
 * appointment in the window rather than one record.
 *
 * Guarded with `resolveEmployeesVerdict`, not `providerNameGuard`: the latter
 * inspects only the singular `employeeName`, while `resolveEmployees` also
 * reads `employeeNames`. That plural path is the bypass slice 8 found on
 * `handleCreateBooking`, so it is asserted here rather than assumed away.
 *
 * `orchestration.executePlan` throws in the harness, so anything slipping past
 * the refusal fails loudly rather than quietly replanning.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';

const employee = (id: string, name: string) =>
  ({ id, name, isActive: true }) as never;

const NAMESAKES = [employee('emp-1', 'John Smith'), employee('emp-2', 'John Smith')];
const DISTINCT = [employee('emp-1', 'John Smith'), employee('emp-2', 'Maria Lopez')];

/**
 * `executing: false` makes `executePlan` throw, so a refusal that leaks fails
 * loudly. The two "should proceed" tests need the opposite — reaching the
 * executor is their whole proof — so they pass `executing: true`. Using the
 * throwing harness for those would fail them for succeeding.
 */
function buildService({ executing = false } = {}) {
  const svc: any = Object.create(AiBookingCoreService.prototype);
  svc.planBuilder = { buildDayReplanPlan: jest.fn(() => ({ steps: [] })) };
  svc.scheduleHandlers = { prepareFillGapsPlan: jest.fn(async () => null) };
  svc.orchestration = {
    executePlan: jest.fn(async () => {
      if (!executing) {
        throw new Error('replanned during an ambiguous provider match');
      }
      return { success: true, steps: [], results: [] };
    }),
  };
  return svc;
}

const call = (svc: any, params: Record<string, unknown>, employees: unknown[]) =>
  svc.handleDayReplan(
    'biz-1',
    'replan tomorrow for John',
    { date: '2026-08-20', ...params },
    employees,
    [],
    'UTC',
    'user-1',
  );

describe('day_replan provider ambiguity (D5, §232)', () => {
  it('replans nothing when two providers share the named person', async () => {
    const svc = buildService();
    const result: any = await call(svc, { employeeName: 'John Smith' }, NAMESAKES);

    expect(result.success).toBe(false);
    expect(svc.orchestration.executePlan).not.toHaveBeenCalled();
    expect(svc.planBuilder.buildDayReplanPlan).not.toHaveBeenCalled();
  });

  it('names both candidates and which name was ambiguous', async () => {
    const result: any = await call(
      buildService(),
      { employeeName: 'John Smith' },
      NAMESAKES,
    );

    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('John Smith');
    expect(
      (result.details.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['emp-1', 'emp-2']);
  });

  it('catches the tie through the plural `employeeNames` too', async () => {
    // `providerNameGuard` would miss this — it reads only `employeeName`.
    // Slice 8 found the same bypass on `handleCreateBooking`.
    const result: any = await call(
      buildService(),
      { employeeNames: ['John Smith'] },
      NAMESAKES,
    );

    expect(result.success).toBe(false);
    expect(result.details?.requestedName).toBe('John Smith');
  });

  it('does not treat "all providers" as ambiguous', async () => {
    const svc = buildService({ executing: true });
    const result: any = await call(svc, { allProviders: true }, NAMESAKES);

    expect(result.details?.candidates).toBeUndefined();
  });

  it('proceeds for an unambiguous provider', async () => {
    const svc = buildService({ executing: true });
    const result: any = await call(svc, { employeeName: 'John Smith' }, DISTINCT);

    expect(result.details?.candidates).toBeUndefined();
    expect(svc.planBuilder.buildDayReplanPlan).toHaveBeenCalled();
  });
});
