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
