/**
 * e2e-bug.443 shape / §223 — the patient-chart customer resolver.
 *
 * `resolveCustomerForPatientChart` used to load an arbitrary 200 customers and
 * match in memory, on both its id-prefix and its name branch. `take` with no
 * `order` is a storage-ordered slice, so past 200 customers a real patient was
 * simply not in the set and silently failed to resolve — and *which* 200 came
 * back could differ between identical calls. `resolvePatientForClinicalMutation`
 * was fixed for exactly this; these two branches were missed.
 *
 * **These tests assert the query, not the result.** The correctness now lives
 * in what SQL is asked for — the existing suite's `customerRepo.find` mock
 * returns the same row regardless of `where`, so 61 tests passed against the
 * broken version and would pass against a broken replacement. Asserting the
 * filter is the only thing that can fail if the cap ever goes back to bounding
 * arbitrary rows instead of matching ones.
 */
import { ILike } from 'typeorm';
import { resolveCustomerForPatientChart } from './ai-clinic-patient-chart.util.js';

const maria = {
  id: 'cust-maria',
  name: 'Maria Lopez',
  businessId: 'biz-1',
  isActive: true,
};

const makeDeps = (rows: unknown[] = [maria], byId: unknown = null) =>
  ({
    customerRepo: {
      find: jest.fn(async () => rows),
      findOne: jest.fn(async () => byId),
    },
  }) as never;

describe('resolveCustomerForPatientChart asks the database to filter', () => {
  it('filters by name in SQL, scoped to active customers, in a deterministic order', async () => {
    const deps = makeDeps();
    await resolveCustomerForPatientChart(deps, 'biz-1', {
      customerName: 'Maria',
    } as never);

    const call = (deps as never as { customerRepo: { find: jest.Mock } })
      .customerRepo.find.mock.calls[0][0];

    expect(call.where).toMatchObject({
      businessId: 'biz-1',
      isActive: true,
      name: ILike('%maria%'),
    });
    // Without an order the cap selects an arbitrary slice — the whole defect.
    expect(call.order).toBeDefined();
  });

  it('prefers an exact name over a substring rather than taking the first row', async () => {
    // The in-memory version returned `matches[0]`, so "Ann" could beat an exact
    // "Anna" purely on storage order.
    const ann = { ...maria, id: 'cust-ann', name: 'Ann' };
    const anna = { ...maria, id: 'cust-anna', name: 'Anna' };
    const deps = makeDeps([ann, anna]);

    const result = await resolveCustomerForPatientChart(deps, 'biz-1', {
      customerName: 'Anna',
    } as never);

    expect(result?.id).toBe('cust-anna');
  });

  it('matches an id prefix in SQL too, not over an arbitrary page', async () => {
    const deps = makeDeps([maria]);
    await resolveCustomerForPatientChart(deps, 'biz-1', {
      customerId: 'cust-mar',
    } as never);

    const call = (deps as never as { customerRepo: { find: jest.Mock } })
      .customerRepo.find.mock.calls[0][0];

    expect(call.where).toMatchObject({
      businessId: 'biz-1',
      isActive: true,
      id: ILike('cust-mar%'),
    });
    expect(call.order).toBeDefined();
  });

  it('escapes LIKE metacharacters so a name with % is matched literally', async () => {
    const deps = makeDeps([]);
    await resolveCustomerForPatientChart(deps, 'biz-1', {
      customerName: '100% Cotton',
    } as never);

    const call = (deps as never as { customerRepo: { find: jest.Mock } })
      .customerRepo.find.mock.calls[0][0];

    expect(call.where.name).toEqual(ILike('%100\\% cotton%'));
  });

  it('still short-circuits on an exact id without a scan', async () => {
    const deps = makeDeps([], maria);
    const result = await resolveCustomerForPatientChart(deps, 'biz-1', {
      customerId: 'cust-maria',
    } as never);

    expect(result?.id).toBe('cust-maria');
    expect(
      (deps as never as { customerRepo: { find: jest.Mock } }).customerRepo
        .find,
    ).not.toHaveBeenCalled();
  });
});
