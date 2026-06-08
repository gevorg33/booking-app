import {
  PARITY_AGENT_TASK_MIN_PASS_RATE,
  PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
  PARITY_FEATURE_COVERAGE_TARGET,
} from './ai-parity-exit-gate.fixtures.js';

/** parity-4.5 — ship-blocking exit criteria (Sprint 58). */
export const PARITY_45_EXIT_CRITERIA = [
  {
    id: 'feature_coverage' as const,
    label: '100% feature→intent coverage per role/surface',
    target: PARITY_FEATURE_COVERAGE_TARGET,
    comparator: 'gte' as const,
  },
  {
    id: 'allow_deny' as const,
    label: 'Zero catalog allow/deny divergences',
    target: PARITY_ALLOW_DENY_DIVERGENCE_TARGET,
    comparator: 'lte' as const,
  },
  {
    id: 'agent_tasks' as const,
    label: 'Multi-step role tasks ≥ 95% on labeled goal set',
    target: PARITY_AGENT_TASK_MIN_PASS_RATE,
    comparator: 'gte' as const,
  },
  {
    id: 'catalog_freshness' as const,
    label: 'Catalog freshness (nav/route/permission seeds)',
    target: 1,
    comparator: 'gte' as const,
  },
  {
    id: 'ci_gate' as const,
    label: 'Composite CI parity exit gate',
    target: 1,
    comparator: 'gte' as const,
  },
];
