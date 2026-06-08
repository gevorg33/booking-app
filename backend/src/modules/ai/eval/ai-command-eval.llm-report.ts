import { readFileSync } from 'fs';
import { join } from 'path';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import {
  buildIntentScorecards,
  type AiEvalIntentScorecard,
} from './ai-command-eval.report.js';
import {
  runLlmEvalSuite,
  type LlmClassifyFn,
  type LlmEvalRunSummary,
} from './ai-command-eval.llm-runner.js';

export const DEFAULT_LLM_EVAL_BASELINE_PATH = join(
  process.cwd(),
  'src/modules/ai/eval/ai-command-eval.llm-baseline.json',
);

export interface AiEvalLlmBaseline {
  version: number;
  updatedAt: string;
  accuracyFloor: number;
  minTotalCases: number;
  maxTotalTokens: number;
  lastAccuracy?: number;
  lastLlmCases?: number;
  note?: string;
}

export interface AiEvalLlmReport {
  generatedAt: string;
  path: 'llm';
  totalCases: number;
  evaluatedCases: number;
  skippedCases: number;
  passed: number;
  failed: number;
  accuracy: number;
  totalTokensUsed: number;
  stoppedEarlyReason?: string;
  baseline: AiEvalLlmBaseline;
  baselineAccuracy: number;
  lastRecordedAccuracy?: number;
  accuracyDelta: number;
  accuracyDeltaVsLast?: number;
  totalCasesDelta: number;
  gatePassed: boolean;
  gateFailures: string[];
  driftDetected: boolean;
  failedCaseIds: string[];
  byIntent: AiEvalIntentScorecard[];
  bySurface: Array<{
    key: string;
    total: number;
    passed: number;
    failed: number;
    accuracy: number;
  }>;
  results: LlmEvalRunSummary['results'];
}

export function loadLlmEvalBaseline(
  baselinePath = DEFAULT_LLM_EVAL_BASELINE_PATH,
): AiEvalLlmBaseline {
  const raw = readFileSync(baselinePath, 'utf8');
  const baseline = JSON.parse(raw) as AiEvalLlmBaseline;
  const errors = validateLlmEvalBaseline(baseline);
  if (errors.length > 0) {
    throw new Error(
      `Invalid ai-command-eval.llm-baseline.json:\n${errors.map((line) => `  - ${line}`).join('\n')}`,
    );
  }
  return baseline;
}

export function validateLlmEvalBaseline(baseline: AiEvalLlmBaseline): string[] {
  const errors: string[] = [];
  if (baseline.accuracyFloor < 0 || baseline.accuracyFloor > 1) {
    errors.push(
      `accuracyFloor must be between 0 and 1, got ${baseline.accuracyFloor}`,
    );
  }
  if (!Number.isInteger(baseline.minTotalCases) || baseline.minTotalCases < 1) {
    errors.push(
      `minTotalCases must be a positive integer, got ${baseline.minTotalCases}`,
    );
  }
  if (
    !Number.isInteger(baseline.maxTotalTokens) ||
    baseline.maxTotalTokens < 1
  ) {
    errors.push(
      `maxTotalTokens must be a positive integer, got ${baseline.maxTotalTokens}`,
    );
  }
  if (
    baseline.lastAccuracy !== undefined &&
    (baseline.lastAccuracy < 0 || baseline.lastAccuracy > 1)
  ) {
    errors.push(
      `lastAccuracy must be between 0 and 1, got ${baseline.lastAccuracy}`,
    );
  }
  return errors;
}

export function buildLlmEvalReportFromSummary(
  allLlmCases: AiCommandEvalCase[],
  summary: LlmEvalRunSummary,
  baseline: AiEvalLlmBaseline,
): AiEvalLlmReport {
  const evaluatedCases = summary.results.length;
  const accuracy = evaluatedCases ? summary.passed / evaluatedCases : 0;
  const gateFailures: string[] = [];

  if (evaluatedCases < baseline.minTotalCases) {
    gateFailures.push(
      `evaluated LLM case count ${evaluatedCases} below minimum ${baseline.minTotalCases}`,
    );
  }
  if (accuracy + 1e-9 < baseline.accuracyFloor) {
    gateFailures.push(
      `LLM-path accuracy ${(accuracy * 100).toFixed(2)}% below floor ${(baseline.accuracyFloor * 100).toFixed(2)}%`,
    );
  }
  if (summary.totalTokensUsed > baseline.maxTotalTokens) {
    gateFailures.push(
      `token usage ${summary.totalTokensUsed} exceeded baseline cap ${baseline.maxTotalTokens}`,
    );
  }

  const bySurfaceMap = new Map<string, { total: number; passed: number }>();
  for (const result of summary.results) {
    const row = bySurfaceMap.get(result.surface) ?? { total: 0, passed: 0 };
    row.total += 1;
    if (result.passed) row.passed += 1;
    bySurfaceMap.set(result.surface, row);
  }

  const byIntent = buildIntentScorecards(
    summary.results.map((result) => ({
      id: result.id,
      prompt: '',
      expect: { action: result.expectedAction },
    })),
    summary.results,
  );

  const lastRecordedAccuracy = baseline.lastAccuracy;
  const driftDetected =
    gateFailures.length > 0 ||
    summary.failed > 0 ||
    (lastRecordedAccuracy !== undefined &&
      accuracy + 1e-9 < lastRecordedAccuracy);

  return {
    generatedAt: new Date().toISOString(),
    path: 'llm',
    totalCases: allLlmCases.length,
    evaluatedCases,
    skippedCases: summary.skipped,
    passed: summary.passed,
    failed: summary.failed,
    accuracy,
    totalTokensUsed: summary.totalTokensUsed,
    stoppedEarlyReason: summary.stoppedEarlyReason,
    baseline,
    baselineAccuracy: baseline.accuracyFloor,
    lastRecordedAccuracy,
    accuracyDelta: accuracy - baseline.accuracyFloor,
    accuracyDeltaVsLast:
      lastRecordedAccuracy !== undefined
        ? accuracy - lastRecordedAccuracy
        : undefined,
    totalCasesDelta: evaluatedCases - baseline.minTotalCases,
    gatePassed: gateFailures.length === 0 && summary.failed === 0,
    gateFailures,
    driftDetected,
    failedCaseIds: summary.results
      .filter((result) => !result.passed)
      .map((result) => result.id),
    byIntent,
    bySurface: [...bySurfaceMap.entries()]
      .map(([key, row]) => ({
        key,
        total: row.total,
        passed: row.passed,
        failed: row.total - row.passed,
        accuracy: row.total ? row.passed / row.total : 0,
      }))
      .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key)),
    results: summary.results,
  };
}

