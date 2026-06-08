import { writeFileSync } from 'fs';
import { proposeAccuracyFloorBump } from '../ai-accuracy-ratchet.util.js';
import { buildNoClarifyNear99ExitGateFromRows } from '../ai-n99-no-clarify-completion.util.js';
import type { AiTraceAnalyticsRow } from '../ai-command-trace.util.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';
import {
  DEFAULT_EVAL_BASELINE_PATH,
  loadEvalBaseline,
  type AiEvalBaseline,
} from './ai-command-eval.report.js';
import {
  NO_CLARIFY_GATE_DEFAULTS,
  NO_CLARIFY_RATCHET_STEP,
} from './ai-n99-no-clarify-gate.fixtures.js';

export {
  NO_CLARIFY_DUAL_GATE_SCENARIOS,
  NO_CLARIFY_GATE_DEFAULTS,
  NO_CLARIFY_GATE_TRACE_SCENARIOS,
  NO_CLARIFY_MIN_CASES,
  NO_CLARIFY_MIN_PER_LOCALE,
  NO_CLARIFY_RATCHET_MIN_BUMP_GAP,
  NO_CLARIFY_RATCHET_SCENARIOS,
  NO_CLARIFY_RATCHET_STEP,
  NO_CLARIFY_WRONG_EXEC_SCENARIOS,
} from './ai-n99-no-clarify-gate.fixtures.js';

export interface NoClarifyLocaleScore {
  locale: string;
  total: number;
  passed: number;
  accuracy: number;
}

export interface NoClarifyEvalGateReport {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  floor: number;
  target: number;
  wrongExecutionCeiling: number;
  wrongExecutionRate: number;
  minCases: number;
  minPerLocale: number;
  localeScores: NoClarifyLocaleScore[];
  failedCaseIds: string[];
  gateFailures: string[];
  noClarifyGateMet: boolean;
  wrongExecutionGateMet: boolean;
  dualGateMet: boolean;
  gatePassed: boolean;
  ratchet: ReturnType<typeof proposeNoClarifyFloorBump>;
}

export interface NoClarifyEvalBaselineSlice {
  noClarifyFloor?: number;
  noClarifyMinCases?: number;
  lastNoClarifyAccuracy?: number;
  lastWrongExecutionRate?: number;
}

/** n99-2.9 — acc-2 cases that expect direct completion (not ambiguity/security/clarify). */
export function isAcc2NoClarifyEvalCase(evalCase: AiCommandEvalCase): boolean {
  if (evalCase.requiresLlm) return false;
  if (
    evalCase.corpus === 'ambiguity' ||
    evalCase.corpus === 'adversarial' ||
    evalCase.corpus === 'clarify_followup'
  ) {
    return false;
  }
  if (evalCase.expect.clarifyFields?.length) return false;
  if (evalCase.expect.clarifyFollowup) return false;
  if (evalCase.expect.securityBlocked) return false;
  if (evalCase.difficulty === 'ambiguity' || evalCase.difficulty === 'adversarial') {
    return false;
  }
  return Boolean(
    evalCase.expect.rescuedAction ||
      evalCase.expect.paramsPartial ||
      evalCase.expect.compoundSteps ||
      evalCase.expect.action ||
      evalCase.expect.noClarifyCompletion,
  );
}

export function resolveNoClarifyGateConfig(baseline?: NoClarifyEvalBaselineSlice) {
  return {
    floor: baseline?.noClarifyFloor ?? NO_CLARIFY_GATE_DEFAULTS.floor,
    target: NO_CLARIFY_GATE_DEFAULTS.target,
    wrongExecutionCeiling: NO_CLARIFY_GATE_DEFAULTS.wrongExecutionCeiling,
    minCases:
      baseline?.noClarifyMinCases ?? NO_CLARIFY_GATE_DEFAULTS.minCases,
    minPerLocale: NO_CLARIFY_GATE_DEFAULTS.minPerLocale,
    primaryLocales: NO_CLARIFY_GATE_DEFAULTS.primaryLocales,
  };
}

export function computeWrongExecutionRateFromResults(
  results: AiEvalCaseResult[],
): number {
  const wrongSignals = results.filter((result) =>
    result.errors.some((error) => error.includes('wrongExecution')),
  ).length;
  return results.length ? wrongSignals / results.length : 0;
}

