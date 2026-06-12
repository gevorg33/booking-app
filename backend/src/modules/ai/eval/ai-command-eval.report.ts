import fs from 'node:fs';
import path from 'node:path';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} from './ai-command-eval.cases.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';

export interface IntentAccuracyStats {
  intent: string;
  passed: number;
  failed: number;
  total: number;
  accuracyPct: number;
}

export interface AiAccuracyBaseline {
  version: 1;
  generatedAt: string;
  totalCases: number;
  passed: number;
  failed: number;
  accuracyPct: number;
  llmCaseCount: number;
  byIntent: Record<
    string,
    { passed: number; failed: number; total: number; accuracyPct: number }
  >;
}

export interface IntentAccuracyDiff {
  intent: string;
  baselinePct: number;
  currentPct: number;
  deltaPct: number;
  baselineFailed: number;
  currentFailed: number;
}

export interface AiAccuracyReport {
  totalCases: number;
  passed: number;
  failed: number;
  accuracyPct: number;
  llmCaseCount: number;
  skippedLlmCases: number;
  byIntent: IntentAccuracyStats[];
  failures: Array<{ id: string; intent: string; errors: string[] }>;
  baseline: AiAccuracyBaseline | null;
  baselineDiff: {
    accuracyDeltaPct: number;
    regressedIntents: IntentAccuracyDiff[];
    improvedIntents: IntentAccuracyDiff[];
    newIntents: string[];
    removedIntents: string[];
  } | null;
}

const EVAL_DIR = path.join(__dirname);
export const AI_ACCURACY_BASELINE_PATH = path.join(
  EVAL_DIR,
  'ai-command-eval.baseline.json',
);

/** Primary intent label for scorecard grouping. */
export function resolveEvalCaseIntentLabel(evalCase: AiCommandEvalCase): string {
  const { expect } = evalCase;
  if (expect.useSemanticIntentMatch && expect.semanticMatchAction) {
    if (expect.implicationTopIntent) {
      return `implication:${expect.implicationTopIntent}:${expect.semanticMatchAction}`;
    }
    return `semantic:${expect.semanticMatchAction}`;
  }
  if (expect.implicationTopIntent && expect.rescuedAction) {
    return `implication:${expect.implicationTopIntent}:${expect.rescuedAction}`;
  }
  if (expect.rescuedAction) return expect.rescuedAction;
  if (expect.compoundSteps?.length) {
    return `compound:${expect.compoundSteps.join('+')}`;
  }
  if (expect.compoundActionsContains?.length) {
    return `compound:contains:${[...expect.compoundActionsContains].sort().join('+')}`;
  }
  if (expect.compoundExpectEmpty) return 'compound:none';
  if (expect.expectValidationClarify) {
    return `clarify:${expect.validationAction ?? 'unknown'}`;
  }
  if (expect.compoundMinSteps !== undefined) return 'compound:decomposition';
  if (expect.phiGuard) return 'phi_guard';
  if (expect.routeTier) return `route:${expect.routeTier}`;
  if (expect.rescheduleTimeSlot || expect.rescheduleFromTimeSlot) {
    return 'reschedule_parse';
  }
  if (expect.needsMultilingual !== undefined) return 'multilingual_detection';
  if (expect.paramsPartial) return 'params_parse';
  return 'misc';
}

function roundPct(passed: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((passed / total) * 10_000) / 100;
}

export function buildIntentAccuracyStats(
  cases: AiCommandEvalCase[],
  results: AiEvalCaseResult[],
): IntentAccuracyStats[] {
  const byIntent = new Map<string, { passed: number; failed: number }>();

  for (let index = 0; index < cases.length; index++) {
    const evalCase = cases[index];
    const result = results[index];
    const intent = resolveEvalCaseIntentLabel(evalCase);
    const bucket = byIntent.get(intent) ?? { passed: 0, failed: 0 };
    if (result.passed) bucket.passed += 1;
    else bucket.failed += 1;
    byIntent.set(intent, bucket);
  }

  return [...byIntent.entries()]
    .map(([intent, stats]) => {
      const total = stats.passed + stats.failed;
      return {
        intent,
        passed: stats.passed,
        failed: stats.failed,
        total,
        accuracyPct: roundPct(stats.passed, total),
      };
    })
    .sort((a, b) =>
      a.intent.localeCompare(b.intent, undefined, { sensitivity: 'base' }),
    );
}

