/**
 * A6 slice-totals probe — **not a test**, hence `.probe.ts` (e2e-bug.473).
 *
 * It opens a real Postgres connection and reads `ai_command_trace` to report
 * how much traffic each domain carries and how much of it depends on rescue.
 * That makes it useful to run by hand against a populated database, and
 * impossible to pass in CI.
 *
 * While it was named `*.spec.ts` jest collected it, it failed on every sweep,
 * and it occupied a slot in `ai-known-failures.json` as an *accepted* failure —
 * a permanent occupant, since no amount of fixing could ever make it green
 * there. The manifest's rule is that entries leave only by being fixed; an
 * entry that cannot be is exactly the dumping ground that rule exists to stop.
 *
 * Run it deliberately:
 *   npx jest --testMatch "**\/*.probe.ts" src/modules/ai/zzz-a4-probe.probe.ts
 */
import { Client } from 'pg';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
it('slice totals', async () => {
  const c = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await c.connect();
  const rows = (await c.query<{ action: string; n: string; rescued: string }>(
    `select action, count(*)::text n,
            count(*) filter (where action_changed_by='rescue')::text rescued
       from ai_command_trace group by action`,
  )).rows;
  await c.end();
  const byDomain = new Map<string, { n: number; rescued: number }>();
  let unmapped = 0;
  for (const r of rows) {
    const spec = COMMAND_SPECS.find((s) => s.id === r.action || s.aliases.includes(r.action));
    if (!spec) { unmapped += Number(r.n); continue; }
    const b = byDomain.get(spec.domain) ?? { n: 0, rescued: 0 };
    b.n += Number(r.n); b.rescued += Number(r.rescued);
    byDomain.set(spec.domain, b);
  }
  // eslint-disable-next-line no-console
  console.log('\ndomain          slice_traces  rescue_dependent  share\n' +
    [...byDomain].sort((a, b) => b[1].n - a[1].n)
      .map(([d, b]) => `${d.padEnd(14)} ${String(b.n).padStart(6)}       ${String(b.rescued).padStart(6)}      ${((b.rescued / b.n) * 100).toFixed(1)}%`)
      .join('\n') + `\n(unmapped actions: ${unmapped} traces)`);
  expect(byDomain.size).toBeGreaterThan(0);
}, 60000);
