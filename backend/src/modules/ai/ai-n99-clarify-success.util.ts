import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  mergeCrossTurnClarifyPrompt,
  restoreOriginalIntentFromClarifySession,
} from './ai-clarify-cross-turn-merge.util.js';
import { mergeLosslessClarifyFollowUp } from './ai-lossless-clarify-merge.util.js';
import {
  validateInlineClarifyFollowUp,
  validateClarifyFollowUpAnswers,
  collectClarifyFollowUpAnswers,
} from './ai-inline-clarify-validation.util.js';
import { pairClarifyFollowUps } from './ai-clarify-quality.util.js';
import type { ClarifyNextTurnOutcome } from './ai-clarify-quality.util.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import { scoreIntentForShortlist } from './ai-classification-shortlist.util.js';
import { formatSemanticClarifyActionLabel } from './ai-semantic-confidence.util.js';
import { normalizeClarifyFollowUpAnswer } from './ai-clarify-followup-normalization.util.js';
import {
  CLARIFY_FOLLOWUP_EVAL_FLOOR,
  CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
  CLARIFY_NEAR_99_MIN_SAMPLE,
  CLARIFY_NEAR_99_PRIMARY_LOCALES,
  CLARIFY_NEAR_99_TARGET,
} from './ai-n99-clarify-success.fixtures.js';

export {
  CLARIFY_FOLLOWUP_EVAL_FLOOR,
  CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
  CLARIFY_NEAR_99_MIN_SAMPLE,
  CLARIFY_NEAR_99_PRIMARY_LOCALES,
  CLARIFY_NEAR_99_TARGET,
  N99_CLARIFY_FOLLOWUP_SCENARIOS,
  N99_CLARIFY_NEAR_99_GATE_SCENARIOS,
} from './ai-n99-clarify-success.fixtures.js';

export interface ClarifyQualitySegmentStats {
  sampleSize: number;
  successCount: number;
  successRate: number;
}

export interface ClarifyNear99ExitGateInput {
  clarifySuccessRate: number;
  sampleSize: number;
  localeSpread: number;
  insufficientLocales?: string[];
}

export interface ClarifyNear99ExitGateCriterion {
  id: 'clarify_success' | 'locale_parity' | 'sample_size';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'points' | 'count';
  detail?: string;
}

export interface ClarifyNear99ExitGateResult extends ClarifyNear99ExitGateInput {
  periodDays: number;
  target: number;
  met: boolean;
  failures: string[];
  criteria: ClarifyNear99ExitGateCriterion[];
}

export interface ClarifySomethingElseOption {
  action: string;
  label: string;
  score: number;
}

export interface InlineClarifyValidationResult {
  valid: boolean;
  normalizedAnswer?: string;
  hint?: string;
  rejectedField?: string;
}

export { validateInlineClarifyFollowUp } from './ai-inline-clarify-validation.util.js';

export interface ClarifyFollowUpPipelineResult {
  mergedPrompt: string;
  normalizedFollowUp: string;
  restoredAction: string;
  inlineValidation: InlineClarifyValidationResult;
  mergedParams: Record<string, unknown>;
  executeImmediately: boolean;
}

const RESOLVED_OUTCOMES = new Set<Exclude<ClarifyNextTurnOutcome, 'pending'>>([
  'success',
  'abandon',
  'second_clarify',
  'failed_follow_up',
]);

function segmentStats(
  pairs: ReturnType<typeof pairClarifyFollowUps>,
  pickKey: (row: AiTraceAnalyticsRow) => string,
): Record<string, ClarifyQualitySegmentStats> {
  const buckets = new Map<string, { success: number; total: number }>();

  for (const pair of pairs) {
    if (pair.outcome === 'pending') continue;
    if (!RESOLVED_OUTCOMES.has(pair.outcome)) continue;
    const key = pickKey(pair.clarify);
    const bucket = buckets.get(key) ?? { success: 0, total: 0 };
    bucket.total += 1;
    if (pair.outcome === 'success') bucket.success += 1;
    buckets.set(key, bucket);
  }

  const stats: Record<string, ClarifyQualitySegmentStats> = {};
  for (const [key, bucket] of buckets.entries()) {
    stats[key] = {
      sampleSize: bucket.total,
      successCount: bucket.success,
      successRate: bucket.total ? bucket.success / bucket.total : 0,
    };
  }
  return stats;
}

