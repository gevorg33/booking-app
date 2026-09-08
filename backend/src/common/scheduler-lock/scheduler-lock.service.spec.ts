import {
  SchedulerLockService,
  schedulerLockKey,
} from './scheduler-lock.service.js';

/**
 * e2e-bug.497 — one scheduled run per cluster.
 *
 * The failure this prevents only appears with more than one instance, so it
 * cannot be caught by running the app; these assert the contract directly.
 */
function buildRunner(overrides: Partial<Record<string, unknown>> = {}) {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const runner = {
    connect: jest.fn(async () => undefined),
    release: jest.fn(async () => undefined),
    query: jest.fn(async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      if (sql.includes('pg_try_advisory_lock')) return [{ locked: true }];
      return [];
    }),
    ...overrides,
  };
  return { runner, queries };
}

function buildService(runner: unknown) {
  const dataSource = { createQueryRunner: jest.fn(() => runner) };
  return {
    service: new SchedulerLockService(dataSource as never),
    dataSource,
  };
}

describe('SchedulerLockService (e2e-bug.497)', () => {
  it('runs the work when it wins the lock', async () => {
    const { runner } = buildRunner();
    const { service } = buildService(runner);
    const work = jest.fn(async () => undefined);

    await expect(service.runExclusively('job.a', work)).resolves.toBe(true);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('skips the work when another instance holds the lock', async () => {
    // The whole point: the second instance must do nothing, not queue.
    const { runner } = buildRunner({
      query: jest.fn(async (sql: string) =>
        sql.includes('pg_try_advisory_lock') ? [{ locked: false }] : [],
      ),
    });
    const { service } = buildService(runner);
    const work = jest.fn(async () => undefined);

    await expect(service.runExclusively('job.a', work)).resolves.toBe(false);
    expect(work).not.toHaveBeenCalled();
  });

  it('releases the lock after the work succeeds', async () => {
    const { runner, queries } = buildRunner();
    const { service } = buildService(runner);

    await service.runExclusively('job.a', async () => undefined);

    expect(queries.some((q) => q.sql.includes('pg_advisory_unlock'))).toBe(
      true,
    );
  });

  it('releases the lock when the work throws, and still propagates', async () => {
    // A job that throws must not strand the lock: the connection goes back to
    // the pool, and an un-released advisory lock would travel with it and block
    // every later run of this job.
    const { runner, queries } = buildRunner();
    const { service } = buildService(runner);

    await expect(
      service.runExclusively('job.a', async () => {
        throw new Error('job blew up');
      }),
    ).rejects.toThrow('job blew up');

    expect(queries.some((q) => q.sql.includes('pg_advisory_unlock'))).toBe(
      true,
    );
    expect(runner.release).toHaveBeenCalled();
  });

  it('takes the lock, runs, and unlocks on one connection', async () => {
    // Advisory locks are session-scoped and TypeORM pools connections, so
    // `dataSource.query()` could put the lock and the unlock on different
    // sessions — releasing at an arbitrary moment or leaking the lock.
    const { runner } = buildRunner();
    const { service, dataSource } = buildService(runner);

    await service.runExclusively('job.a', async () => undefined);

    expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
    expect(runner.connect).toHaveBeenCalledTimes(1);
  });

  it('keys the lock on the job name, identically for lock and unlock', async () => {
    const { runner, queries } = buildRunner();
    const { service } = buildService(runner);

    await service.runExclusively(
      'reminder.handleReminders',
      async () => undefined,
    );

    const keyed = queries.filter((q) => q.sql.includes('advisory'));
    expect(keyed).toHaveLength(2);
    // Lock and unlock must derive the same key, or the lock leaks.
    for (const q of keyed) {
      expect(q.params).toEqual([schedulerLockKey('reminder.handleReminders')]);
    }
  });

  describe('schedulerLockKey', () => {
    it('is stable, so every instance computes the same key', () => {
      expect(schedulerLockKey('reminder.handleReminders')).toBe(
        schedulerLockKey('reminder.handleReminders'),
      );
    });

    it('separates different jobs', () => {
      expect(schedulerLockKey('a.b')).not.toBe(schedulerLockKey('a.c'));
    });

    it('stays inside signed 64-bit range, which is what bigint accepts', () => {
      const MIN = -(2n ** 63n);
      const MAX = 2n ** 63n - 1n;
      for (const key of [
        'reminder.handleReminders',
        'marketing-automation.handleReEngagement',
        '',
        'x'.repeat(500),
      ]) {
        const value = BigInt(schedulerLockKey(key));
        expect(value >= MIN && value <= MAX).toBe(true);
      }
    });
  });

  it('fails closed when the connection cannot be opened', async () => {
    // Running anyway would be the duplicate send this exists to prevent.
    const { runner } = buildRunner({
      connect: jest.fn(async () => {
        throw new Error('pool exhausted');
      }),
    });
    const { service } = buildService(runner);
    const work = jest.fn(async () => undefined);

    await expect(service.runExclusively('job.a', work)).resolves.toBe(false);
    expect(work).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('fails closed when the lock query itself fails', async () => {
    const { runner } = buildRunner({
      query: jest.fn(async () => {
        throw new Error('connection reset');
      }),
    });
    const { service } = buildService(runner);
    const work = jest.fn(async () => undefined);

    await expect(service.runExclusively('job.a', work)).resolves.toBe(false);
    expect(work).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('always returns the connection to the pool', async () => {
    const { runner } = buildRunner();
    const { service } = buildService(runner);
    await service.runExclusively('job.a', async () => undefined);
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
});