export async function buildLlmEvalReport(
  llmCases: AiCommandEvalCase[],
  baseline: AiEvalLlmBaseline,
  classify: LlmClassifyFn,
  timeZone = 'UTC',
): Promise<AiEvalLlmReport> {
  const summary = await runLlmEvalSuite(llmCases, {
    classify,
    timeZone,
    costBounds: {
      maxCases: baseline.minTotalCases,
      maxTotalTokens: baseline.maxTotalTokens,
    },
  });
  return buildLlmEvalReportFromSummary(llmCases, summary, baseline);
}

export function formatLlmEvalReport(report: AiEvalLlmReport): string {
  const lines = [
    `AI LLM-path eval report (${report.generatedAt})`,
    `LLM cases: ${report.passed}/${report.evaluatedCases} passed (${(report.accuracy * 100).toFixed(2)}%)`,
    `Catalog total: ${report.totalCases} · skipped: ${report.skippedCases}`,
    `Tokens used: ${report.totalTokensUsed} (cap ${report.baseline.maxTotalTokens})`,
    `Baseline floor: ${(report.baselineAccuracy * 100).toFixed(2)}% · min cases: ${report.baseline.minTotalCases}`,
    `Delta vs floor: ${report.accuracyDelta >= 0 ? '+' : ''}${(report.accuracyDelta * 100).toFixed(2)} pts`,
  ];

  if (report.lastRecordedAccuracy !== undefined) {
    lines.push(
      `Last LLM baseline: ${(report.lastRecordedAccuracy * 100).toFixed(2)}%`,
      `Delta vs last LLM baseline: ${(report.accuracyDeltaVsLast ?? 0) >= 0 ? '+' : ''}${((report.accuracyDeltaVsLast ?? 0) * 100).toFixed(2)} pts`,
    );
  }

  if (report.stoppedEarlyReason) {
    lines.push(`Stopped early: ${report.stoppedEarlyReason}`);
  }

  lines.push(
    `Drift alert: ${report.driftDetected ? 'TRIGGERED' : 'clear'}`,
    `Gate: ${report.gatePassed ? 'PASS' : 'FAIL'}`,
  );

  if (report.gateFailures.length > 0) {
    lines.push(`Gate failures: ${report.gateFailures.join('; ')}`);
  }
  if (report.failedCaseIds.length > 0) {
    lines.push(`Failed cases: ${report.failedCaseIds.join(', ')}`);
  }
  if (report.bySurface.length > 0) {
    lines.push('', 'By surface:');
    for (const row of report.bySurface) {
      lines.push(
        `  ${row.key}: ${row.passed}/${row.total} (${(row.accuracy * 100).toFixed(1)}%)`,
      );
    }
  }

  return lines.join('\n');
}

/** acc-2.10 — throws when LLM-path accuracy regresses or drift is detected. */
export function assertLlmEvalDriftGate(report: AiEvalLlmReport): void {
  if (report.gatePassed && !report.driftDetected) {
    return;
  }

  const sections = [
    'AI LLM-path drift gate failed (acc-2.10) — nightly alert.',
    formatLlmEvalReport(report),
  ];

  if (report.gateFailures.length > 0) {
    sections.push('', 'Gate failures:', ...report.gateFailures.map((line) => `  - ${line}`));
  }

  if (report.failedCaseIds.length > 0) {
    sections.push(
      '',
      'Failed LLM eval cases:',
      ...report.failedCaseIds.map((id) => `  - ${id}`),
    );
  }

  throw new Error(sections.join('\n'));
}