/** n99-2.9 — resolve wrong-execution rate for the dual CI gate (trace > baseline snapshot > eval). */
export function resolveWrongExecutionRateForNoClarifyGate(input: {
  baseline?: NoClarifyEvalBaselineSlice;
  results?: AiEvalCaseResult[];
  traceRows?: AiTraceAnalyticsRow[];
  tracePeriodDays?: number;
}): number {
  if (input.traceRows?.length) {
    return buildNoClarifyNear99ExitGateFromRows(
      input.traceRows,
      input.tracePeriodDays ?? 7,
    ).wrongExecutionRate;
  }
  if (input.baseline?.lastWrongExecutionRate !== undefined) {
    return input.baseline.lastWrongExecutionRate;
  }
  if (input.results?.length) {
    return computeWrongExecutionRateFromResults(input.results);
  }
  return 0;
}

export function buildNoClarifyEvalGateReport(input: {
  cases: AiCommandEvalCase[];
  results: AiEvalCaseResult[];
  baseline?: NoClarifyEvalBaselineSlice;
  wrongExecutionRate?: number;
}): NoClarifyEvalGateReport {
  const config = resolveNoClarifyGateConfig(input.baseline);
  const passed = input.results.filter((result) => result.passed).length;
  const failed = input.results.length - passed;
  const accuracy = input.results.length ? passed / input.results.length : 0;
  const wrongExecutionRate =
    input.wrongExecutionRate ??
    resolveWrongExecutionRateForNoClarifyGate({
      baseline: input.baseline,
      results: input.results,
    });
  const noClarifyGateFailures: string[] = [];
  const gateFailures: string[] = [];

  if (input.results.length < config.minCases) {
    noClarifyGateFailures.push(
      `no_clarify case count ${input.results.length} below minimum ${config.minCases}`,
    );
  }
  if (accuracy + 1e-9 < config.floor) {
    noClarifyGateFailures.push(
      `no_clarify accuracy ${(accuracy * 100).toFixed(2)}% below floor ${(config.floor * 100).toFixed(2)}%`,
    );
  }
  if (failed > 0) {
    noClarifyGateFailures.push(`${failed} no_clarify case(s) failed`);
  }

  const localeBuckets = new Map<string, { total: number; passed: number }>();
  for (let index = 0; index < input.cases.length; index += 1) {
    const evalCase = input.cases[index];
    const result = input.results[index];
    const locale = evalCase.locale ?? 'en';
    const bucket = localeBuckets.get(locale) ?? { total: 0, passed: 0 };
    bucket.total += 1;
    if (result.passed) bucket.passed += 1;
    localeBuckets.set(locale, bucket);
  }

  const localeScores: NoClarifyLocaleScore[] = config.primaryLocales.map(
    (locale) => {
      const bucket = localeBuckets.get(locale) ?? { total: 0, passed: 0 };
      return {
        locale,
        total: bucket.total,
        passed: bucket.passed,
        accuracy: bucket.total ? bucket.passed / bucket.total : 0,
      };
    },
  );

  for (const score of localeScores) {
    if (score.total < config.minPerLocale) {
      noClarifyGateFailures.push(
        `no_clarify ${score.locale.toUpperCase()} sample ${score.total} below minimum ${config.minPerLocale}`,
      );
      continue;
    }
    if (score.accuracy + 1e-9 < config.floor) {
      noClarifyGateFailures.push(
        `no_clarify ${score.locale.toUpperCase()} accuracy ${(score.accuracy * 100).toFixed(2)}% below floor ${(config.floor * 100).toFixed(2)}%`,
      );
    }
  }

  const wrongExecutionGateMet =
    wrongExecutionRate <= config.wrongExecutionCeiling + 1e-9;
  if (!wrongExecutionGateMet) {
    gateFailures.push(
      `wrong_execution ${(wrongExecutionRate * 100).toFixed(2)}% above ceiling ${(config.wrongExecutionCeiling * 100).toFixed(2)}%`,
    );
  }

  const noClarifyGateMet = noClarifyGateFailures.length === 0;
  gateFailures.unshift(...noClarifyGateFailures);
  const dualGateMet = noClarifyGateMet && wrongExecutionGateMet;

  const ratchet = proposeNoClarifyFloorBump({
    currentFloor: config.floor,
    measuredAccuracy: accuracy,
  });

  return {
    total: input.results.length,
    passed,
    failed,
    accuracy,
    floor: config.floor,
    target: config.target,
    wrongExecutionCeiling: config.wrongExecutionCeiling,
    wrongExecutionRate,
    minCases: config.minCases,
    minPerLocale: config.minPerLocale,
    localeScores,
    failedCaseIds: input.results
      .filter((result) => !result.passed)
      .map((result) => result.id),
    gateFailures,
    noClarifyGateMet,
    wrongExecutionGateMet,
    dualGateMet,
    gatePassed: dualGateMet,
    ratchet,
  };
}

