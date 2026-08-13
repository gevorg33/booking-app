/**
 * tech-debt B1 / e2e-bug.366 — scheduling the completion-floor gate.
 *
 * `scripts/ai-completion-floor-gate.mjs` worked and nothing invoked it. The
 * ticket left it unscheduled because "cadence and alert destination are ops
 * decisions", and *"a cron entry nobody owns produces an alert firing into
 * nowhere, which is worse than no alert because it looks like coverage."*
 *
 * ## Why this is a NestJS scheduler and not a cron entry
 *
 * The first checkbox asks for "a runner with database access". The repo already
 * had one: `@nestjs/schedule` is a dependency and five schedulers already run
 * this way, two of them in this module (`ai-platform.scheduler.ts`,
 * `ai-autopilot.scheduler.ts`). Running in-process means the check uses the
 * app's existing TypeORM connection — no second set of DB credentials, no
 * `.env` parsing from a cron shell, no host-level scheduling to maintain, and
 * it works unchanged wherever the backend is deployed.
 *
 * ## Why this job never ratchets
 *
 * The ticket asks for "a separate, less frequent cadence for `--update`". It
 * should not be scheduled at all. `--update` rewrites
 * `ai-completion-floors.json`, a **committed** file, and the script's own
 * reasoning is that giving ground must be "a decision somebody signs, not a
 * side effect of a scheduled run". A container writing to its own ephemeral
 * copy of the repo would either change nothing or change something nobody
 * reviews. Ratcheting therefore stays the manual path:
 *
 *     node scripts/ai-completion-floor-gate.mjs --update   # then commit the diff
 *
 * This job only ever *reads*.
 *
 * ## Known limitation
 *
 * With more than one backend instance this fires once per instance, so a breach
 * alerts N times. That is true of all five existing schedulers and is filed
 * separately rather than solved here for one of them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import {
  checkCompletionFloors,
  type CompletionFloors,
  type CompletionMeasurement,
  type FloorCheckResult,
} from './ai-completion-floor.util.js';

/**
 * The committed floors, read the way this codebase already reads JSON assets
 * (`ai-guide-corpus-i18n.fixtures.ts`) — from `dist/` when built, `src/` when
 * running from source.
 *
 * Deliberately not an `import ... with { type: 'json' }`: `resolveJsonModule`
 * is off, no other file in `src/` imports JSON, and `nest-cli.json` only copies
 * `modules/ai/guide/*.json` into `dist`. That import compiles and works in dev,
 * then fails in production because the file was never shipped. The asset is now
 * registered in `nest-cli.json` alongside the guide corpus.
 */
const FLOORS_REL = join('modules', 'ai', 'ai-completion-floors.json');

let cachedFloors: CompletionFloors | null = null;

export function loadCommittedFloors(): CompletionFloors {
  if (cachedFloors) return cachedFloors;
  const candidates = [
    join(process.cwd(), 'dist', FLOORS_REL),
    join(process.cwd(), 'src', FLOORS_REL),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      cachedFloors = JSON.parse(readFileSync(path, 'utf8')) as CompletionFloors;
      return cachedFloors;
    }
  }
  throw new Error(`missing completion floors: ${candidates.join(' or ')}`);
}

/** The §28 aggregate views the gate script reads. */
const OVERALL_VIEW = 'ai_command_completion_summary';
const BY_SURFACE_VIEW = 'ai_command_completion_by_surface';

export interface FloorBreachReport {
  measurement: CompletionMeasurement;
  result: FloorCheckResult;
}

@Injectable()
export class AiCompletionFloorScheduler {
  private readonly logger = new Logger(AiCompletionFloorScheduler.name);

  constructor(
    @InjectRepository(AiCommandTrace)
    private readonly traceRepo: Repository<AiCommandTrace>,
  ) {}

  /**
   * Read the aggregate views through the app's own connection.
   *
   * Deliberately the same two views the script queries, so the scheduled number
   * and the number a human gets from the CLI cannot disagree.
   */
  async measure(): Promise<CompletionMeasurement> {
    const manager = this.traceRepo.manager;
    const overall = await manager.query(
      `SELECT calls, completion_rate FROM ${OVERALL_VIEW}`,
    );
    const surfaces = await manager.query(
      `SELECT surface, calls, completion_rate FROM ${BY_SURFACE_VIEW}`,
    );

    return {
      overall: {
        calls: Number(overall?.[0]?.calls ?? 0),
        completionRate: Number(overall?.[0]?.completion_rate ?? 0),
      },
      bySurface: (surfaces ?? []).map(
        (row: { surface: string; calls: unknown; completion_rate: unknown }) => ({
          surface: row.surface,
          calls: Number(row.calls),
          completionRate: Number(row.completion_rate),
        }),
      ),
    };
  }

  /**
   * The check itself, separated from the schedule so it is callable and
   * testable without waiting for a cron tick.
   */
  async runCheck(): Promise<FloorBreachReport> {
    const measurement = await this.measure();
    const result = checkCompletionFloors(measurement, loadCommittedFloors());
    return { measurement, result };
  }

  /**
   * Daily.
   *
   * The ticket's own reasoning: floors sit two points below the measured rate,
   * and a real slide takes more than a day to show through thousands of traces.
   * Anything more frequent re-reports the same state; anything less lets a
   * regression sit for a week.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkCompletionFloorsDaily(): Promise<void> {
    try {
      const { measurement, result } = await this.runCheck();

      if (result.breaches.length === 0) {
        this.logger.log(
          `Completion floors hold — overall ${measurement.overall.completionRate}% ` +
            `of ${measurement.overall.calls} calls` +
            (result.skipped.length
              ? `; skipped for low volume: ${result.skipped
                  .map((s) => `${s.scope} (${s.calls} calls)`)
                  .join(', ')}`
              : ''),
        );
        return;
      }

      this.report({ measurement, result });
    } catch (err: unknown) {
      // A monitoring job must not take the process down. But a *silent* failure
      // is the exact "looks like coverage" problem the ticket warns about, so
      // this is logged at error level, not warn.
      this.logger.error(
        `Completion floor check failed to run: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Where a breach goes.
   *
   * Isolated as one method so the destination is a single, obvious seam: today
   * it is a structured error log, which every deployment already collects.
   * Pointing it at a webhook or an ops table is a change here and nowhere else.
   */
  report(report: FloorBreachReport): void {
    for (const breach of report.result.breaches) {
      // `FloorBreach.message` is already the formatted sentence the util
      // produces; rebuilding it here would let the two drift.
      this.logger.error(`COMPLETION FLOOR BREACH — ${breach.message}`);
    }
  }
}