/** n99-1.7 — per-intent / per-locale clarify→success from trace rows. */
export function computeClarifyQualityByIntentAndLocale(
  rows: AiTraceAnalyticsRow[],
  nowMs = Date.now(),
): {
  byIntent: Record<string, ClarifyQualitySegmentStats>;
  byLocale: Record<string, ClarifyQualitySegmentStats>;
} {
  const pairs = pairClarifyFollowUps(rows, nowMs);
  return {
    byIntent: segmentStats(pairs, (row) => row.action),
    byLocale: segmentStats(pairs, (row) => row.locale),
  };
}

export function computeClarifyLocaleSpread(
  byLocale: Record<string, ClarifyQualitySegmentStats>,
  minSample = 5,
): { spread: number; insufficientLocales: string[] } {
  const insufficientLocales: string[] = [];
  const rates: number[] = [];

  for (const locale of CLARIFY_NEAR_99_PRIMARY_LOCALES) {
    const stats = byLocale[locale];
    if (!stats || stats.sampleSize < minSample) {
      insufficientLocales.push(locale);
      continue;
    }
    rates.push(stats.successRate);
  }

  if (insufficientLocales.length > 0 || rates.length < 2) {
    return { spread: Number.POSITIVE_INFINITY, insufficientLocales };
  }

  return {
    spread: Math.max(...rates) - Math.min(...rates),
    insufficientLocales,
  };
}

export function buildClarifyNear99ExitGate(
  input: ClarifyNear99ExitGateInput,
  periodDays = 30,
): ClarifyNear99ExitGateResult {
  const sampleMet = input.sampleSize >= CLARIFY_NEAR_99_MIN_SAMPLE;
  const successMet = input.clarifySuccessRate + 1e-9 >= CLARIFY_NEAR_99_TARGET;
  const localeMet =
    (input.insufficientLocales?.length ?? 0) === 0 &&
    input.localeSpread - 1e-9 <= CLARIFY_NEAR_99_LOCALE_SPREAD_MAX;

  const criteria: ClarifyNear99ExitGateCriterion[] = [
    {
      id: 'clarify_success',
      label: 'Clarify → success on next turn',
      value: input.clarifySuccessRate,
      target: CLARIFY_NEAR_99_TARGET,
      comparator: 'gte',
      met: successMet && sampleMet,
      unit: 'percent',
      detail: `≥ ${CLARIFY_NEAR_99_TARGET * 100}% after clarify`,
    },
    {
      id: 'locale_parity',
      label: 'Locale clarify spread (EN/HY/RU)',
      value: Number.isFinite(input.localeSpread) ? input.localeSpread : 0,
      target: CLARIFY_NEAR_99_LOCALE_SPREAD_MAX,
      comparator: 'lte',
      met: localeMet && sampleMet,
      unit: 'points',
      detail:
        input.insufficientLocales && input.insufficientLocales.length > 0
          ? `Need ≥ 5 clarify pairs each in ${input.insufficientLocales.join(', ')}`
          : `EN, HY, RU within ${CLARIFY_NEAR_99_LOCALE_SPREAD_MAX * 100} pts`,
    },
    {
      id: 'sample_size',
      label: 'Resolved clarify pairs',
      value: input.sampleSize,
      target: CLARIFY_NEAR_99_MIN_SAMPLE,
      comparator: 'gte',
      met: sampleMet,
      unit: 'count',
      detail: `≥ ${CLARIFY_NEAR_99_MIN_SAMPLE} resolved clarify→follow-up pairs`,
    },
  ];

  const failures = criteria
    .filter((criterion) => !criterion.met)
    .map((criterion) => {
      if (criterion.id === 'locale_parity' && input.insufficientLocales?.length) {
        return `locale parity — insufficient clarify samples for ${input.insufficientLocales.join(', ')}`;
      }
      if (criterion.comparator === 'gte' && criterion.unit === 'percent') {
        return `${criterion.label} ${(criterion.value * 100).toFixed(1)}% < ${criterion.target * 100}%`;
      }
      if (criterion.unit === 'points') {
        return `${criterion.label} ${(criterion.value * 100).toFixed(1)} pts > ${criterion.target * 100} pts`;
      }
      if (criterion.unit === 'count') {
        return `${criterion.label} ${criterion.value} < ${criterion.target}`;
      }
      return criterion.label;
    });

  return {
    ...input,
    periodDays,
    target: CLARIFY_NEAR_99_TARGET,
    met: failures.length === 0,
    failures,
    criteria,
  };
}

