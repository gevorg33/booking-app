import type { AiCommandTraceOutcome } from './entities/ai-command-trace.entity.js';
import {
  anonymizePromptSnippet,
  CLARIFY_ABANDON_WINDOW_MS,
  hashPromptForAnalytics,
  isClarifyFollowUpSuccess,
  type AiTraceAnalyticsRow,
} from './ai-command-trace.util.js';
import type {
  AiWorstClarifyEntry,
  AiWorstPromptEntry,
  AiWorstPromptFailureSignals,
} from './ai-platform.util.js';
import { CLARIFY_NEXT_TURN_SUCCESS_TARGET } from './ai-platform.util.js';

export { CLARIFY_NEXT_TURN_SUCCESS_TARGET };

export type ClarifyNextTurnOutcome =
  | 'success'
  | 'abandon'
  | 'second_clarify'
  | 'failed_follow_up'
  | 'pending';

export interface ClarifyQualityPair {
  clarify: AiTraceAnalyticsRow;
  followUp?: AiTraceAnalyticsRow;
  outcome: ClarifyNextTurnOutcome;
}

export interface ClarifyQualityMetrics {
  target: number;
  meetsTarget: boolean;
  sampleSize: number;
  successCount: number;
  successRate: number;
  abandonCount: number;
  abandonRate: number;
  secondClarifyCount: number;
  pairs: ClarifyQualityPair[];
}

export function buildClarifySessionKey(row: AiTraceAnalyticsRow): string {
  return `${row.surface}:${row.userId ?? ''}`;
}

export function findClarifyFollowUpRow(
  clarify: AiTraceAnalyticsRow,
  rows: AiTraceAnalyticsRow[],
  startIndex: number,
): AiTraceAnalyticsRow | undefined {
  const sessionKey = buildClarifySessionKey(clarify);
  const deadline = clarify.createdAt.getTime() + CLARIFY_ABANDON_WINDOW_MS;

  for (let index = startIndex; index < rows.length; index += 1) {
    const candidate = rows[index];
    if (candidate.traceId === clarify.traceId) continue;
    if (buildClarifySessionKey(candidate) !== sessionKey) continue;
    if (candidate.createdAt.getTime() <= clarify.createdAt.getTime()) continue;
    if (candidate.createdAt.getTime() > deadline) break;
    return candidate;
  }

  return undefined;
}

export function resolveClarifyNextTurnOutcome(
  clarify: AiTraceAnalyticsRow,
  followUp: AiTraceAnalyticsRow | undefined,
  nowMs = Date.now(),
): ClarifyNextTurnOutcome {
  if (clarify.failureSignal === 'clarify_abandoned') {
    return 'abandon';
  }

  if (!followUp) {
    const elapsed = nowMs - clarify.createdAt.getTime();
    if (elapsed < CLARIFY_ABANDON_WINDOW_MS) return 'pending';
    return 'abandon';
  }

  if (
    isClarifyFollowUpSuccess(
      clarify.action,
      followUp.outcome,
      followUp.action,
    )
  ) {
    return 'success';
  }

  if (followUp.outcome === 'clarified') {
    return 'second_clarify';
  }

  if (
    followUp.outcome === 'failed' ||
    Boolean(followUp.failureSignal) ||
    followUp.feedbackRating === 'down'
  ) {
    return 'failed_follow_up';
  }

  if (
    (followUp.outcome === 'executed' || followUp.outcome === 'approval') &&
    followUp.action !== clarify.action
  ) {
    return 'abandon';
  }

  return 'pending';
}

