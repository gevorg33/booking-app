import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';
import { normalizeEvalCaseTags } from './ai-command-eval.coverage.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';
import {
  proposeAccuracyFloorBump,
  type AccuracyRatchetProposal,
} from '../ai-accuracy-ratchet.util.js';
import {
  assertRoleSurfaceEvalFloors,
  PARITY_EVAL_MIN_CASES_PER_ROLE_SURFACE,
} from '../ai-parity-eval-floor.util.js';
import {
  buildIntentScorecards,
  formatEvalIntentScorecards,
  formatWeakestIntentScorecards,
  summarizeIntentMetrics,
  type AiEvalIntentMetricsSummary,
  type AiEvalIntentScorecard,
} from './ai-command-eval.scorecard.util.js';

export {
  inferEvalCaseIntent,
  buildIntentScorecards,
  type AiEvalIntentScorecard,
} from './ai-command-eval.scorecard.util.js';

export const DEFAULT_EVAL_BASELINE_PATH = join(
  process.cwd(),
  'src/modules/ai/eval/ai-command-eval.baseline.json',
);

export interface AiEvalBaseline {
  version: number;
  updatedAt: string;
  accuracyFloor: number;
  minTotalCases: number;
  /** acc-2.8 — last green run accuracy snapshot for diff reporting. */
  lastAccuracy?: number;
  /** acc-2.8 — last green run deterministic case count for diff reporting. */
  lastDeterministicCases?: number;
  /** acc-6.4 — history of CI floor ratchet bumps after green releases. */
  ratchetHistory?: Array<{
    at: string;
    from: number;
    to: number;
    measuredAccuracy: number;
  }>;
  /** n99-1.9 — clarify_followup corpus CI floor toward 99%. */
  clarifyFollowupFloor?: number;
  clarifyFollowupMinCases?: number;
  lastClarifyFollowupAccuracy?: number;
  clarifyFollowupRatchetHistory?: Array<{
    at: string;
    from: number;
    to: number;
    measuredAccuracy: number;
  }>;
  /** n99-2.9 — no_clarify corpus CI floor toward 99%. */
  noClarifyFloor?: number;
  noClarifyMinCases?: number;
  lastNoClarifyAccuracy?: number;
  /** n99-2.9 — last green run wrong-execution snapshot for dual CI gate. */
  lastWrongExecutionRate?: number;
  /** parity-4.3 — per role/surface eval accuracy floors (ratchet toward 100%). */
  roleSurfaceEvalFloors?: Record<string, number>;
  minCasesPerRoleSurface?: number;
  /** parity-4.3 — audit trail of role/surface floor ratchet bumps (never lowers). */
  roleSurfaceEvalFloorHistory?: Array<{
    at: string;
    key: string;
    from: number;
    to: number;
    measuredAccuracy: number;
  }>;
  noClarifyRatchetHistory?: Array<{
    at: string;
    from: number;
    to: number;
    measuredAccuracy: number;
  }>;
  note?: string;
}

export interface AiEvalBucketScorecard {
  key: string;
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
}

export interface AiEvalAccuracyReport {
  generatedAt: string;
  totalCases: number;
  deterministicCases: number;
  llmCases: number;
  passed: number;
  failed: number;
  accuracy: number;
  baseline: AiEvalBaseline;
  baselineAccuracy: number;
  baselineTotalCases: number;
  lastRecordedAccuracy?: number;
  lastRecordedDeterministicCases?: number;
  accuracyDelta: number;
  totalCasesDelta: number;
  accuracyDeltaVsLast?: number;
  totalCasesDeltaVsLast?: number;
  gatePassed: boolean;
  gateFailures: string[];
  failedCaseIds: string[];
  byIntent: AiEvalIntentScorecard[];
  intentMetrics: AiEvalIntentMetricsSummary;
  byLocale: AiEvalBucketScorecard[];
  bySurface: AiEvalBucketScorecard[];
  byCorpus: AiEvalBucketScorecard[];
  byDifficulty: AiEvalBucketScorecard[];
  byDomain: AiEvalBucketScorecard[];
  /** parity-4.3 — deterministic eval accuracy per role/surface pair. */
  byRoleSurface: AiEvalBucketScorecard[];
}

export function loadEvalBaseline(
  baselinePath = DEFAULT_EVAL_BASELINE_PATH,
): AiEvalBaseline {
  const raw = readFileSync(baselinePath, 'utf8');
  const baseline = JSON.parse(raw) as AiEvalBaseline;
  const errors = validateEvalBaseline(baseline);
  if (errors.length > 0) {
    throw new Error(
      `Invalid ai-command-eval.baseline.json:\n${errors.map((line) => `  - ${line}`).join('\n')}`,
    );
  }
  return baseline;
}

