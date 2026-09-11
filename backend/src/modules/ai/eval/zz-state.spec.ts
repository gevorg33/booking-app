import { buildDeterministicAccuracyReport } from './ai-command-eval.report.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './ai-command-eval.cases.js';
it('state', () => {
  const cases = [...AI_COMMAND_EVAL_DETERMINISTIC_CASES];
  const r = buildDeterministicAccuracyReport();
  const byId = new Map(cases.map((c) => [c.id, c]));
  console.log(`[s] passed=${r.passed} failed=${r.failed} total=${r.passed + r.failed}`);
  for (const i of [...r.byIntent].filter((x) => x.failed > 0).sort((a, b) => b.failed - a.failed))
    console.log(`[s]   ${i.intent.padEnd(50)} ${i.failed}/${i.total}`);
  console.log('[s] --- configure_stripe_connect detail ---');
  for (const f of r.failures) {
    if (f.intent !== 'configure_stripe_connect') continue;
    console.log(`[s]   "${byId.get(f.id)?.prompt ?? ''}"`);
    console.log(`[s]      ${JSON.stringify(f.errors).slice(0, 150)}`);
  }
  expect(r.failed).toBeGreaterThanOrEqual(0);
});