export function proposeNoClarifyFloorBump(input: {
  currentFloor: number;
  measuredAccuracy: number;
}) {
  return proposeAccuracyFloorBump({
    currentFloor: input.currentFloor,
    measuredAccuracy: input.measuredAccuracy,
    step: NO_CLARIFY_RATCHET_STEP,
    target: NO_CLARIFY_GATE_DEFAULTS.target,
  });
}

export function assertNoClarifyEvalGate(report: NoClarifyEvalGateReport): void {
  if (report.gatePassed) return;
  throw new Error(
    `n99-2.9 — no_clarify eval gate failed:\n${report.gateFailures.map((line) => `  - ${line}`).join('\n')}`,
  );
}

export function formatNoClarifyEvalGateReport(report: NoClarifyEvalGateReport): string {
  const localeLines = report.localeScores
    .map(
      (score) =>
        `  ${score.locale.toUpperCase()}: ${(score.accuracy * 100).toFixed(1)}% (${score.passed}/${score.total})`,
    )
    .join('\n');
  return [
    `no_clarify accuracy: ${(report.accuracy * 100).toFixed(2)}% (${report.passed}/${report.total})`,
    `wrong_execution: ${(report.wrongExecutionRate * 100).toFixed(2)}% (ceiling ${(report.wrongExecutionCeiling * 100).toFixed(1)}%)`,
    `no_clarify gate: ${report.noClarifyGateMet ? 'PASS' : 'FAIL'}`,
    `wrong_execution gate: ${report.wrongExecutionGateMet ? 'PASS' : 'FAIL'}`,
    `dual gate (n99-2.9): ${report.dualGateMet ? 'PASS' : 'FAIL'}`,
    `floor: ${(report.floor * 100).toFixed(1)}% → target ${(report.target * 100).toFixed(0)}%`,
    localeLines,
    `ratchet: ${report.ratchet.shouldBump ? `eligible → ${(report.ratchet.proposedFloor * 100).toFixed(1)}%` : report.ratchet.reason}`,
  ].join('\n');
}

/** n99-2.9 — bump no_clarify CI floor after a green gate run. */
export function applyNoClarifyFloorRatchet(
  report: NoClarifyEvalGateReport,
  baselinePath = DEFAULT_EVAL_BASELINE_PATH,
): { applied: boolean; baseline: AiEvalBaseline; ratchet: NoClarifyEvalGateReport['ratchet'] } {
  const baseline = loadEvalBaseline(baselinePath);
  if (!report.gatePassed || !report.ratchet.shouldBump) {
    return { applied: false, baseline, ratchet: report.ratchet };
  }

  const nextBaseline: AiEvalBaseline = {
    ...baseline,
    updatedAt: new Date().toISOString().slice(0, 10),
    noClarifyFloor: report.ratchet.proposedFloor,
    lastNoClarifyAccuracy: report.accuracy,
    lastWrongExecutionRate: report.wrongExecutionRate,
    noClarifyRatchetHistory: [
      ...(baseline.noClarifyRatchetHistory ?? []),
      {
        at: new Date().toISOString(),
        from: report.ratchet.currentFloor,
        to: report.ratchet.proposedFloor,
        measuredAccuracy: report.accuracy,
      },
    ],
  };

  writeFileSync(baselinePath, `${JSON.stringify(nextBaseline, null, 2)}\n`);
  return { applied: true, baseline: nextBaseline, ratchet: report.ratchet };
}
