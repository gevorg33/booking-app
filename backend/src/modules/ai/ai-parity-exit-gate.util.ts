import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import { AI_FEATURE_EXTRACTION_SEEDS } from './ai-feature-catalog.extraction-seeds.js';
import {
  assertParity42CiGate,
  buildCatalogFreshnessStatus,
} from './ai-parity-4.2.util.js';
import { buildAllowDenyParityExport } from './ai-feature-allow-deny-parity.util.js';
import {
  assertParityGapClosureComplete,
  type ParityGapClosureStatus,
} from './ai-feature-parity-gap-closure.util.js';
import {
  buildAiParityCoverageReport,
  formatCoveragePercent,
} from './ai-feature-parity.util.js';
import { assertParity41CiGate } from './ai-parity-4.1.util.js';
import {
  assertGoalExecutionProbes,
  type GoalExecutionStatus,
} from './ai-goal-execution.util.js';
import { GOAL_EXECUTION_SCENARIOS } from './ai-goal-execution.fixtures.js';
import {
  PARITY_AGENT_TASK_MIN_PASS_RATE,
  PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
  PARITY_FEATURE_COVERAGE_TARGET,
} from './ai-parity-exit-gate.fixtures.js';

export {
  PARITY_AGENT_TASK_MIN_PASS_RATE,
  PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
  PARITY_EXIT_GATE_ROLE_SURFACE_PAIRS,
  PARITY_FEATURE_COVERAGE_TARGET,
} from './ai-parity-exit-gate.fixtures.js';

export interface ParityExitGateCriterion {
  id:
    | 'feature_coverage'
    | 'allow_deny'
    | 'catalog_freshness'
    | 'agent_tasks'
    | 'ci_gate';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'count';
  detail?: string;
}

export interface ParityExitGateResult {
  generatedAt: string;
  met: boolean;
  failures: string[];
  criteria: ParityExitGateCriterion[];
  gapClosure: ParityGapClosureStatus;
  goalExecution: GoalExecutionStatus;
  agentTaskPassRate: number;
  extractionMissingCount: number;
  allowDenyDivergenceCount: number;
}

export function computeGoalExecutionPassRate(
  status: GoalExecutionStatus,
): number {
  const total = GOAL_EXECUTION_SCENARIOS.length + 2;
  const failed = status.errors.length;
  return Math.max(0, (total - failed) / total);
}