export function buildAccuracyBaseline(
  report: Omit<AiAccuracyReport, 'baseline' | 'baselineDiff'>,
): AiAccuracyBaseline {
  const byIntent: AiAccuracyBaseline['byIntent'] = {};
  for (const row of report.byIntent) {
    byIntent[row.intent] = {
      passed: row.passed,
      failed: row.failed,
      total: row.total,
      accuracyPct: row.accuracyPct,
    };
  }
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalCases: report.totalCases,
    passed: report.passed,
    failed: report.failed,
    accuracyPct: report.accuracyPct,
    llmCaseCount: report.llmCaseCount,
    byIntent,
  };
}

export function loadAccuracyBaseline(
  baselinePath = AI_ACCURACY_BASELINE_PATH,
): AiAccuracyBaseline | null {
  if (!fs.existsSync(baselinePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as AiAccuracyBaseline;
    if (raw.version !== 1) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeAccuracyBaseline(
  baseline: AiAccuracyBaseline,
  baselinePath = AI_ACCURACY_BASELINE_PATH,
): void {
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

export function diffAccuracyAgainstBaseline(
  current: IntentAccuracyStats[],
  baseline: AiAccuracyBaseline,
  currentAccuracyPct: number,
): NonNullable<AiAccuracyReport['baselineDiff']> {
  const regressedIntents: IntentAccuracyDiff[] = [];
  const improvedIntents: IntentAccuracyDiff[] = [];
  const newIntents: string[] = [];
  const removedIntents: string[] = [];

  const currentMap = new Map(current.map((row) => [row.intent, row]));
  const baselineIntents = new Set(Object.keys(baseline.byIntent));

  for (const row of current) {
    const base = baseline.byIntent[row.intent];
    if (!base) {
      newIntents.push(row.intent);
      continue;
    }
    const deltaPct = roundPct(row.passed, row.total) - base.accuracyPct;
    if (deltaPct < 0 || (base.failed === 0 && row.failed > 0)) {
      regressedIntents.push({
        intent: row.intent,
        baselinePct: base.accuracyPct,
        currentPct: row.accuracyPct,
        deltaPct,
        baselineFailed: base.failed,
        currentFailed: row.failed,
      });
    } else if (deltaPct > 0 || (base.failed > 0 && row.failed === 0)) {
      improvedIntents.push({
        intent: row.intent,
        baselinePct: base.accuracyPct,
        currentPct: row.accuracyPct,
        deltaPct,
        baselineFailed: base.failed,
        currentFailed: row.failed,
      });
    }
  }

  for (const intent of baselineIntents) {
    if (!currentMap.has(intent)) removedIntents.push(intent);
  }

  regressedIntents.sort((a, b) => a.deltaPct - b.deltaPct);
  improvedIntents.sort((a, b) => b.deltaPct - a.deltaPct);
  newIntents.sort();
  removedIntents.sort();

  return {
    accuracyDeltaPct: currentAccuracyPct - baseline.accuracyPct,
    regressedIntents,
    improvedIntents,
    newIntents,
    removedIntents,
  };
}

export function buildDeterministicAccuracyReport(
  cases: AiCommandEvalCase[] = AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  options: {
    timeZone?: string;
    baselinePath?: string;
  } = {},
): AiAccuracyReport {
  const ciCases = cases.filter((c) => !c.requiresLlm);
  const summary = runDeterministicEvalSuite(ciCases, options.timeZone);
  const byIntent = buildIntentAccuracyStats(ciCases, summary.results);
  const failures = summary.results
    .map((result, index) => ({
      result,
      evalCase: ciCases[index],
    }))
    .filter(({ result }) => !result.passed)
    .map(({ result, evalCase }) => ({
      id: result.id,
      intent: resolveEvalCaseIntentLabel(evalCase),
      errors: result.errors,
    }));

  const reportCore = {
    totalCases: summary.results.length,
    passed: summary.passed,
    failed: summary.failed,
    accuracyPct: roundPct(summary.passed, summary.results.length),
    llmCaseCount: AI_COMMAND_EVAL_LLM_CASES.length,
    skippedLlmCases: cases.filter((c) => c.requiresLlm).length,
    byIntent,
    failures,
  };

  const baseline = loadAccuracyBaseline(options.baselinePath);
  const baselineDiff = baseline
    ? diffAccuracyAgainstBaseline(byIntent, baseline, reportCore.accuracyPct)
    : null;

  return {
    ...reportCore,
    baseline,
    baselineDiff,
  };
}

export function formatAccuracyReport(report: AiAccuracyReport): string {
  const lines: string[] = [
    'AI deterministic accuracy report (acc-2.8)',
    '==========================================',
    `Cases:   ${report.passed}/${report.totalCases} passed (${report.accuracyPct}%)`,
    `Failed:  ${report.failed}`,
    `LLM-only cases (skipped): ${report.llmCaseCount}`,
    '',
    'Per-intent breakdown:',
  ];

  for (const row of report.byIntent) {
    const marker = row.failed > 0 ? '✗' : '✓';
    lines.push(
      `  ${marker} ${row.intent}: ${row.passed}/${row.total} (${row.accuracyPct}%)`,
    );
  }

  if (report.baseline) {
    lines.push('', 'Baseline diff:');
    lines.push(
      `  Overall accuracy delta: ${report.baselineDiff!.accuracyDeltaPct >= 0 ? '+' : ''}${report.baselineDiff!.accuracyDeltaPct}% (baseline ${report.baseline.accuracyPct}%)`,
    );
    if (report.baselineDiff!.regressedIntents.length) {
      lines.push('  Regressed intents:');
      for (const row of report.baselineDiff!.regressedIntents) {
        lines.push(
          `    - ${row.intent}: ${row.baselinePct}% → ${row.currentPct}% (${row.deltaPct >= 0 ? '+' : ''}${row.deltaPct}%)`,
        );
      }
    }
    if (report.baselineDiff!.improvedIntents.length) {
      lines.push('  Improved intents:');
      for (const row of report.baselineDiff!.improvedIntents.slice(0, 10)) {
        lines.push(
          `    - ${row.intent}: ${row.baselinePct}% → ${row.currentPct}% (+${row.deltaPct}%)`,
        );
      }
      if (report.baselineDiff!.improvedIntents.length > 10) {
        lines.push(
          `    … and ${report.baselineDiff!.improvedIntents.length - 10} more`,
        );
      }
    }
    if (report.baselineDiff!.newIntents.length) {
      lines.push(`  New intents: ${report.baselineDiff!.newIntents.length}`);
    }
    if (report.baselineDiff!.removedIntents.length) {
      lines.push(
        `  Removed intents: ${report.baselineDiff!.removedIntents.join(', ')}`,
      );
    }
  } else {
    lines.push('', 'Baseline: (none — run with UPDATE_AI_EVAL_BASELINE=1 to create)');
  }

  if (report.failures.length) {
    lines.push('', 'Failures:');
    for (const failure of report.failures.slice(0, 25)) {
      lines.push(`  - ${failure.id} [${failure.intent}]`);
      for (const error of failure.errors) {
        lines.push(`      ${error}`);
      }
    }
    if (report.failures.length > 25) {
      lines.push(`  … and ${report.failures.length - 25} more`);
    }
  }

  return lines.join('\n');
}

export interface AiAccuracyGateResult {
  report: AiAccuracyReport;
  exitCode: number;
  baselineWritten: boolean;
}

/** CLI + CI entry for acc-2.8. */
export function runAiAccuracyGate(
  options: {
    updateBaseline?: boolean;
    baselinePath?: string;
    timeZone?: string;
    cases?: AiCommandEvalCase[];
  } = {},
): AiAccuracyGateResult {
  const report = buildDeterministicAccuracyReport(options.cases, {
    timeZone: options.timeZone,
    baselinePath: options.baselinePath,
  });

  console.log(formatAccuracyReport(report));

  let baselineWritten = false;
  if (options.updateBaseline) {
    const baseline = buildAccuracyBaseline(report);
    writeAccuracyBaseline(baseline, options.baselinePath);
    baselineWritten = true;
    console.log(
      `\nWrote baseline → ${options.baselinePath ?? AI_ACCURACY_BASELINE_PATH}`,
    );
  }

  let exitCode = report.failed > 0 ? 1 : 0;
  if (exitCode === 0 && !options.updateBaseline && report.baseline) {
    if (report.baseline.totalCases !== report.totalCases) {
      exitCode = 1;
      console.error(
        `\nAI accuracy baseline is stale (acc-2.9): baseline ${report.baseline.totalCases} cases, suite ${report.totalCases} cases. Run npm run test:ai-accuracy:update-baseline.`,
      );
    } else if (
      report.baselineDiff &&
      report.baselineDiff.regressedIntents.length > 0
    ) {
      exitCode = 1;
      console.error(
        `\nAI accuracy baseline ratchet failed (acc-2.9): ${report.baselineDiff.regressedIntents.length} regressed intent(s)`,
      );
      for (const row of report.baselineDiff.regressedIntents.slice(0, 15)) {
        console.error(
          `  - ${row.intent}: ${row.baselinePct}% → ${row.currentPct}% (${row.deltaPct >= 0 ? '+' : ''}${row.deltaPct}%)`,
        );
      }
      if (report.baselineDiff.regressedIntents.length > 15) {
        console.error(
          `  … and ${report.baselineDiff.regressedIntents.length - 15} more`,
        );
      }
    }
  }

  return { report, exitCode, baselineWritten };
}
