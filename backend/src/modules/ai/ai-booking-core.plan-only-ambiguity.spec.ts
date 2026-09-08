/**
 * tech-debt D5-a — `buildCreateBookingPlanOnly` refuses a tied name.
 *
 * This is the site §176 held back. Its signature is `Promise<AgentPlan | null>`
 * and the survey read that as "a refusal is not a plan", concluding a migration
 * would trade a wrong guess for silence.
 *
 * That is not what `null` means on this path. `create_booking` is in
 * `MUST_NOT_SILENTLY_SKIP_ACTIONS` (`compound-command-graph.service.ts`), whose
 * e2e-bug.329 branch turns a null plan into a **stop-and-ask** rather than
 * advancing the compound. `null` is already this function's "I could not build
 * this" channel, so the real trade is guess-vs-refusal — and this command books
 * a real appointment and emails a real customer.
 *
 * The guard runs before `resolveCreateBookingServiceForParams`, so a bare
 * instance reaches it without touching a repository. That is also what these
 * tests rely on: an unguarded tie would fall through to service resolution and
 * throw on the undefined repo, so a regression here fails loudly rather than
 * quietly returning null for the wrong reason.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
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
const cus = (id: string, name: string) => ({ id, name }) as Customer;

const TIED_EMPLOYEES = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];
const TIED_CUSTOMERS = [cus('c1', 'John Smith'), cus('c2', 'John Smyth')];
const SERVICES = [] as Service[];

/**
 * Whether the guard fired is observable only by whether the *next* step ran:
 * both a refusal and a failed service lookup return `null`, so asserting on the
 * return value alone cannot tell them apart. `resolveCreateBookingServiceForParams`
 * is stubbed and its call count is the signal.
 */
const build = (params: Record<string, unknown>) => {
  const reached = jest.fn(async () => ({ service: undefined }) as any);
  (service as any).resolveCreateBookingServiceForParams = reached;
  const promise = service.buildCreateBookingPlanOnly(
    'b1',
    params,
    TIED_EMPLOYEES,
    SERVICES,
    TIED_CUSTOMERS,
    undefined,
    'book it',
  );
  return { promise, reached };
};

describe('D5-a — plan-only create_booking refuses a tie', () => {
  it('refuses a tied provider name before doing any work', async () => {
    const { promise, reached } = build({ employeeName: 'Anna' });
    await expect(promise).resolves.toBeNull();
    expect(reached).not.toHaveBeenCalled();
  });

  it('refuses a tied customer name — who the appointment is for', async () => {
    const { promise, reached } = build({ customerName: 'John' });
    await expect(promise).resolves.toBeNull();
    expect(reached).not.toHaveBeenCalled();
  });

  it('does not refuse when an id is supplied instead of a name', async () => {
    const { promise, reached } = build({ employeeId: 'e1' });
    await promise;
    expect(reached).toHaveBeenCalled();
  });

  it('does not refuse an unambiguous name', async () => {
    const { promise, reached } = build({ employeeName: 'Anna Petrova' });
    await promise;
    expect(reached).toHaveBeenCalled();
  });

  it('ignores a blank or non-string name rather than refusing', async () => {
    const blank = build({ employeeName: '   ' });
    await blank.promise;
    expect(blank.reached).toHaveBeenCalled();

    const wrongType = build({ employeeName: 42 as any });
    await wrongType.promise;
    expect(wrongType.reached).toHaveBeenCalled();
  });
});