export function buildClarifyNear99ExitGateFromRows(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
  nowMs = Date.now(),
): ClarifyNear99ExitGateResult {
  const segments = computeClarifyQualityByIntentAndLocale(rows, nowMs);
  const locale = computeClarifyLocaleSpread(segments.byLocale);
  const resolvedPairs = pairClarifyFollowUps(rows, nowMs).filter(
    (pair) => pair.outcome !== 'pending',
  );
  const successCount = resolvedPairs.filter((pair) => pair.outcome === 'success').length;

  return buildClarifyNear99ExitGate(
    {
      clarifySuccessRate: resolvedPairs.length ? successCount / resolvedPairs.length : 0,
      sampleSize: resolvedPairs.length,
      localeSpread: locale.spread,
      insufficientLocales:
        locale.insufficientLocales.length > 0 ? locale.insufficientLocales : undefined,
    },
    periodDays,
  );
}

export {
  normalizeClarifyFollowUpAnswer,
  normalizeClarifyFieldAnswer,
  normalizeClarifyFollowUpAnswers,
} from './ai-clarify-followup-normalization.util.js';

/** n99-1.4–1.6 — deterministic clarify follow-up pipeline for eval + gateway. */
export function buildClarifySomethingElseAlternatives(input: {
  prompt: string;
  surface: ClassificationSurface;
  shortlist: string[];
  excludedActions?: string[];
  limit?: number;
}): ClarifySomethingElseOption[] {
  const excluded = new Set(input.excludedActions ?? []);
  const scored = input.shortlist
    .filter((action) => action !== 'unknown' && !excluded.has(action))
    .map((action) => ({
      action,
      label: formatSemanticClarifyActionLabel(action),
      score: scoreIntentForShortlist(input.prompt, action, input.surface),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, input.limit ?? 3);
}

/** n99-1.4–1.6 — deterministic clarify follow-up pipeline for eval + gateway. */
export function evaluateClarifyFollowUpPipeline(input: {
  originalPrompt: string;
  followUpPrompt: string;
  originalAction: string;
  partialParams?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  field?: string;
  timeZone?: string;
}): ClarifyFollowUpPipelineResult {
  const sessionContext = {
    ...(input.sessionContext ?? {}),
    _clarifyContext: {
      originalPrompt: input.originalPrompt,
      originalAction: input.originalAction,
      partialParams: input.partialParams ?? {},
      clarifyRound: 1,
      clarifyKind: 'targeted_slots',
      ...(input.field ? { clarifyFields: [input.field] } : {}),
    },
  };

  const normalizedFollowUp = normalizeClarifyFollowUpAnswer(input.followUpPrompt);
  const lossless = mergeLosslessClarifyFollowUp({
    followUpPrompt: normalizedFollowUp,
    sessionContext,
    classifierAction: input.originalAction,
  });
  const mergedPrompt = lossless.mergedPrompt;
  const inlineValidation = validateClarifyFollowUpAnswers({
    prompt: normalizedFollowUp,
    sessionContext: {
      ...sessionContext,
      _clarifyMemory: collectClarifyFollowUpAnswers({
        prompt: normalizedFollowUp,
        sessionContext,
      }),
    },
    timeZone: input.timeZone,
  });

  const restored = restoreOriginalIntentFromClarifySession(
    {
      action: lossless.restoredAction,
      params: lossless.mergedParams,
      confidence: 0.9,
    },
    lossless.sessionContext,
  );

  return {
    mergedPrompt,
    normalizedFollowUp,
    restoredAction: restored.action,
    inlineValidation,
    mergedParams: lossless.mergedParams,
    executeImmediately: lossless.executeImmediately && inlineValidation.valid,
  };
}

export function assertClarifyFollowupEvalFloor(
  passed: number,
  total: number,
  floor = CLARIFY_FOLLOWUP_EVAL_FLOOR,
): void {
  if (!total) {
    throw new Error('n99-1.9 — clarify_followup eval corpus is empty');
  }
  const rate = passed / total;
  if (rate + 1e-9 < floor) {
    throw new Error(
      `n99-1.9 — clarify_followup pass rate ${(rate * 100).toFixed(2)}% below floor ${(floor * 100).toFixed(2)}% (${passed}/${total})`,
    );
  }
}
