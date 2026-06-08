import type { AiWorstPromptEntry } from './ai-platform.util.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import {
  anonymizePromptSnippet,
  hashPromptForAnalytics,
} from './ai-command-trace.util.js';
import {
  ESCALATION_RATE_TARGET,
  ESCALATION_ANALYTICS_SCENARIOS,
  ESCALATION_REVIEW_TOP_N,
} from './ai-escalation-analytics.fixtures.js';

export {
  ESCALATION_RATE_TARGET,
  ESCALATION_ANALYTICS_SCENARIOS,
  ESCALATION_REVIEW_TOP_N,
} from './ai-escalation-analytics.fixtures.js';

export interface EscalationReviewEntry {
  traceId: string;
  promptSnippet: string;
  action: string;
  surface: string;
  locale: string;
  clarifyKind: string | null;
  createdAt: string;
}

export interface EscalationAnalyticsSummary {
  periodDays?: number;
  totalCommands: number;
  escalationCount: number;
  escalationRate: number;
  targetRate: number;
  meetsTarget: boolean;
  /** acc-6.7 — 1 − escalation rate (inverse-accuracy proxy). */
  impliedAccuracy: number;
  inverseAccuracyProxy: number;
  bySurface: Record<
    string,
    { total: number; escalationCount: number; escalationRate: number }
  >;
  recentEscalations: EscalationReviewEntry[];
}

export function isEscalationTraceRow(row: AiTraceAnalyticsRow): boolean {
  if (row.failureSignal === 'human_escalation') return true;
  return row.clarifyKind === 'human_handoff';
}

export function buildEscalationReviewEntries(
  rows: AiTraceAnalyticsRow[],
  limit = ESCALATION_REVIEW_TOP_N,
): EscalationReviewEntry[] {
  return rows
    .filter(isEscalationTraceRow)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((row) => ({
      traceId: row.traceId,
      promptSnippet: anonymizePromptSnippet(row.rawPrompt).slice(0, 160),
      action: row.action,
      surface: row.surface,
      locale: row.locale,
      clarifyKind: row.clarifyKind ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
}

export function computeEscalationAnalyticsBySurface(
  rows: AiTraceAnalyticsRow[],
): EscalationAnalyticsSummary['bySurface'] {
  const bySurface: EscalationAnalyticsSummary['bySurface'] = {};
  for (const row of rows) {
    bySurface[row.surface] ??= { total: 0, escalationCount: 0, escalationRate: 0 };
    bySurface[row.surface].total += 1;
    if (isEscalationTraceRow(row)) {
      bySurface[row.surface].escalationCount += 1;
    }
  }
  for (const stats of Object.values(bySurface)) {
    stats.escalationRate = stats.total ? stats.escalationCount / stats.total : 0;
  }
  return bySurface;
}

/** acc-6.7 — human handoff rate as inverse-accuracy proxy; target < 1%. */
export function computeEscalationAnalytics(
  rows: AiTraceAnalyticsRow[],
  options?: { recentLimit?: number; periodDays?: number },
): EscalationAnalyticsSummary {
  const totalCommands = rows.length;
  const escalationCount = rows.filter(isEscalationTraceRow).length;
  const escalationRate = totalCommands ? escalationCount / totalCommands : 0;
  const impliedAccuracy = totalCommands ? 1 - escalationRate : 1;

  return {
    periodDays: options?.periodDays,
    totalCommands,
    escalationCount,
    escalationRate,
    targetRate: ESCALATION_RATE_TARGET,
    meetsTarget: escalationRate <= ESCALATION_RATE_TARGET,
    impliedAccuracy,
    inverseAccuracyProxy: escalationRate,
    bySurface: computeEscalationAnalyticsBySurface(rows),
    recentEscalations: buildEscalationReviewEntries(
      rows,
      options?.recentLimit ?? ESCALATION_REVIEW_TOP_N,
    ),
  };
}

/** acc-6.7 — priority eval harvest from human handoffs for weekly triage. */
export function buildEscalationEvalHarvestCandidates(
  rows: AiTraceAnalyticsRow[],
  limit = ESCALATION_REVIEW_TOP_N,
): AiWorstPromptEntry[] {
  const worstMap = new Map<
    string,
    {
      promptSnippet: string;
      action: string;
      surface: string;
      locale: string;
      failureCount: number;
      clarifyKind: string | null;
      lastSeenAt: Date;
    }
  >();

  for (const row of rows.filter(isEscalationTraceRow)) {
    const hash = hashPromptForAnalytics(row.rawPrompt);
    const existing = worstMap.get(hash) ?? {
      promptSnippet: anonymizePromptSnippet(row.rawPrompt),
      action: row.action,
      surface: row.surface,
      locale: row.locale,
      failureCount: 0,
      clarifyKind: row.clarifyKind ?? 'human_handoff',
      lastSeenAt: row.createdAt,
    };
    existing.failureCount += 1;
    if (row.createdAt > existing.lastSeenAt) {
      existing.lastSeenAt = row.createdAt;
      existing.action = row.action;
      existing.surface = row.surface;
      existing.locale = row.locale;
      existing.clarifyKind = row.clarifyKind ?? existing.clarifyKind;
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
      failureCount: entry.failureCount,
      avgConfidence: null,
      failureSignals: {
        suspected_miss: 0,
        wrong_execution: 0,
        clarify_abandoned: 0,
        thumbs_down: 0,
        failed_outcome: 0,
        low_confidence: 0,
        human_escalation: entry.failureCount,
      },
      correctedAction: null,
      lastSeenAt: entry.lastSeenAt.toISOString(),
      harvestSource: 'escalation' as const,
      clarifyKind: entry.clarifyKind,
    }))
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function exportEscalationAnalyticsFromRows(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
  recentLimit = ESCALATION_REVIEW_TOP_N,
): EscalationAnalyticsSummary {
  return computeEscalationAnalytics(rows, { recentLimit, periodDays });
}
