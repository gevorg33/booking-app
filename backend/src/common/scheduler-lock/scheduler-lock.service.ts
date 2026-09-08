import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * e2e-bug.497 — one scheduled run per cluster, not one per instance.
 *
 * Every `@Cron` method in this codebase fires on whichever process happens to
 * be running it. With a single instance that is the same thing as "once"; with
 * more than one it is not, and several of these jobs send things people can
 * see — appointment reminders, marketing sends, push notifications, HITL
 * escalations. Two instances means two of each, which is the kind of defect
 * that only appears once the deployment is scaled and is then hard to attribute
 * back to the scheduler.
 *
 * Postgres advisory locks are used rather than a locks table because they need
 * no schema, no migration, and no cleanup path: the lock lives in the session
 * that took it and disappears when that session ends, including when the
 * instance holding it is killed mid-job. A table-based lock has to model crash
 * recovery (stale-lock expiry, clock skew between instances) to get the same
 * property, and getting that subtly wrong reintroduces exactly the duplicate
 * this exists to prevent.
 *
 * The lock is taken on a **dedicated `QueryRunner`**. Advisory locks are scoped
 * to a database *session*, and TypeORM hands out pooled connections, so
 * `dataSource.query()` for the lock and for the work can land on different
 * sessions — which would release the lock at an arbitrary moment, or leak it.
 * The runner pins one connection for lock, work, and unlock.
 */
/**
 * Stable 64-bit key for a job name (FNV-1a), as a decimal string for `bigint`.
 *
 * Deliberately computed here rather than with Postgres's `hashtext()`. That
 * function is an undocumented internal: it works today, but if a Postgres
 * variant or a future version lacks it the lock query throws — and because this
 * service fails closed, that would silently stop *every* scheduled job rather
 * than duplicate one. A hash we own cannot fail that way, and it keeps the key
 * identical across instances regardless of server version.
 *
 * Folded into the signed range because `pg_try_advisory_lock` takes `bigint`.
 */
export function schedulerLockKey(jobKey: string): string {
  const PRIME = 1099511628211n;
  const MASK = (1n << 64n) - 1n;
  let hash = 14695981039346656037n;
  for (let i = 0; i < jobKey.length; i += 1) {
    hash = ((hash ^ BigInt(jobKey.charCodeAt(i))) * PRIME) & MASK;
  }
  return (hash >= 1n << 63n ? hash - (1n << 64n) : hash).toString();
}

@Injectable()
export class SchedulerLockService {
  private readonly logger = new Logger(SchedulerLockService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Run `work` only if this instance wins the lock for `jobKey`.
   *
   * Returns whether the work ran. Losing the race is normal and logged at
   * debug: it means another instance is already doing it.
   *
   * `pg_try_advisory_lock` is the non-blocking form on purpose. A cron job that
   * queued behind the previous holder would run late and, for the every-5-
   * minutes jobs, could pile up — skipping is correct, because the next tick is
   * already scheduled.
   */
  async runExclusively(
    jobKey: string,
    work: () => Promise<void>,
  ): Promise<boolean> {
    const runner = this.dataSource.createQueryRunner();
    try {
      await runner.connect();
    } catch (err) {
      // Fail closed. The alternative — run anyway when exclusivity cannot be
      // established — is the duplicate-send this service exists to prevent.
      // Nothing real is lost: the lock query is a trivial round-trip that only
      // fails when Postgres is unreachable, and every one of these jobs does
      // database work that would fail moments later anyway.
      this.logger.error(
        `Skipping ${jobKey}: could not open a connection for the scheduler lock — ${
          (err as Error).message
        }`,
      );
      await runner.release().catch(() => undefined);
      return false;
    }

    try {
      let acquired = false;
      try {
        const rows = (await runner.query(
          'SELECT pg_try_advisory_lock($1::bigint) AS locked',
          [schedulerLockKey(jobKey)],
        )) as Array<{ locked: boolean }>;
        acquired = rows[0]?.locked === true;
      } catch (err) {
        this.logger.error(
          `Skipping ${jobKey}: scheduler lock query failed — ${
            (err as Error).message
          }`,
        );
        return false;
      }

      if (!acquired) {
        this.logger.debug(
          `Skipping ${jobKey}: another instance holds the lock`,
        );
        return false;
      }

      try {
        await work();
        return true;
      } finally {
        // Released explicitly rather than left to session teardown, because the
        // runner returns its connection to the pool: an un-released advisory
        // lock would travel with that connection and block every later run.
        await runner
          .query('SELECT pg_advisory_unlock($1::bigint)', [
            schedulerLockKey(jobKey),
          ])
          .catch((err: unknown) =>
            this.logger.error(
              `Failed to release scheduler lock for ${jobKey} — ${
                (err as Error).message
              }`,
            ),
          );
      }
    } finally {
      await runner.release().catch(() => undefined);
    }
  }
}
