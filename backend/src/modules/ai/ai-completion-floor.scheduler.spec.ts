/**
 * tech-debt B1 / e2e-bug.366 — the scheduled completion-floor check.
 *
 * The ticket's warning is the thing to test against: *"a cron entry nobody owns
 * produces an alert firing into nowhere, which is worse than no alert because
 * it looks like coverage."* So the assertions are about the job being audibly
 * alive — it reports a breach, it reports its own failure, and it never
 * silently does nothing.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  AiCompletionFloorScheduler,
  loadCommittedFloors,
} from './ai-completion-floor.scheduler.js';
import type { CompletionMeasurement } from './ai-completion-floor.util.js';

type Rows = Record<string, unknown>[];

function buildScheduler(opts: {
  overall?: Rows;
  bySurface?: Rows;
  throwOn?: 'query';
}) {
  const traceRepo = {
    manager: {
      query: async (sql: string) => {
        if (opts.throwOn === 'query') throw new Error('relation does not exist');
        return sql.includes('by_surface')
          ? (opts.bySurface ?? [])
          : (opts.overall ?? []);
      },
    },
  };
  const scheduler = new AiCompletionFloorScheduler(traceRepo as never);

  const logged: { level: string; message: string }[] = [];
  const logger = (scheduler as unknown as { logger: Record<string, unknown> })
    .logger;
  logger.log = (m: string) => logged.push({ level: 'log', message: m });
  logger.error = (m: string) => logged.push({ level: 'error', message: m });
  logger.warn = (m: string) => logged.push({ level: 'warn', message: m });

  return { scheduler, logged };
}

/** Comfortably above every committed floor. */
const HEALTHY = {
  overall: [{ calls: 5362, completion_rate: 64 }],
  bySurface: [
    { surface: 'customer', calls: 3703, completion_rate: 60.6 },
    { surface: 'dashboard', calls: 1161, completion_rate: 67.1 },
    { surface: 'provider', calls: 498, completion_rate: 82.5 },
  ],
};

describe('the committed floors are loadable at runtime', () => {
  it('resolves from src when running from source', () => {
    const floors = loadCommittedFloors();
    expect(typeof floors.overall).toBe('number');
    expect(floors.bySurface).toBeDefined();
  });

  it('is registered as a nest-cli asset, or it will not exist in dist', () => {
    // The failure this guards is invisible in dev: an unshipped asset only
    // breaks once the built image runs.
    const nestCli = JSON.parse(
      require('node:fs').readFileSync(
        join(process.cwd(), 'nest-cli.json'),
        'utf8',
      ),
    ) as { compilerOptions: { assets: { include: string }[] } };

    expect(
      nestCli.compilerOptions.assets.some((a) =>
        a.include.includes('ai-completion-floors.json'),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(process.cwd(), 'src', 'modules', 'ai', 'ai-completion-floors.json'),
      ),
    ).toBe(true);
  });
});

describe('measure() reads the same views as the CLI gate', () => {
  it('maps the aggregate view columns onto the measurement shape', async () => {
    const { scheduler } = buildScheduler(HEALTHY);
    const measurement: CompletionMeasurement = await scheduler.measure();

    expect(measurement.overall).toEqual({ calls: 5362, completionRate: 64 });
    expect(measurement.bySurface).toEqual([
      { surface: 'customer', calls: 3703, completionRate: 60.6 },
      { surface: 'dashboard', calls: 1161, completionRate: 67.1 },
      { surface: 'provider', calls: 498, completionRate: 82.5 },
    ]);
  });

  it('queries the two §28 views by name', async () => {
    const seen: string[] = [];
    const scheduler = new AiCompletionFloorScheduler({
      manager: {
        query: async (sql: string) => {
          seen.push(sql);
          return [];
        },
      },
    } as never);
    await scheduler.measure();

    expect(seen.some((s) => s.includes('ai_command_completion_summary'))).toBe(
      true,
    );
    expect(seen.some((s) => s.includes('ai_command_completion_by_surface'))).toBe(
      true,
    );
  });

  it('survives empty views rather than producing NaN', async () => {
    const { scheduler } = buildScheduler({ overall: [], bySurface: [] });
    const measurement = await scheduler.measure();
    expect(measurement.overall).toEqual({ calls: 0, completionRate: 0 });
    expect(measurement.bySurface).toEqual([]);
  });
});

describe('the daily check is audible', () => {
  it('logs the healthy state, so a quiet day is still evidence it ran', async () => {
    const { scheduler, logged } = buildScheduler(HEALTHY);
    await scheduler.checkCompletionFloorsDaily();

    expect(logged).toHaveLength(1);
    expect(logged[0].level).toBe('log');
    expect(logged[0].message).toContain('Completion floors hold');
    expect(logged[0].message).toContain('5362');
  });

  it('logs an error naming the scope when a floor breaks', async () => {
    const floors = loadCommittedFloors();
    const { scheduler, logged } = buildScheduler({
      overall: [{ calls: 5362, completion_rate: floors.overall - 10 }],
      bySurface: [],
    });
    await scheduler.checkCompletionFloorsDaily();

    const errors = logged.filter((l) => l.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('COMPLETION FLOOR BREACH');
    expect(errors[0].message.toLowerCase()).toContain('overall');
    // the numbers must be in the alert, not just the fact of a breach
    expect(errors[0].message).toContain(String(floors.overall));
  });

  it('reports a per-surface breach separately from overall', async () => {
    const floors = loadCommittedFloors();
    const surface = Object.keys(floors.bySurface)[0];
    const { scheduler, logged } = buildScheduler({
      overall: [{ calls: 5362, completion_rate: 64 }],
      bySurface: [
        {
          surface,
          calls: 3703,
          completion_rate: floors.bySurface[surface] - 5,
        },
      ],
    });
    await scheduler.checkCompletionFloorsDaily();

    const errors = logged.filter((l) => l.level === 'error');
    expect(errors.some((e) => e.message.includes(surface))).toBe(true);
  });

  it('explains a low-volume skip rather than passing silently', async () => {
    // A scope below the minimum call count is not checked. Saying so is what
    // separates "measured and fine" from "not measured at all".
    const { scheduler, logged } = buildScheduler({
      overall: [{ calls: 5362, completion_rate: 64 }],
      bySurface: [{ surface: 'provider', calls: 3, completion_rate: 10 }],
    });
    await scheduler.checkCompletionFloorsDaily();

    expect(logged[0].message).toContain('skipped for low volume');
    expect(logged[0].message).toContain('provider');
    // and it must not have been reported as a breach
    expect(logged.filter((l) => l.level === 'error')).toHaveLength(0);
  });

  it('never throws, but says loudly that it could not run', async () => {
    const { scheduler, logged } = buildScheduler({ throwOn: 'query' });
    await expect(scheduler.checkCompletionFloorsDaily()).resolves.toBeUndefined();

    const errors = logged.filter((l) => l.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('failed to run');
  });
});

describe('the scheduled job never ratchets', () => {
  it('exposes no update/raise path', () => {
    // `--update` rewrites a committed file; that must stay a reviewed change,
    // not a side effect of a scheduled run.
    const methods = Object.getOwnPropertyNames(
      AiCompletionFloorScheduler.prototype,
    );
    expect(methods).not.toContain('update');
    expect(methods).not.toContain('raiseFloors');
    expect(methods.filter((m) => /update|raise|ratchet/i.test(m))).toEqual([]);
  });
});