function bucketScorecards(
  cases: AiCommandEvalCase[],
  results: AiEvalCaseResult[],
  pickKey: (evalCase: AiCommandEvalCase) => string,
): AiEvalBucketScorecard[] {
  const buckets = new Map<string, { total: number; passed: number }>();
  for (let index = 0; index < cases.length; index += 1) {
    const evalCase = cases[index];
    const result = results[index];
    const key = pickKey(evalCase);
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
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

export function buildEvalAccuracyReport(
  allCases: AiCommandEvalCase[],
  deterministicCases: AiCommandEvalCase[],
  baseline: AiEvalBaseline,
  timeZone = 'UTC',
): AiEvalAccuracyReport {
  const llmCases = allCases.filter((entry) => entry.requiresLlm);
  const summary = runDeterministicEvalSuite(deterministicCases, timeZone);
  const accuracy = summary.results.length
    ? summary.passed / summary.results.length
    : 0;
  const baselineAccuracy = baseline.accuracyFloor;
  const lastRecordedAccuracy = baseline.lastAccuracy;
  const lastRecordedDeterministicCases = baseline.lastDeterministicCases;
  const gateFailures: string[] = [];

  if (accuracy + 1e-9 < baseline.accuracyFloor) {
    gateFailures.push(
      `accuracy ${(accuracy * 100).toFixed(2)}% below floor ${(baseline.accuracyFloor * 100).toFixed(2)}%`,
    );
  }
  if (summary.results.length < baseline.minTotalCases) {
    gateFailures.push(
      `deterministic case count ${summary.results.length} below minimum ${baseline.minTotalCases}`,
    );
  }

  const byIntent = buildIntentScorecards(deterministicCases, summary.results);
  const intentMetrics = summarizeIntentMetrics(byIntent);
  const byRoleSurface = assertRoleSurfaceEvalFloors({
    cases: deterministicCases,
    results: summary.results,
    floors: baseline.roleSurfaceEvalFloors ?? {},
    minCasesPerPair:
      baseline.minCasesPerRoleSurface ?? PARITY_EVAL_MIN_CASES_PER_ROLE_SURFACE,
  }).byRoleSurface;

  return {
    generatedAt: new Date().toISOString(),
    totalCases: allCases.length,
    deterministicCases: summary.results.length,
    llmCases: llmCases.length,
    passed: summary.passed,
    failed: summary.failed,
    accuracy,
    baseline,
    baselineAccuracy,
    baselineTotalCases: baseline.minTotalCases,
    lastRecordedAccuracy,
    lastRecordedDeterministicCases,
    accuracyDelta: accuracy - baselineAccuracy,
    totalCasesDelta: summary.results.length - baseline.minTotalCases,
    accuracyDeltaVsLast:
      lastRecordedAccuracy !== undefined
        ? accuracy - lastRecordedAccuracy
        : undefined,
    totalCasesDeltaVsLast:
      lastRecordedDeterministicCases !== undefined
        ? summary.results.length - lastRecordedDeterministicCases
        : undefined,
    gatePassed:
      gateFailures.length === 0 && summary.failed === 0,
    gateFailures,
    failedCaseIds: summary.results
      .filter((result) => !result.passed)
      .map((result) => result.id),
    byIntent,
    intentMetrics,
    byLocale: bucketScorecards(
      deterministicCases,
      summary.results,
      (entry) => entry.locale ?? 'en',
    ),
    bySurface: bucketScorecards(
      deterministicCases,
      summary.results,
      (entry) => entry.surface ?? 'dashboard',
    ),
    byCorpus: bucketScorecards(
      deterministicCases,
      summary.results,
      (entry) => entry.corpus ?? 'golden',
    ),
    byDifficulty: bucketScorecards(
      deterministicCases,
      summary.results,
      (entry) => normalizeEvalCaseTags(entry).difficulty ?? 'easy',
    ),
    byDomain: bucketScorecards(
      deterministicCases,
      summary.results,
      (entry) => normalizeEvalCaseTags(entry).domain ?? 'unknown',
    ),
    byRoleSurface,
  };
}

/** @deprecated Use formatEvalIntentScorecards from scorecard util. */
export function formatEvalIntentBreakdown(
  byIntent: AiEvalIntentScorecard[],
  options: { maxRows?: number } = {},
): string {
  return formatEvalIntentScorecards(byIntent, options);
}

export function formatEvalAccuracyReport(report: AiEvalAccuracyReport): string {
  const lines = [
    `AI eval accuracy report (${report.generatedAt})`,
    `Deterministic: ${report.passed}/${report.deterministicCases} passed (${(report.accuracy * 100).toFixed(2)}%)`,
    `LLM-only cases (excluded from CI): ${report.llmCases}`,
    `Baseline floor: ${(report.baselineAccuracy * 100).toFixed(2)}% · min cases: ${report.baselineTotalCases}`,
    `Delta vs floor: ${report.accuracyDelta >= 0 ? '+' : ''}${(report.accuracyDelta * 100).toFixed(2)} pts · cases ${report.totalCasesDelta >= 0 ? '+' : ''}${report.totalCasesDelta}`,
  ];

  if (
    report.lastRecordedAccuracy !== undefined &&
    report.lastRecordedDeterministicCases !== undefined
  ) {
    lines.push(
      `Last baseline: ${(report.lastRecordedAccuracy * 100).toFixed(2)}% · ${report.lastRecordedDeterministicCases} cases`,
      `Delta vs last baseline: ${(report.accuracyDeltaVsLast ?? 0) >= 0 ? '+' : ''}${((report.accuracyDeltaVsLast ?? 0) * 100).toFixed(2)} pts · cases ${(report.totalCasesDeltaVsLast ?? 0) >= 0 ? '+' : ''}${report.totalCasesDeltaVsLast ?? 0}`,
    );
  }

  lines.push(`Gate: ${report.gatePassed ? 'PASS' : 'FAIL'}`);

  if (report.byRoleSurface.length > 0) {
    lines.push('', 'Per role / surface (parity-4.3):');
    for (const row of report.byRoleSurface) {
      const floor = report.baseline.roleSurfaceEvalFloors?.[row.key];
      const floorText =
        floor != null ? ` · floor ${(floor * 100).toFixed(1)}%` : '';
      lines.push(
        `  ${row.key.padEnd(22)} ${row.passed}/${row.total} (${(row.accuracy * 100).toFixed(1)}%)${floorText}`,
      );
    }
  }

  if (report.gateFailures.length > 0) {
    lines.push(`Gate failures: ${report.gateFailures.join('; ')}`);
  }
  if (report.failedCaseIds.length > 0) {
    lines.push(`Failed cases: ${report.failedCaseIds.slice(0, 20).join(', ')}`);
  }

  lines.push(
    '',
    `Intent metrics: macro P ${(report.intentMetrics.macroPrecision * 100).toFixed(1)}% · R ${(report.intentMetrics.macroRecall * 100).toFixed(1)}% · F1 ${(report.intentMetrics.macroF1 * 100).toFixed(1)}%`,
    `Intent metrics (micro): P ${(report.intentMetrics.microPrecision * 100).toFixed(1)}% · R ${(report.intentMetrics.microRecall * 100).toFixed(1)}% · F1 ${(report.intentMetrics.microF1 * 100).toFixed(1)}%`,
  );

  const weakest = formatWeakestIntentScorecards(report.byIntent);
  if (weakest) {
    lines.push('', weakest);
  }

  lines.push('', formatEvalIntentScorecards(report.byIntent));
  return lines.join('\n');
}

/** acc-2.9 — throws when deterministic accuracy or case count regresses below committed floor. */
export function assertAccuracyFloorGate(report: AiEvalAccuracyReport): void {
  if (report.gatePassed) {
    return;
  }

  const sections = [
    'AI accuracy floor gate failed (acc-2.9) — merge blocked.',
    formatEvalAccuracyReport(report),
  ];

  if (report.gateFailures.length > 0) {
    sections.push('', 'Gate failures:', ...report.gateFailures.map((line) => `  - ${line}`));
  }

  if (report.failedCaseIds.length > 0) {
    sections.push(
      '',
      'Failed eval cases (first 25):',
      ...report.failedCaseIds.slice(0, 25).map((id) => `  - ${id}`),
    );
  }

  sections.push(
    '',
    'Ratchet policy: raise accuracyFloor in ai-command-eval.baseline.json after each green sprint; never lower without review.',
  );

  throw new Error(sections.join('\n'));
}

export function writeEvalBaseline(
  baseline: AiEvalBaseline,
  baselinePath = DEFAULT_EVAL_BASELINE_PATH,
): void {
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

/** acc-6.4 — raise CI accuracy floor after a green eval run (never lowers). */
export function applyAccuracyFloorRatchet(
  report: AiEvalAccuracyReport,
  baselinePath = DEFAULT_EVAL_BASELINE_PATH,
): {
  applied: boolean;
  baseline: AiEvalBaseline;
  ratchet: AccuracyRatchetProposal;
} {
  const baseline = loadEvalBaseline(baselinePath);
  const ratchet = proposeAccuracyFloorBump({
    currentFloor: baseline.accuracyFloor,
    measuredAccuracy: report.accuracy,
  });

  if (!report.gatePassed || !ratchet.shouldBump) {
    return { applied: false, baseline, ratchet };
  }

  const nextBaseline: AiEvalBaseline = {
    ...baseline,
    updatedAt: new Date().toISOString().slice(0, 10),
    accuracyFloor: ratchet.proposedFloor,
    lastAccuracy: report.accuracy,
    lastDeterministicCases: report.deterministicCases,
    ratchetHistory: [
      ...(baseline.ratchetHistory ?? []),
      {
        at: new Date().toISOString(),
        from: baseline.accuracyFloor,
        to: ratchet.proposedFloor,
        measuredAccuracy: report.accuracy,
      },
    ],
  };

  writeEvalBaseline(nextBaseline, baselinePath);
  return { applied: true, baseline: nextBaseline, ratchet };
}

export function validateEvalBaseline(baseline: AiEvalBaseline): string[] {
  const errors: string[] = [];
  if (baseline.accuracyFloor < 0 || baseline.accuracyFloor > 1) {
    errors.push(`accuracyFloor must be between 0 and 1, got ${baseline.accuracyFloor}`);
  }
  if (!Number.isInteger(baseline.minTotalCases) || baseline.minTotalCases < 1) {
    errors.push(`minTotalCases must be a positive integer, got ${baseline.minTotalCases}`);
  }
  if (
    baseline.lastAccuracy !== undefined &&
    (baseline.lastAccuracy < 0 || baseline.lastAccuracy > 1)
  ) {
    errors.push(`lastAccuracy must be between 0 and 1, got ${baseline.lastAccuracy}`);
  }
  if (
    baseline.lastDeterministicCases !== undefined &&
    (!Number.isInteger(baseline.lastDeterministicCases) ||
      baseline.lastDeterministicCases < 1)
  ) {
    errors.push(
      `lastDeterministicCases must be a positive integer, got ${baseline.lastDeterministicCases}`,
    );
  }
  if (
    baseline.clarifyFollowupFloor !== undefined &&
    (baseline.clarifyFollowupFloor < 0 || baseline.clarifyFollowupFloor > 1)
  ) {
    errors.push(
      `clarifyFollowupFloor must be between 0 and 1, got ${baseline.clarifyFollowupFloor}`,
    );
  }
  if (
    baseline.clarifyFollowupMinCases !== undefined &&
    (!Number.isInteger(baseline.clarifyFollowupMinCases) ||
      baseline.clarifyFollowupMinCases < 1)
  ) {
    errors.push(
      `clarifyFollowupMinCases must be a positive integer, got ${baseline.clarifyFollowupMinCases}`,
    );
  }
  if (
    baseline.noClarifyFloor !== undefined &&
    (baseline.noClarifyFloor < 0 || baseline.noClarifyFloor > 1)
  ) {
    errors.push(
      `noClarifyFloor must be between 0 and 1, got ${baseline.noClarifyFloor}`,
    );
  }
  if (
    baseline.noClarifyMinCases !== undefined &&
    (!Number.isInteger(baseline.noClarifyMinCases) || baseline.noClarifyMinCases < 1)
  ) {
    errors.push(
      `noClarifyMinCases must be a positive integer, got ${baseline.noClarifyMinCases}`,
    );
  }
  if (
    baseline.lastNoClarifyAccuracy !== undefined &&
    (baseline.lastNoClarifyAccuracy < 0 || baseline.lastNoClarifyAccuracy > 1)
  ) {
    errors.push(
      `lastNoClarifyAccuracy must be between 0 and 1, got ${baseline.lastNoClarifyAccuracy}`,
    );
  }
  if (
    baseline.lastWrongExecutionRate !== undefined &&
    (baseline.lastWrongExecutionRate < 0 || baseline.lastWrongExecutionRate > 1)
  ) {
    errors.push(
      `lastWrongExecutionRate must be between 0 and 1, got ${baseline.lastWrongExecutionRate}`,
    );
  }
  if (baseline.roleSurfaceEvalFloors) {
    for (const [key, floor] of Object.entries(baseline.roleSurfaceEvalFloors)) {
      if (floor < 0 || floor > 1) {
        errors.push(`roleSurfaceEvalFloors[${key}] must be between 0 and 1, got ${floor}`);
      }
    }
  }
  if (
    baseline.minCasesPerRoleSurface !== undefined &&
    (!Number.isInteger(baseline.minCasesPerRoleSurface) ||
      baseline.minCasesPerRoleSurface < 1)
  ) {
    errors.push(
      `minCasesPerRoleSurface must be a positive integer, got ${baseline.minCasesPerRoleSurface}`,
    );
  }
  return errors;
}
