import { writeFileSync } from 'fs';
import { proposeAccuracyFloorBump } from '../ai-accuracy-ratchet.util.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';
import {
  DEFAULT_EVAL_BASELINE_PATH,
  loadEvalBaseline,
  type AiEvalBaseline,
} from './ai-command-eval.report.js';
import {
  CLARIFY_FOLLOWUP_GATE_DEFAULTS,
  CLARIFY_FOLLOWUP_RATCHET_STEP,
} from './ai-n99-clarify-followup-gate.fixtures.js';

export {
  CLARIFY_FOLLOWUP_GATE_DEFAULTS,
  CLARIFY_FOLLOWUP_MIN_CASES,
  CLARIFY_FOLLOWUP_MIN_PER_LOCALE,
  CLARIFY_FOLLOWUP_RATCHET_MIN_BUMP_GAP,
  CLARIFY_FOLLOWUP_RATCHET_SCENARIOS,
  CLARIFY_FOLLOWUP_RATCHET_STEP,
} from './ai-n99-clarify-followup-gate.fixtures.js';

export interface ClarifyFollowupLocaleScore {
  locale: string;
  total: number;
  passed: number;
  accuracy: number;
}

export interface ClarifyFollowupEvalGateReport {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  floor: number;
  target: number;
  minCases: number;
  minPerLocale: number;
  localeScores: ClarifyFollowupLocaleScore[];
  failedCaseIds: string[];
  gateFailures: string[];
  gatePassed: boolean;
  ratchet: ReturnType<typeof proposeClarifyFollowupFloorBump>;
}

export interface ClarifyFollowupEvalBaselineSlice {
  clarifyFollowupFloor?: number;
  clarifyFollowupMinCases?: number;
  lastClarifyFollowupAccuracy?: number;
}

export function resolveClarifyFollowupGateConfig(
  baseline?: ClarifyFollowupEvalBaselineSlice,
) {
  return {
    floor: baseline?.clarifyFollowupFloor ?? CLARIFY_FOLLOWUP_GATE_DEFAULTS.floor,
    target: CLARIFY_FOLLOWUP_GATE_DEFAULTS.target,
    minCases:
      baseline?.clarifyFollowupMinCases ?? CLARIFY_FOLLOWUP_GATE_DEFAULTS.minCases,
    minPerLocale: CLARIFY_FOLLOWUP_GATE_DEFAULTS.minPerLocale,
    primaryLocales: CLARIFY_FOLLOWUP_GATE_DEFAULTS.primaryLocales,
  };
}

export function buildClarifyFollowupEvalGateReport(input: {
  cases: AiCommandEvalCase[];
  results: AiEvalCaseResult[];
  baseline?: ClarifyFollowupEvalBaselineSlice;
}): ClarifyFollowupEvalGateReport {
  const config = resolveClarifyFollowupGateConfig(input.baseline);
  const passed = input.results.filter((result) => result.passed).length;
  const failed = input.results.length - passed;
  const accuracy = input.results.length ? passed / input.results.length : 0;
  const gateFailures: string[] = [];

  if (input.results.length < config.minCases) {
    gateFailures.push(
      `clarify_followup case count ${input.results.length} below minimum ${config.minCases}`,
    );
  }
  if (accuracy + 1e-9 < config.floor) {
    gateFailures.push(
      `clarify_followup accuracy ${(accuracy * 100).toFixed(2)}% below floor ${(config.floor * 100).toFixed(2)}%`,
    );
  }
  if (failed > 0) {
    gateFailures.push(`${failed} clarify_followup case(s) failed`);
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

  const localeScores: ClarifyFollowupLocaleScore[] = config.primaryLocales.map(
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
      gateFailures.push(
        `clarify_followup ${score.locale.toUpperCase()} sample ${score.total} below minimum ${config.minPerLocale}`,
      );
      continue;
    }
    if (score.accuracy + 1e-9 < config.floor) {
      gateFailures.push(
        `clarify_followup ${score.locale.toUpperCase()} accuracy ${(score.accuracy * 100).toFixed(2)}% below floor ${(config.floor * 100).toFixed(2)}%`,
      );
    }
  }

  const ratchet = proposeClarifyFollowupFloorBump({
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
    minCases: config.minCases,
    minPerLocale: config.minPerLocale,
    localeScores,
    failedCaseIds: input.results
      .filter((result) => !result.passed)
      .map((result) => result.id),
    gateFailures,
    gatePassed: gateFailures.length === 0,
    ratchet,
  };
}

export function proposeClarifyFollowupFloorBump(input: {
  currentFloor: number;
  measuredAccuracy: number;
}) {
  return proposeAccuracyFloorBump({
    currentFloor: input.currentFloor,
    measuredAccuracy: input.measuredAccuracy,
    step: CLARIFY_FOLLOWUP_RATCHET_STEP,
    target: CLARIFY_FOLLOWUP_GATE_DEFAULTS.target,
  });
}

export function assertClarifyFollowupEvalGate(
  report: ClarifyFollowupEvalGateReport,
): void {
  if (report.gatePassed) return;
  throw new Error(
    `n99-1.9 — clarify_followup eval gate failed:\n${report.gateFailures.map((line) => `  - ${line}`).join('\n')}`,
  );
}

export function formatClarifyFollowupEvalGateReport(
  report: ClarifyFollowupEvalGateReport,
): string {
  const localeLines = report.localeScores
    .map(
      (score) =>
        `  ${score.locale.toUpperCase()}: ${(score.accuracy * 100).toFixed(1)}% (${score.passed}/${score.total})`,
    )
    .join('\n');
  return [
    `clarify_followup accuracy: ${(report.accuracy * 100).toFixed(2)}% (${report.passed}/${report.total})`,
    `floor: ${(report.floor * 100).toFixed(1)}% → target ${(report.target * 100).toFixed(0)}%`,
    localeLines,
    `ratchet: ${report.ratchet.shouldBump ? `eligible → ${(report.ratchet.proposedFloor * 100).toFixed(1)}%` : report.ratchet.reason}`,
  ].join('\n');
}

/** n99-1.9 — bump clarify_followup CI floor after a green gate run. */
export function applyClarifyFollowupFloorRatchet(
  report: ClarifyFollowupEvalGateReport,
  baselinePath = DEFAULT_EVAL_BASELINE_PATH,
): { applied: boolean; baseline: AiEvalBaseline; ratchet: ClarifyFollowupEvalGateReport['ratchet'] } {
  const baseline = loadEvalBaseline(baselinePath);
  if (!report.gatePassed || !report.ratchet.shouldBump) {
    return { applied: false, baseline, ratchet: report.ratchet };
  }

  const nextBaseline: AiEvalBaseline = {
    ...baseline,
    updatedAt: new Date().toISOString().slice(0, 10),
    clarifyFollowupFloor: report.ratchet.proposedFloor,
    lastClarifyFollowupAccuracy: report.accuracy,
    clarifyFollowupRatchetHistory: [
      ...(baseline.clarifyFollowupRatchetHistory ?? []),
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
