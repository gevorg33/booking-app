import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  PARITY_AGENT_TASK_MIN_PASS_RATE,
  PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
  PARITY_FEATURE_COVERAGE_TARGET,
} from './ai-parity-exit-gate.fixtures.js';
import {
  assertParity45CiGate,
  assertParity45ExitGate,
  buildParity45ExitGate,
  formatParity45ExitGateReport,
  PARITY_45_EXIT_CRITERIA,
} from './ai-parity-4.5.util.js';

describe('ai-parity-4.5 (exit criteria)', () => {
  const catalog = buildAiFeatureCatalog(
    buildCommandRegistry(collectCompoundStepIds(buildCompoundCommandRecipes())),
  );

  it('assertParity45ExitGate passes on live catalog', () => {
    expect(() => assertParity45ExitGate(catalog)).not.toThrow();
  });

  it('assertParity45CiGate passes for enforced CI merge gate', () => {
    expect(() => assertParity45CiGate(catalog)).not.toThrow();
  });

  it.each(PARITY_45_EXIT_CRITERIA)(
    'parity-4.5 exit criterion $id is met on live catalog',
    ({ id }) => {
      const result = buildParity45ExitGate(catalog);
      const criterion = result.criteria.find((row) => row.id === id);
      expect(criterion).toBeDefined();
      expect(criterion?.met).toBe(true);
    },
  );

  it('parity-4.5 — 100% feature coverage on every role/surface', () => {
    const result = buildParity45ExitGate(catalog);
    const coverage = result.criteria.find((row) => row.id === 'feature_coverage');
    expect(coverage?.met).toBe(true);
    expect(coverage?.value).toBeGreaterThanOrEqual(PARITY_FEATURE_COVERAGE_TARGET);
    expect(result.gapClosure.complete).toBe(true);
  });

  it('parity-4.5 — zero allow/deny divergences', () => {
    const result = buildParity45ExitGate(catalog);
    const allowDeny = result.criteria.find((row) => row.id === 'allow_deny');
    expect(allowDeny?.met).toBe(true);
    expect(result.allowDenyDivergenceCount).toBe(PARITY_ALLOW_DENY_DIVERGENCE_TARGET);
  });

  it('parity-4.5 — agent multi-step tasks ≥ 95%', () => {
    const result = buildParity45ExitGate(catalog);
    const agentTasks = result.criteria.find((row) => row.id === 'agent_tasks');
    expect(agentTasks?.met).toBe(true);
    expect(result.agentTaskPassRate).toBeGreaterThanOrEqual(PARITY_AGENT_TASK_MIN_PASS_RATE);
    expect(result.goalExecution.complete).toBe(true);
  });

  it('parity-4.5 — composite CI gate includes agent tasks', () => {
    const result = buildParity45ExitGate(catalog);
    const ciGate = result.criteria.find((row) => row.id === 'ci_gate');
    expect(ciGate?.met).toBe(true);
    expect(result.met).toBe(true);
  });

  it('formats parity-4.5 exit gate report', () => {
    const result = buildParity45ExitGate(catalog);
    const text = formatParity45ExitGateReport(result);
    expect(text).toContain('AI Feature Parity Exit Gate (parity-4.5)');
    expect(text).toContain('100% feature→intent coverage');

    if (process.env.PARITY_45_REPORT === '1') {
      console.log(text);
    }
  });
});
