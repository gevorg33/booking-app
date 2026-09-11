import fs from 'node:fs';
import path from 'node:path';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} from './ai-command-eval.cases.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './ai-command-eval.types.js';

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
export function resolveEvalCaseIntentLabel(
  evalCase: AiCommandEvalCase,
): string {
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
  if (expect.action && expect.useClinicTestResultExtClassifierDetect) {
    return `classifier:${expect.action}`;
  }
  if (expect.action) return expect.action;
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
    const raw = JSON.parse(
      fs.readFileSync(baselinePath, 'utf8'),
    ) as AiAccuracyBaseline;
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
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(baseline, null, 2)}\n`,
    'utf8',
  );
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
    lines.push(
      '',
      'Baseline: (none — run with UPDATE_AI_EVAL_BASELINE=1 to create)',
    );
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
  /** Every ratchet rule this run broke. Empty when the gate passes. */
  violations: AccuracyGateViolation[];
}

export type AccuracyGateViolationCode =
  /** Nothing to ratchet against — the baseline has never been written. */
  | 'no_baseline'
  /** Case count moved, so per-intent percentages are not comparable. */
  | 'stale_baseline'
  /** Total failures rose. */
  | 'more_failures'
  /** An individual intent got worse, even if the total did not. */
  | 'intent_regressed';

export interface AccuracyGateViolation {
  code: AccuracyGateViolationCode;
  message: string;
}

/**
 * Decide whether this run may pass, given the baseline.
 *
 * The rule that is deliberately NOT here: "zero failures". The suite has 404
 * known failures out of 8,464 cases, and a gate that demands zero has never
 * passed once — which meant `exitCode` was pinned at 1, and every check below
 * it (staleness, per-intent regression) sat behind `if (exitCode === 0)` and had
 * never executed. A gate nobody can satisfy is not a gate; it is a permanently
 * red light people learn to walk past, and it was also one of the failures that
 * makes `npm test` red for reasons unrelated to the change under review.
 *
 * So the bar is the baseline, not perfection: 404 may become 403, never 405.
 * The absolute number is debt to be burned down (Phase 2/9), and this is what
 * stops it growing while that happens.
 */
export function evaluateAccuracyRatchet(
  report: AiAccuracyReport,
): AccuracyGateViolation[] {
  const violations: AccuracyGateViolation[] = [];

  if (!report.baseline) {
    violations.push({
      code: 'no_baseline',
      message:
        'No AI accuracy baseline found. Run `npm run test:ai-accuracy:update-baseline` and commit the result.',
    });
    return violations;
  }

  if (report.baseline.totalCases !== report.totalCases) {
    // Comparing per-intent percentages across different corpora silently
    // compares different questions, so this is a hard stop rather than a note.
    violations.push({
      code: 'stale_baseline',
      message:
        `Baseline is stale: baseline has ${report.baseline.totalCases} cases, the suite has ` +
        `${report.totalCases}. Run \`npm run test:ai-accuracy:update-baseline\`.`,
    });
    return violations;
  }

  if (report.failed > report.baseline.failed) {
    violations.push({
      code: 'more_failures',
      message:
        `Failures rose from ${report.baseline.failed} to ${report.failed} ` +
        `(+${report.failed - report.baseline.failed}). The baseline may go down, never up.`,
    });
  }

  const regressed = report.baselineDiff?.regressedIntents ?? [];
  if (regressed.length > 0) {
    // Reported even when the total held steady: one intent losing five cases
    // while another gains five is a regression wearing a disguise.
    const shown = regressed
      .slice(0, 15)
      .map(
        (r) =>
          `    - ${r.intent}: ${r.baselinePct}% → ${r.currentPct}% (${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct}%)`,
      )
      .join('\n');
    violations.push({
      code: 'intent_regressed',
      message:
        `${regressed.length} intent(s) regressed against the baseline:\n${shown}` +
        (regressed.length > 15
          ? `\n    … and ${regressed.length - 15} more`
          : ''),
    });
  }

  return violations;
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
    const previous = report.baseline;
    const baseline = buildAccuracyBaseline(report);
    writeAccuracyBaseline(baseline, options.baselinePath);
    baselineWritten = true;
    console.log(
      `\nWrote baseline → ${options.baselinePath ?? AI_ACCURACY_BASELINE_PATH}`,
    );
    // Updating is how the bar moves, and it can move the wrong way. The freeze
    // ratchet's rule applies here too: never raise a number to make CI pass.
    // Refusing outright would block the legitimate case (the corpus grew), so
    // this says it loudly instead of deciding for the author.
    if (previous && report.failed > previous.failed) {
      console.warn(
        `\n⚠  This baseline is WORSE than the one it replaced: ${previous.failed} → ${report.failed} failures ` +
          `(+${report.failed - previous.failed}). Only do this when the corpus itself changed — ` +
          'never to make a red build green.',
      );
    }
  }

  // Rewriting the baseline is the deliberate act of moving the line, so the
  // run that does it cannot also fail against the line it just moved.
  const violations = options.updateBaseline
    ? []
    : evaluateAccuracyRatchet(report);

  if (violations.length) {
    console.error('\nAI accuracy ratchet failed (acc-2.9):');
    for (const v of violations) console.error(`  [${v.code}] ${v.message}`);
  }

  return {
    report,
    exitCode: violations.length ? 1 : 0,
    baselineWritten,
    violations,
  };
}
