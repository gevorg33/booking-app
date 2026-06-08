import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';

export function inferEvalCaseIntent(evalCase: AiCommandEvalCase): string {
  const { expect } = evalCase;
  if (expect.securityBlocked) return 'security_blocked';
  if (expect.clarifyAction) return `clarify:${expect.clarifyAction}`;
  if (expect.rescuedAction) return expect.rescuedAction;
  if (expect.compoundSteps?.length) return expect.compoundSteps.join('+');
  if (expect.compoundActionsContains?.length) {
    return [...expect.compoundActionsContains].sort().join('+');
  }
  if (expect.phiGuard) return 'phi_guard';
  if (expect.routeTier) return `route:${expect.routeTier}`;
  return 'other';
}

export const EVAL_FAILED_PREDICTION = '__eval_failed__';

export interface AiEvalIntentScorecard {
  intent: string;
  /** Gold-label support (cases expecting this intent). */
  total: number;
  passed: number;
  failed: number;
  /** Per-intent pass rate (= recall when failures map to non-intent buckets). */
  accuracy: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface AiEvalIntentMetricsSummary {
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  microPrecision: number;
  microRecall: number;
  microF1: number;
}

export interface AiEvalIntentConfusionRow {
  goldIntent: string;
  predictedIntent: string;
  count: number;
}

function safeRate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 1;
}