export function pairClarifyFollowUps(
  rows: AiTraceAnalyticsRow[],
  nowMs = Date.now(),
): ClarifyQualityPair[] {
  const sorted = [...rows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const pairs: ClarifyQualityPair[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const clarify = sorted[index];
    if (clarify.outcome !== 'clarified') continue;

    const followUp = findClarifyFollowUpRow(clarify, sorted, index + 1);
    pairs.push({
      clarify,
      followUp,
      outcome: resolveClarifyNextTurnOutcome(clarify, followUp, nowMs),
    });
  }

  return pairs;
}

export function computeClarifyQualityMetrics(
  rows: AiTraceAnalyticsRow[],
  nowMs = Date.now(),
): ClarifyQualityMetrics {
  const pairs = pairClarifyFollowUps(rows, nowMs);
  const resolved = pairs.filter((pair) => pair.outcome !== 'pending');
  const successCount = resolved.filter((pair) => pair.outcome === 'success').length;
  const abandonCount = resolved.filter((pair) => pair.outcome === 'abandon').length;
  const secondClarifyCount = resolved.filter(
    (pair) => pair.outcome === 'second_clarify',
  ).length;
  const sampleSize = resolved.length;
  const successRate = sampleSize ? successCount / sampleSize : 1;

  return {
    target: CLARIFY_NEXT_TURN_SUCCESS_TARGET,
    meetsTarget: successRate >= CLARIFY_NEXT_TURN_SUCCESS_TARGET,
    sampleSize,
    successCount,
    successRate,
    abandonCount,
    abandonRate: sampleSize ? abandonCount / sampleSize : 0,
    secondClarifyCount,
    pairs,
  };
}

export function isBadClarifyOutcome(
  outcome: ClarifyNextTurnOutcome,
): outcome is Exclude<ClarifyNextTurnOutcome, 'pending' | 'success'> {
  return (
    outcome === 'abandon' ||
    outcome === 'second_clarify' ||
    outcome === 'failed_follow_up'
  );
}

/** n99-1.7 / acc-2 — only abandon + second clarify auto-queue for labeling. */
export function shouldAutoQueueClarifyOutcome(
  outcome: ClarifyNextTurnOutcome,
): outcome is 'abandon' | 'second_clarify' {
  return outcome === 'abandon' || outcome === 'second_clarify';
}

export function buildClarifyEvalLabelCandidateFromPair(
  pair: ClarifyQualityPair,
): AiWorstPromptEntry | null {
  if (!shouldAutoQueueClarifyOutcome(pair.outcome)) return null;

  const failureSignals = emptyFailureSignals();
  failureSignals.clarify_abandoned = 1;

  return {
    rank: 1,
    promptHash: hashPromptForAnalytics(pair.clarify.rawPrompt),
    promptSnippet: anonymizePromptSnippet(pair.clarify.rawPrompt),
    action: pair.clarify.action,
    surface: pair.clarify.surface,
    locale: pair.clarify.locale,
    failureCount: 1,
    avgConfidence: pair.clarify.confidence,
    failureSignals,
    correctedAction: pair.followUp?.action ?? null,
    lastSeenAt: pair.clarify.createdAt.toISOString(),
    harvestSource: 'clarify_quality',
    clarifyKind: pair.clarify.clarifyKind ?? null,
    nextTurnOutcome: pair.outcome,
  };
}

function emptyFailureSignals(): AiWorstPromptFailureSignals {
  return {
    suspected_miss: 0,
    wrong_execution: 0,
    clarify_abandoned: 0,
    thumbs_down: 0,
    failed_outcome: 0,
    low_confidence: 0,
    human_escalation: 0,
  };
}

export function buildWorstClarifiesFeed(
  rows: AiTraceAnalyticsRow[],
  limit = 20,
  nowMs = Date.now(),
): AiWorstClarifyEntry[] {
  const metrics = computeClarifyQualityMetrics(rows, nowMs);
  const worstMap = new Map<
    string,
    {
      promptSnippet: string;
      action: string;
      surface: string;
      locale: string;
      clarifyKind: string | null;
      failureCount: number;
      nextTurnOutcome: Exclude<ClarifyNextTurnOutcome, 'pending' | 'success'>;
      lastSeenAt: Date;
    }
  >();

  for (const pair of metrics.pairs) {
    if (!isBadClarifyOutcome(pair.outcome)) continue;

    const hash = hashPromptForAnalytics(pair.clarify.rawPrompt);
    const existing = worstMap.get(hash) ?? {
      promptSnippet: anonymizePromptSnippet(pair.clarify.rawPrompt),
      action: pair.clarify.action,
      surface: pair.clarify.surface,
      locale: pair.clarify.locale,
      clarifyKind: pair.clarify.clarifyKind ?? null,
      failureCount: 0,
      nextTurnOutcome: pair.outcome,
      lastSeenAt: pair.clarify.createdAt,
    };

    existing.failureCount += 1;
    if (pair.clarify.createdAt > existing.lastSeenAt) {
      existing.lastSeenAt = pair.clarify.createdAt;
      existing.nextTurnOutcome = pair.outcome;
      existing.clarifyKind = pair.clarify.clarifyKind ?? null;
    }
    worstMap.set(hash, existing);
  }

  return [...worstMap.entries()]
    .map(([promptHash, entry]) => ({
      rank: 0,
      promptHash,
      promptSnippet: entry.promptSnippet,
      action: entry.action,
      surface: entry.surface,
      locale: entry.locale,
      clarifyKind: entry.clarifyKind,
      failureCount: entry.failureCount,
      nextTurnOutcome: entry.nextTurnOutcome,
      lastSeenAt: entry.lastSeenAt.toISOString(),
    }))
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** acc-4.8 / n99-1.7 — abandon + second-clarify pairs queued for acc-2 labeling. */
export function buildClarifyQualityHarvestCandidates(
  rows: AiTraceAnalyticsRow[],
  limit = 50,
  nowMs = Date.now(),
): AiWorstPromptEntry[] {
  const merged = new Map<string, AiWorstPromptEntry>();

  for (const pair of pairClarifyFollowUps(rows, nowMs)) {
    const candidate = buildClarifyEvalLabelCandidateFromPair(pair);
    if (!candidate) continue;

    const existing = merged.get(candidate.promptHash);
    if (!existing) {
      merged.set(candidate.promptHash, candidate);
      continue;
    }

    merged.set(candidate.promptHash, {
      ...existing,
      failureCount: existing.failureCount + 1,
      lastSeenAt:
        candidate.lastSeenAt > existing.lastSeenAt
          ? candidate.lastSeenAt
          : existing.lastSeenAt,
      nextTurnOutcome: candidate.nextTurnOutcome,
      clarifyKind: candidate.clarifyKind,
    });
  }

  return [...merged.values()]
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function mergeEvalHarvestCandidates(
  failureRows: AiWorstPromptEntry[],
  clarifyRows: AiWorstPromptEntry[],
  limit = 100,
): AiWorstPromptEntry[] {
  const merged = new Map<string, AiWorstPromptEntry>();

  for (const entry of [...clarifyRows, ...failureRows]) {
    const existing = merged.get(entry.promptHash);
    if (!existing) {
      merged.set(entry.promptHash, entry);
      continue;
    }
    if (entry.harvestSource === 'clarify_quality') {
      merged.set(entry.promptHash, {
        ...existing,
        ...entry,
        failureCount: Math.max(existing.failureCount, entry.failureCount),
        failureSignals: {
          ...existing.failureSignals,
          clarify_abandoned:
            (existing.failureSignals.clarify_abandoned ?? 0) +
            (entry.failureSignals.clarify_abandoned ?? 0),
          failed_outcome:
            (existing.failureSignals.failed_outcome ?? 0) +
            (entry.failureSignals.failed_outcome ?? 0),
        },
      });
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, limit);
}
