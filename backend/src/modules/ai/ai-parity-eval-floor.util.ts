import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import {
  inferEvalCaseSurface,
  normalizeEvalCaseTags,
} from './eval/ai-command-eval.coverage.util.js';
import type { AiEvalCaseResult } from './eval/ai-command-eval.types.js';
import {
  loadEvalBaseline,
  writeEvalBaseline,
  type AiEvalBaseline,
} from './eval/ai-command-eval.report.js';
import type { AiEvalBucketScorecard } from './eval/ai-command-eval.report.js';
import { proposeAccuracyFloorBump } from './ai-accuracy-ratchet.util.js';
import { PARITY_EXIT_GATE_ROLE_SURFACE_PAIRS } from './ai-parity-exit-gate.fixtures.js';
import { formatCoveragePercent } from './ai-feature-parity.util.js';
import {
  ROLE_SURFACE_EVAL_RATCHET_SCENARIOS,
  ROLE_SURFACE_EVAL_RATCHET_STEP,
  ROLE_SURFACE_EVAL_RATCHET_TARGET,
} from './ai-parity-eval-floor.fixtures.js';

export {
  ROLE_SURFACE_EVAL_RATCHET_SCENARIOS,
  ROLE_SURFACE_EVAL_RATCHET_STEP,
  ROLE_SURFACE_EVAL_RATCHET_TARGET,
} from './ai-parity-eval-floor.fixtures.js';

export const PARITY_EVAL_MIN_CASES_PER_ROLE_SURFACE = 3;

export const PARITY_ROLE_SURFACE_EVAL_PAIRS = PARITY_EXIT_GATE_ROLE_SURFACE_PAIRS;

function defaultAccessTierForSurface(surface: CommandSurface): AccessTier {
  if (surface === 'provider') return 'staff';
  if (surface === 'customer' || surface === 'public') return 'client';
  return 'owner';
}

export function roleSurfaceEvalKey(tier: AccessTier, surface: CommandSurface): string {
  return `${tier}:${surface}`;
}

export function inferEvalRoleSurface(evalCase: AiCommandEvalCase): {
  tier: AccessTier;
  surface: CommandSurface;
} {
  const normalized = normalizeEvalCaseTags(evalCase);
  const surface = normalized.surface ?? inferEvalCaseSurface(evalCase);
  const tier = evalCase.accessTier ?? defaultAccessTierForSurface(surface);
  return { tier, surface };
}