function f1Score(precision: number, recall: number): number {
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

function average(values: number[]): number {
  if (values.length === 0) return 1;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Infer what the deterministic eval observed when a case fails (acc-2.11). */
export function inferEvalPredictedIntent(
  evalCase: AiCommandEvalCase,
  result: AiEvalCaseResult,
): string {
  if (result.passed) {
    return inferEvalCaseIntent(evalCase);
  }

  for (const error of result.errors) {
    const rescuedMatch = error.match(/^rescuedAction: expected .+, got (.+)$/);
    if (rescuedMatch) {
      const action = rescuedMatch[1];
      return action === 'none' ? EVAL_FAILED_PREDICTION : action;
    }

    const compoundMatch = error.match(
      /^compoundSteps: expected \[(.+)\], got \[(.+)\]$/,
    );
    if (compoundMatch) {
      return compoundMatch[2]
        .split(',')
        .map((step) => step.trim())
        .filter(Boolean)
        .join('+');
    }

    const routeMatch = error.match(/^routeTier: expected .+, got (.+)$/);
    if (routeMatch) {
      return `route:${routeMatch[1]}`;
    }

    if (error.startsWith('securityBlocked:')) {
      return evalCase.expect.securityBlocked
        ? '__security_allowed__'
        : 'security_blocked';
    }

    if (error.startsWith('clarifyFields:')) {
      return evalCase.expect.clarifyAction
        ? `clarify:${evalCase.expect.clarifyAction}`
        : EVAL_FAILED_PREDICTION;
    }

    if (error.startsWith('phiGuard.')) {
      return 'phi_guard';
    }
  }

  return EVAL_FAILED_PREDICTION;
}

export function buildIntentConfusionMatrix(
  cases: AiCommandEvalCase[],
  results: AiEvalCaseResult[],
): AiEvalIntentConfusionRow[] {
  const counts = new Map<string, number>();

  for (let index = 0; index < cases.length; index += 1) {
    const evalCase = cases[index];
    const result = results[index];
    const goldIntent = inferEvalCaseIntent(evalCase);
    const predictedIntent = inferEvalPredictedIntent(evalCase, result);
    const key = `${goldIntent}\0${predictedIntent}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [goldIntent, predictedIntent] = key.split('\0');
      return { goldIntent, predictedIntent, count };
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.goldIntent.localeCompare(b.goldIntent) ||
        a.predictedIntent.localeCompare(b.predictedIntent),
    );
}

export function buildIntentScorecards(
  cases: AiCommandEvalCase[],
  results: AiEvalCaseResult[],
): AiEvalIntentScorecard[] {
  const confusion = buildIntentConfusionMatrix(cases, results);
  const goldCounts = new Map<string, number>();
  const predictedCounts = new Map<string, number>();
  const truePositiveCounts = new Map<string, number>();

  for (const row of confusion) {
    goldCounts.set(row.goldIntent, (goldCounts.get(row.goldIntent) ?? 0) + row.count);
    if (row.predictedIntent !== EVAL_FAILED_PREDICTION) {
      predictedCounts.set(
        row.predictedIntent,
        (predictedCounts.get(row.predictedIntent) ?? 0) + row.count,
      );
    }
    if (row.goldIntent === row.predictedIntent) {
      truePositiveCounts.set(
        row.goldIntent,
        (truePositiveCounts.get(row.goldIntent) ?? 0) + row.count,
      );
    }
  }

  const intents = [...goldCounts.keys()].sort((a, b) => a.localeCompare(b));

  return intents.map((intent) => {
    const total = goldCounts.get(intent) ?? 0;
    const truePositives = truePositiveCounts.get(intent) ?? 0;
    const falseNegatives = total - truePositives;
    const falsePositives = (predictedCounts.get(intent) ?? 0) - truePositives;
    const passed = truePositives;
    const failed = falseNegatives;
    const precision = safeRate(truePositives, truePositives + falsePositives);
    const recall = safeRate(truePositives, total);

    return {
      intent,
      total,
      passed,
      failed,
      accuracy: recall,
      truePositives,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1: f1Score(precision, recall),
    };
  });
}

export function summarizeIntentMetrics(
  scorecards: AiEvalIntentScorecard[],
): AiEvalIntentMetricsSummary {
  const supported = scorecards.filter((row) => row.total > 0);
  const totalTp = supported.reduce((sum, row) => sum + row.truePositives, 0);
  const totalFp = supported.reduce((sum, row) => sum + row.falsePositives, 0);
  const totalFn = supported.reduce((sum, row) => sum + row.falseNegatives, 0);

  const microPrecision = safeRate(totalTp, totalTp + totalFp);
  const microRecall = safeRate(totalTp, totalTp + totalFn);

  return {
    macroPrecision: average(supported.map((row) => row.precision)),
    macroRecall: average(supported.map((row) => row.recall)),
    macroF1: average(supported.map((row) => row.f1)),
    microPrecision,
    microRecall,
    microF1: f1Score(microPrecision, microRecall),
  };
}

export function formatEvalIntentScorecards(
  scorecards: AiEvalIntentScorecard[],
  options: { maxRows?: number; sortBy?: 'volume' | 'f1' } = {},
): string {
  const maxRows = options.maxRows ?? 40;
  const sortBy = options.sortBy ?? 'volume';
  const lines = ['Per-intent scorecards (precision / recall / F1):'];

  const rows = [...scorecards];
  if (sortBy === 'f1') {
    rows.sort(
      (a, b) => a.f1 - b.f1 || b.total - a.total || a.intent.localeCompare(b.intent),
    );
  } else {
    rows.sort(
      (a, b) => b.total - a.total || a.intent.localeCompare(b.intent),
    );
  }

  const visible = rows.slice(0, maxRows);
  if (visible.length === 0) {
    lines.push('  (no intents scored)');
    return lines.join('\n');
  }

  for (const row of visible) {
    lines.push(
      `  ${row.intent}: P ${(row.precision * 100).toFixed(1)}% · R ${(row.recall * 100).toFixed(1)}% · F1 ${(row.f1 * 100).toFixed(1)}% (${row.passed}/${row.total})`,
    );
  }

  if (scorecards.length > maxRows) {
    lines.push(`  … ${scorecards.length - maxRows} more intents omitted`);
  }

  return lines.join('\n');
}

export function formatWeakestIntentScorecards(
  scorecards: AiEvalIntentScorecard[],
  options: { maxRows?: number } = {},
): string {
  const maxRows = options.maxRows ?? 10;
  const weakest = [...scorecards]
    .filter((row) => row.total > 0 && row.f1 + 1e-9 < 1)
    .sort((a, b) => a.f1 - b.f1 || b.failed - a.failed || a.intent.localeCompare(b.intent))
    .slice(0, maxRows);

  if (weakest.length === 0) {
    return '';
  }

  const lines = ['Weakest intents (by F1):'];
  for (const row of weakest) {
    lines.push(
      `  ${row.intent}: P ${(row.precision * 100).toFixed(1)}% · R ${(row.recall * 100).toFixed(1)}% · F1 ${(row.f1 * 100).toFixed(1)}% (${row.passed}/${row.total}, FP ${row.falsePositives}, FN ${row.falseNegatives})`,
    );
  }
  return lines.join('\n');
}