/** parity-4 — unified exit gate across coverage, allow/deny, catalog freshness, agent tasks. */
export function buildParityExitGate(
  catalog: readonly AiFeatureCatalogEntry[],
  now = new Date(),
): ParityExitGateResult {
  const report = buildAiParityCoverageReport(catalog, undefined, now);
  const gapClosure = assertParityGapClosureComplete(report);
  const goalExecution = assertGoalExecutionProbes();
  const agentTaskPassRate = computeGoalExecutionPassRate(goalExecution);
  const catalogFreshness = buildCatalogFreshnessStatus(
    AI_FEATURE_EXTRACTION_SEEDS,
    AI_UI_FEATURE_CATALOG,
  );
  const reconciliation = catalogFreshness.reconciliation;

  const allowDenyExport = buildAllowDenyParityExport(catalog, now, {
    includeCapabilityOrphans: false,
  });
  const allowDenyDivergenceCount = allowDenyExport.totalDivergences;
  const allowDenyOverGrantCount = allowDenyExport.overGrantCount;
  const allowDenyUnderGrantCount = allowDenyExport.underGrantCount;

  const minCoverage = Math.min(
    ...report.byRoleSurface.map((row) => row.coveragePercent ?? 0),
  );

  const criteria: ParityExitGateCriterion[] = [
    {
      id: 'feature_coverage',
      label: 'Feature→intent coverage (all roles/surfaces)',
      value: minCoverage,
      target: PARITY_FEATURE_COVERAGE_TARGET,
      comparator: 'gte',
      met: gapClosure.complete,
      unit: 'percent',
      detail: gapClosure.complete
        ? '100% on every role/surface pair'
        : `${gapClosure.errors.length} coverage issue(s)`,
    },
    {
      id: 'allow_deny',
      label: 'Allow/deny divergences (catalog vs access-control.matrix)',
      value: allowDenyDivergenceCount,
      target: PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
      comparator: 'lte',
      met: allowDenyExport.totalDivergences === 0,
      unit: 'count',
      detail:
        allowDenyOverGrantCount > 0 || allowDenyUnderGrantCount > 0
          ? `over=${allowDenyOverGrantCount} under=${allowDenyUnderGrantCount}`
          : 'UI minTier and AI deny lists aligned',
    },
    {
      id: 'catalog_freshness',
      label: 'Catalog freshness (nav/route/permission seeds)',
      value: reconciliation.matchedCount / Math.max(reconciliation.seedCount, 1),
      target: 1,
      comparator: 'gte',
      met: catalogFreshness.complete,
      unit: 'percent',
      detail:
        catalogFreshness.complete
          ? `${reconciliation.seedCount} seeds matched, metadata aligned`
          : `${reconciliation.missingFromCatalog.length} missing, ${catalogFreshness.drift.length} drift`,
    },
    {
      id: 'agent_tasks',
      label: 'Multi-step role tasks (labeled goal set)',
      value: agentTaskPassRate,
      target: PARITY_AGENT_TASK_MIN_PASS_RATE,
      comparator: 'gte',
      met:
        goalExecution.complete &&
        agentTaskPassRate + 1e-9 >= PARITY_AGENT_TASK_MIN_PASS_RATE,
      unit: 'percent',
      detail: `${GOAL_EXECUTION_SCENARIOS.length} labeled scenarios`,
    },
    {
      id: 'ci_gate',
      label: 'CI parity exit gate (parity-4.5)',
      value:
        gapClosure.complete &&
        allowDenyExport.totalDivergences === 0 &&
        catalogFreshness.complete &&
        goalExecution.complete &&
        agentTaskPassRate + 1e-9 >= PARITY_AGENT_TASK_MIN_PASS_RATE
          ? 1
          : 0,
      target: 1,
      comparator: 'gte',
      met:
        gapClosure.complete &&
        allowDenyExport.totalDivergences === 0 &&
        catalogFreshness.complete &&
        goalExecution.complete &&
        agentTaskPassRate + 1e-9 >= PARITY_AGENT_TASK_MIN_PASS_RATE,
      unit: 'percent',
      detail: 'coverage + allow/deny + freshness + agent tasks',
    },
  ];

  const failures: string[] = [];
  if (!gapClosure.complete) failures.push(...gapClosure.errors);
  if (allowDenyExport.totalDivergences > 0) {
    failures.push(
      `allow/deny divergences=${allowDenyExport.totalDivergences} (over=${allowDenyExport.overGrantCount} under=${allowDenyExport.underGrantCount}, target ${PARITY_ALLOW_DENY_DIVERGENCE_TARGET})`,
    );
  }
  if (!catalogFreshness.complete) {
    failures.push(...catalogFreshness.errors.slice(0, 8));
  }
  if (!goalExecution.complete) failures.push(...goalExecution.errors);
  if (agentTaskPassRate + 1e-9 < PARITY_AGENT_TASK_MIN_PASS_RATE) {
    failures.push(
      `agent task pass rate ${formatCoveragePercent(agentTaskPassRate)} below ${formatCoveragePercent(PARITY_AGENT_TASK_MIN_PASS_RATE)}`,
    );
  }

  return {
    generatedAt: now.toISOString(),
    met: criteria.every((row) => row.met),
    failures: [...new Set(failures)],
    criteria,
    gapClosure,
    goalExecution,
    agentTaskPassRate,
    extractionMissingCount: reconciliation.missingFromCatalog.length,
    allowDenyDivergenceCount,
  };
}

/** parity-4.5 — throws when merge-blocking parity exit criteria fail. */
export function assertParityCiGate(
  catalog: readonly AiFeatureCatalogEntry[],
): ParityExitGateResult {
  assertParity42CiGate(AI_FEATURE_EXTRACTION_SEEDS, AI_UI_FEATURE_CATALOG);
  assertParity41CiGate(catalog);

  const result = buildParityExitGate(catalog);
  if (result.met) return result;

  const lines = [
    'AI parity CI gate failed (parity-4.5) — merge blocked.',
    formatParityExitGateReport(result),
  ];
  throw new Error(lines.join('\n'));
}

export function formatParityExitGateReport(result: ParityExitGateResult): string {
  const lines = [
    'AI Feature Parity Exit Gate (parity-4.5)',
    `Generated: ${result.generatedAt}`,
    `Status: ${result.met ? 'PASS' : 'FAIL'}`,
    '',
    'Criteria:',
  ];

  for (const criterion of result.criteria) {
    const value =
      criterion.unit === 'percent'
        ? formatCoveragePercent(criterion.value)
        : String(criterion.value);
    const target =
      criterion.unit === 'percent'
        ? formatCoveragePercent(criterion.target)
        : String(criterion.target);
    lines.push(
      `  ${criterion.met ? '✓' : '✗'} ${criterion.label}: ${value} (target ${criterion.comparator === 'gte' ? '≥' : '≤'} ${target})`,
    );
    if (criterion.detail) lines.push(`      ${criterion.detail}`);
  }

  if (result.failures.length > 0) {
    lines.push('', 'Failures:');
    for (const failure of result.failures.slice(0, 25)) {
      lines.push(`  - ${failure}`);
    }
  }

  return lines.join('\n');
}