/** parity-4.3 — bucket deterministic eval accuracy by role/surface. */
export function buildRoleSurfaceEvalScorecards(
  cases: AiCommandEvalCase[],
  results: AiEvalCaseResult[],
): AiEvalBucketScorecard[] {
  const buckets = new Map<string, { total: number; passed: number }>();

  for (let index = 0; index < cases.length; index += 1) {
    const evalCase = cases[index];
    const result = results[index];
    const { tier, surface } = inferEvalRoleSurface(evalCase);
    const key = roleSurfaceEvalKey(tier, surface);
    const row = buckets.get(key) ?? { total: 0, passed: 0 };
    row.total += 1;
    if (result.passed) row.passed += 1;
    buckets.set(key, row);
  }

  return [...buckets.entries()]
    .map(([key, row]) => ({
      key,
      total: row.total,
      passed: row.passed,
      failed: row.total - row.passed,
      accuracy: row.total ? row.passed / row.total : 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export interface RoleSurfaceEvalFloorStatus {
  complete: boolean;
  errors: string[];
  byRoleSurface: AiEvalBucketScorecard[];
}

/** parity-4.3 — each role/surface pair needs eval cases and meets its floor. */
export function assertRoleSurfaceEvalFloors(input: {
  cases: AiCommandEvalCase[];
  results: AiEvalCaseResult[];
  floors: Record<string, number>;
  minCasesPerPair?: number;
}): RoleSurfaceEvalFloorStatus {
  const minCases = input.minCasesPerPair ?? PARITY_EVAL_MIN_CASES_PER_ROLE_SURFACE;
  const scorecards = buildRoleSurfaceEvalScorecards(input.cases, input.results);
  const byKey = new Map(scorecards.map((row) => [row.key, row]));
  const errors: string[] = [];

  for (const pair of PARITY_ROLE_SURFACE_EVAL_PAIRS) {
    const key = roleSurfaceEvalKey(pair.tier, pair.surface);
    const row = byKey.get(key);
    const floor = input.floors[key] ?? 1;

    if (!row || row.total < minCases) {
      errors.push(
        `${key} eval coverage — ${row?.total ?? 0} case(s), need ≥${minCases}`,
      );
      continue;
    }

    if (row.accuracy + 1e-9 < floor) {
      errors.push(
        `${key} eval accuracy ${formatCoveragePercent(row.accuracy)} below floor ${formatCoveragePercent(floor)} (${row.passed}/${row.total})`,
      );
    }
  }

  return {
    complete: errors.length === 0,
    errors,
    byRoleSurface: scorecards,
  };
}

export interface RoleSurfaceEvalFloorBump {
  key: string;
  shouldBump: boolean;
  currentFloor: number;
  measuredAccuracy: number;
  proposedFloor: number;
  reason: string;
}

/** parity-4.3 — propose raising per role/surface floors after a green run (never lowers). */
export function proposeRoleSurfaceFloorBumps(input: {
  scorecards: readonly AiEvalBucketScorecard[];
  floors: Record<string, number>;
  step?: number;
  target?: number;
}): RoleSurfaceEvalFloorBump[] {
  const byKey = new Map(input.scorecards.map((row) => [row.key, row]));
  const step = input.step ?? ROLE_SURFACE_EVAL_RATCHET_STEP;
  const target = input.target ?? ROLE_SURFACE_EVAL_RATCHET_TARGET;

  return PARITY_ROLE_SURFACE_EVAL_PAIRS.map((pair) => {
    const key = roleSurfaceEvalKey(pair.tier, pair.surface);
    const row = byKey.get(key);
    const currentFloor = input.floors[key] ?? target;
    const proposal = proposeAccuracyFloorBump({
      currentFloor,
      measuredAccuracy: row?.accuracy ?? 0,
      step,
      target,
    });
    return { key, ...proposal };
  });
}

/** parity-4.3 — throws when any role/surface eval bucket is below its committed floor. */
export function assertRoleSurfaceEvalFloorGate(input: {
  cases: AiCommandEvalCase[];
  results: AiEvalCaseResult[];
  floors: Record<string, number>;
  minCasesPerPair?: number;
}): RoleSurfaceEvalFloorStatus {
  const status = assertRoleSurfaceEvalFloors(input);
  if (status.complete) return status;

  throw new Error(
    [
      'Role/surface eval floor gate failed (parity-4.3) — merge blocked.',
      'Raise roleSurfaceEvalFloors in ai-command-eval.baseline.json after green sprints; never lower without review.',
      ...status.errors.map((line) => `  - ${line}`),
    ].join('\n'),
  );
}

/** parity-4.3 — bump role/surface floors in baseline when gate is green (never lowers). */
export function applyRoleSurfaceEvalFloorRatchet(
  status: RoleSurfaceEvalFloorStatus,
  floors: Record<string, number>,
  baselinePath?: string,
): {
  applied: boolean;
  bumps: RoleSurfaceEvalFloorBump[];
  baseline: AiEvalBaseline;
} {
  const baseline = loadEvalBaseline(baselinePath);
  const bumps = proposeRoleSurfaceFloorBumps({
    scorecards: status.byRoleSurface,
    floors,
  });

  if (!status.complete) {
    return { applied: false, bumps, baseline };
  }

  const eligible = bumps.filter((row) => row.shouldBump);
  if (eligible.length === 0) {
    return { applied: false, bumps, baseline };
  }

  const nextFloors = { ...floors };
  const history = [...(baseline.roleSurfaceEvalFloorHistory ?? [])];

  for (const bump of eligible) {
    nextFloors[bump.key] = Math.max(nextFloors[bump.key] ?? 0, bump.proposedFloor);
    history.push({
      at: new Date().toISOString(),
      key: bump.key,
      from: bump.currentFloor,
      to: nextFloors[bump.key],
      measuredAccuracy: bump.measuredAccuracy,
    });
  }

  const nextBaseline: AiEvalBaseline = {
    ...baseline,
    updatedAt: new Date().toISOString().slice(0, 10),
    roleSurfaceEvalFloors: nextFloors,
    roleSurfaceEvalFloorHistory: history,
  };

  writeEvalBaseline(nextBaseline, baselinePath);
  return { applied: true, bumps, baseline: nextBaseline };
}

export function formatRoleSurfaceEvalFloorReport(
  status: RoleSurfaceEvalFloorStatus,
  options?: {
    floors?: Record<string, number>;
    ratchet?: readonly RoleSurfaceEvalFloorBump[];
  },
): string {
  const lines = [
    'AI Parity Role/Surface Eval Floors (parity-4.3)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    '',
    'Per role / surface:',
  ];

  const ratchetByKey = new Map(
    (options?.ratchet ?? []).map((row) => [row.key, row]),
  );

  for (const pair of PARITY_ROLE_SURFACE_EVAL_PAIRS) {
    const key = roleSurfaceEvalKey(pair.tier, pair.surface);
    const row = status.byRoleSurface.find((entry) => entry.key === key);
    const floor = options?.floors?.[key];
    const measured = row
      ? `${row.passed}/${row.total} (${formatCoveragePercent(row.accuracy)})`
      : 'n/a';
    const floorText =
      floor != null ? ` · floor ${formatCoveragePercent(floor)}` : '';
    const bump = ratchetByKey.get(key);
    const ratchetText =
      bump?.shouldBump === true
        ? ` · ratchet → ${formatCoveragePercent(bump.proposedFloor)}`
        : '';
    lines.push(`  ${key.padEnd(22)} ${measured}${floorText}${ratchetText}`);
  }

  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join('\n');
}
