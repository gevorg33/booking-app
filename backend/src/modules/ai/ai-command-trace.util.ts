import { createHash } from 'crypto';
import {
  containsNonEnglishScript,
  looksLikeTransliteration,
} from './ai-prompt-i18n.js';
import type {
  AiCommandFailureSignal,
  AiCommandFeedbackRating,
  AiCommandFeedbackReason,
  AiCommandTraceOutcome,
  AiCommandTraceSource,
} from './entities/ai-command-trace.entity.js';
import type { CommandResult, PipelineTrace } from './command-completion.types.js';
import {
  classifyCommandOutcome,
  type AiAccuracyAnalyticsSummary,
  type AiConfusionMatrixEntry,
  type AiConfusionMatrixExport,
  type AiWorstPromptEntry,
  type AiWorstPromptEvalDraft,
  type AiWorstPromptFailureSignals,
  type AiWorstPromptsEvalExport,
  type AiWorstPromptsExport,
  type AiAccuracySloExport,
  ACCURACY_SLO_TARGET,
  ACCURACY_SLO_WEEKLY_ALERT_DELTA,
  type AiCommandSurface,
} from './ai-platform.util.js';
import {
  redactEmbeddedPhiFromPrompt,
  redactPhiFromValue,
} from '../../common/utils/phi-ai-guard.util.js';
import {
  buildClarifyQualityHarvestCandidates,
  buildWorstClarifiesFeed,
  computeClarifyQualityMetrics,
  mergeEvalHarvestCandidates,
} from './ai-clarify-quality.util.js';
import {
  buildClarifyNear99ExitGateFromRows,
  computeClarifyQualityByIntentAndLocale,
  CLARIFY_NEAR_99_TARGET,
} from './ai-n99-clarify-success.util.js';
import {
  buildNoClarifyNear99ExitGateFromRows,
  NO_CLARIFY_NEAR_99_TARGET,
} from './ai-n99-no-clarify-completion.util.js';
import {
  buildEscalationEvalHarvestCandidates,
  computeEscalationAnalytics,
  isEscalationTraceRow,
} from './ai-escalation-analytics.util.js';

export const PROMPT_SIMILARITY_THRESHOLD = 0.8;
export const RETRY_WINDOW_MS = 2 * 60 * 1000;
export const UNDO_WINDOW_MS = 60 * 1000;
/** Pending clarify traces without follow-up are abandonable for this long (acc-1.5). */
export const CLARIFY_ABANDON_WINDOW_MS = 30 * 60 * 1000;

/** acc-1.6 — undo must land within this window after the executed command trace. */
export function isWithinUndoWindow(
  createdAt: Date,
  nowMs = Date.now(),
): boolean {
  return nowMs - createdAt.getTime() <= UNDO_WINDOW_MS;
}

export function isWrongExecutionCandidate(
  outcome: AiCommandTraceOutcome,
  failureSignal: AiCommandFailureSignal | null,
  createdAt: Date,
  nowMs = Date.now(),
): boolean {
  return (
    outcome === 'executed' &&
    failureSignal == null &&
    isWithinUndoWindow(createdAt, nowMs)
  );
}

export function extractTaskIdFromResult(
  result: CommandResult | Record<string, unknown>,
): string | undefined {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const taskId = details.taskId ?? (result as { taskId?: unknown }).taskId;
  return typeof taskId === 'string' && taskId.length > 0 ? taskId : undefined;
}

const PII_PARAM_KEYS = new Set([
  'email',
  'phone',
  'customerEmail',
  'customerPhone',
  'customerName',
  'notes',
  'symptoms',
  'referralNotes',
  'patientNotes',
  'address',
  'giftCardCode',
  'paymentToken',
]);

export interface AiCommandTraceRecordInput {
  traceId: string;
  businessId: string;
  surface: AiCommandSurface;
  userId?: string;
  role?: string;
  rawPrompt: string;
  normalizedPrompt?: string;
  result: CommandResult | Record<string, unknown>;
  latencyMs: number;
  locationId?: string;
  abVariantId?: string;
  hipaaMode?: boolean;
  routingTier?: string;
  model?: string;
  tokenCost?: number;
}

export interface AiTraceAnalyticsRow {
  traceId: string;
  surface: string;
  locale: string;
  action: string;
  outcome: AiCommandTraceOutcome;
  confidence: number | null;
  failureSignal: AiCommandFailureSignal | null;
  feedbackRating: AiCommandFeedbackRating | null;
  correctedAction: string | null;
  rawPrompt: string;
  createdAt: Date;
  userId?: string | null;
  clarifyKind?: string | null;
  autofillFields?: string[];
}

export function traceEntityToAnalyticsRow(trace: {
  traceId: string;
  surface: string;
  locale: string;
  action: string;
  outcome: AiCommandTraceOutcome;
  confidence: number | null;
  failureSignal: AiCommandFailureSignal | null;
  feedbackRating: AiCommandFeedbackRating | null;
  correctedAction: string | null;
  rawPrompt: string;
  createdAt: Date;
  userId?: string | null;
  params?: Record<string, unknown> | null;
}): AiTraceAnalyticsRow {
  return {
    traceId: trace.traceId,
    surface: trace.surface,
    locale: trace.locale,
    action: trace.action,
    outcome: trace.outcome,
    confidence: trace.confidence,
    failureSignal: trace.failureSignal,
    feedbackRating: trace.feedbackRating,
    correctedAction: trace.correctedAction,
    rawPrompt: trace.rawPrompt,
    createdAt: trace.createdAt,
    userId: trace.userId,
    clarifyKind:
      typeof trace.params?._clarifyKind === 'string'
        ? trace.params._clarifyKind
        : null,
    autofillFields: Array.isArray(trace.params?._noClarifyAutofill)
      ? (trace.params._noClarifyAutofill as string[])
      : undefined,
  };
}

export function detectPromptLocale(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return 'en';
  if (/[\u0530-\u058F]/.test(trimmed)) return 'hy';
  if (/[\u0400-\u04FF]/.test(trimmed)) return 'ru';
  if (looksLikeTransliteration(trimmed) && !containsNonEnglishScript(trimmed)) {
    return 'translit';
  }
  return 'en';
}

export function mapResultToTraceOutcome(
  result: CommandResult | Record<string, unknown>,
): AiCommandTraceOutcome {
  const classified = classifyCommandOutcome(result);
  switch (classified) {
    case 'success':
      return 'executed';
    case 'clarify':
      return 'clarified';
    case 'approval':
      return 'approval';
    case 'security_blocked':
      return 'security_blocked';
    case 'failed':
    default:
      return 'failed';
  }
}

export function inferClassificationSource(
  result: CommandResult | Record<string, unknown>,
  routingTier?: string,
): AiCommandTraceSource {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const tier =
    routingTier ??
    (details._complexityRoute as { tier?: string } | undefined)?.tier ??
    (details.routingTier as string | undefined);
  if (tier === 'read_only') return 'deterministic';
  if (details.deterministic === true || details.preclassified === true) {
    return 'deterministic';
  }
  if (details.classificationSource === 'deterministic') return 'deterministic';
  return 'llm';
}

export function redactTraceParams(
  params: Record<string, unknown> | undefined,
  hipaaMode: boolean,
): Record<string, unknown> | null {
  if (!params || !Object.keys(params).length) return null;
  let value: unknown = params;
  if (hipaaMode) {
    value = redactPhiFromValue(value);
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (PII_PARAM_KEYS.has(key)) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    redacted[key] = nested;
  }
  return redacted;
}

export function redactTracePrompt(prompt: string, hipaaMode: boolean): string {
  if (!hipaaMode) return prompt;
  return redactEmbeddedPhiFromPrompt(prompt);
}

export function extractPipelineStages(
  result: CommandResult | Record<string, unknown>,
): PipelineTrace[] | null {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const stages = details.pipelineTrace;
  if (!Array.isArray(stages) || !stages.length) return null;
  return stages as PipelineTrace[];
}

export function extractTraceConfidence(
  result: CommandResult | Record<string, unknown>,
): number | null {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const confidence =
    details.confidence ??
    details.classifierConfidence ??
    (details.params as Record<string, unknown> | undefined)?.confidence;
  return typeof confidence === 'number' ? confidence : null;
}

export function extractTraceParams(
  result: CommandResult | Record<string, unknown>,
): Record<string, unknown> | undefined {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const params = details.params ?? details.previewParams;
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    return params as Record<string, unknown>;
  }
  return undefined;
}

/** acc-6.7 — persist human handoff on trace for escalation analytics. */
export function extractTraceFailureSignal(
  result: CommandResult | Record<string, unknown>,
): import('./entities/ai-command-trace.entity.js').AiCommandFailureSignal | null {
  const details = (result.details ?? {}) as Record<string, unknown>;
  if (details.failureSignal === 'human_escalation') {
    return 'human_escalation';
  }
  if (details.humanHandoff === true && details.clarifyKind === 'human_handoff') {
    return 'human_escalation';
  }
  if (
    details.humanHandoff === true &&
    String(result.action ?? '') === 'request_human_help'
  ) {
    return 'human_escalation';
  }
  return null;
}

export function buildAiCommandTracePayload(
  input: AiCommandTraceRecordInput,
): Omit<
  import('./entities/ai-command-trace.entity.js').AiCommandTrace,
  'id' | 'createdAt'
> {
  const hipaaMode = input.hipaaMode === true;
  const params = redactTraceParams(extractTraceParams(input.result), hipaaMode);
  const details = (input.result.details ?? {}) as Record<string, unknown>;
  const clarifyKind = details.clarifyKind;
  if (typeof clarifyKind === 'string' && params) {
    params._clarifyKind = clarifyKind;
  }
  const clarifyRound = details.clarifyRound;
  if (typeof clarifyRound === 'number' && params) {
    params._clarifyRound = clarifyRound;
  }
  const action = String(input.result.action ?? 'unknown');
  const normalized =
    input.normalizedPrompt?.trim() ||
    redactTracePrompt(input.rawPrompt.trim(), hipaaMode);

  const failureSignal = extractTraceFailureSignal(input.result);

  return {
    traceId: input.traceId,
    businessId: input.businessId,
    surface: input.surface,
    userId: input.userId ?? null,
    role: input.role ?? null,
    rawPrompt: redactTracePrompt(input.rawPrompt.trim(), hipaaMode),
    normalizedPrompt: normalized,
    locale: detectPromptLocale(input.rawPrompt),
    action,
    confidence: extractTraceConfidence(input.result),
    params,
    routingTier: input.routingTier ?? null,
    source: inferClassificationSource(input.result, input.routingTier),
    outcome: mapResultToTraceOutcome(input.result),
    latencyMs: input.latencyMs,
    model: input.model ?? null,
    tokenCost: input.tokenCost ?? null,
    pipelineStages: extractPipelineStages(input.result),
    failureSignal,
    feedbackRating: null,
    feedbackReason: null,
    correctedAction: null,
    locationId: input.locationId ?? null,
    abVariantId: input.abVariantId ?? null,
  };
}

export function tokenizePromptForSimilarity(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/** Cosine similarity for embedding vectors (acc-1.4). Returns 0..1 for non-negative embeddings. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Lexical Jaccard fallback when embeddings are unavailable. */
export function computePromptSimilarity(a: string, b: string): number {
  const tokensA = tokenizePromptForSimilarity(a);
  const tokensB = tokenizePromptForSimilarity(b);
  if (!tokensA.length || !tokensB.length) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  if (!union) return 0;
  return intersection / union;
}

export function isRetryCandidateOutcome(outcome: AiCommandTraceOutcome): boolean {
  return outcome === 'clarified' || outcome === 'failed';
}

/** acc-1.9 — undone execution awaiting a follow-up command with the right intent. */
export function isUndoCorrectionCandidate(
  trace: Pick<
    AiTraceAnalyticsRow,
    'failureSignal' | 'correctedAction' | 'action' | 'outcome'
  >,
  newAction: string,
): boolean {
  return (
    trace.outcome === 'executed' &&
    trace.failureSignal === 'wrong_execution' &&
    trace.correctedAction == null &&
    trace.action !== newAction
  );
}

export function buildConfusionMatrix(
  rows: AiTraceAnalyticsRow[],
  limit = 25,
): AiConfusionMatrixEntry[] {
  const pairCounts = new Map<
    string,
    { count: number; retryCount: number; undoCount: number }
  >();

  for (const row of rows) {
    if (!row.correctedAction || row.correctedAction === row.action) continue;
    const key = `${row.action}→${row.correctedAction}`;
    const entry = pairCounts.get(key) ?? { count: 0, retryCount: 0, undoCount: 0 };
    entry.count += 1;
    if (row.failureSignal === 'wrong_execution') {
      entry.undoCount += 1;
    } else if (row.failureSignal === 'suspected_miss') {
      entry.retryCount += 1;
    }
    pairCounts.set(key, entry);
  }

  const totalCorrections = [...pairCounts.values()].reduce(
    (sum, entry) => sum + entry.count,
    0,
  );

  return [...pairCounts.entries()]
    .map(([pair, stats]) => {
      const [from, to] = pair.split('→');
      return {
        from,
        to,
        count: stats.count,
        share: totalCorrections ? stats.count / totalCorrections : 0,
        retryCount: stats.retryCount,
        undoCount: stats.undoCount,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function exportConfusionMatrixFromRows(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
  limit = 25,
): AiConfusionMatrixExport {
  const pairs = buildConfusionMatrix(rows, limit);
  return {
    periodDays,
    totalCorrections: pairs.reduce((sum, row) => sum + row.count, 0),
    pairs,
  };
}

function emptyWorstPromptSignals(): AiWorstPromptFailureSignals {
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

function isWorstPromptCandidate(row: AiTraceAnalyticsRow): boolean {
  return isEvalHarvestCandidate(row);
}

/** acc-2.1 — traces eligible for the eval labeling queue harvester. */
export function isEvalHarvestCandidate(row: AiTraceAnalyticsRow): boolean {
  return (
    isEscalationTraceRow(row) ||
    Boolean(row.failureSignal) ||
    row.feedbackRating === 'down' ||
    row.outcome === 'failed' ||
    (row.confidence != null && row.confidence < 0.55)
  );
}

function recordWorstPromptSignals(
  signals: AiWorstPromptFailureSignals,
  row: AiTraceAnalyticsRow,
): void {
  if (row.failureSignal === 'suspected_miss') signals.suspected_miss += 1;
  if (row.failureSignal === 'wrong_execution') signals.wrong_execution += 1;
  if (row.failureSignal === 'clarify_abandoned') signals.clarify_abandoned += 1;
  if (isEscalationTraceRow(row)) signals.human_escalation += 1;
  if (row.feedbackRating === 'down') signals.thumbs_down += 1;
  if (row.outcome === 'failed') signals.failed_outcome += 1;
  if (row.confidence != null && row.confidence < 0.55) {
    signals.low_confidence += 1;
  }
}

export function buildWorstPromptsFeed(
  rows: AiTraceAnalyticsRow[],
  limit = 50,
): AiWorstPromptEntry[] {
  const worstMap = new Map<
    string,
    {
      promptSnippet: string;
      action: string;
      surface: string;
      locale: string;
      failureCount: number;
      confidenceSum: number;
      confidenceCount: number;
      failureSignals: AiWorstPromptFailureSignals;
      correctedAction: string | null;
      lastSeenAt: Date;
    }
  >();

  for (const row of rows) {
    if (!isWorstPromptCandidate(row)) continue;

    const hash = hashPromptForAnalytics(row.rawPrompt);
    const existing = worstMap.get(hash) ?? {
      promptSnippet: anonymizePromptSnippet(row.rawPrompt),
      action: row.action,
      surface: row.surface,
      locale: row.locale,
      failureCount: 0,
      confidenceSum: 0,
      confidenceCount: 0,
      failureSignals: emptyWorstPromptSignals(),
      correctedAction: row.correctedAction,
      lastSeenAt: row.createdAt,
    };

    existing.failureCount += 1;
    recordWorstPromptSignals(existing.failureSignals, row);
    if (row.confidence != null) {
      existing.confidenceSum += row.confidence;
      existing.confidenceCount += 1;
    }
    if (row.correctedAction) {
      existing.correctedAction = row.correctedAction;
    }
    if (row.createdAt > existing.lastSeenAt) {
      existing.lastSeenAt = row.createdAt;
      existing.action = row.action;
      existing.surface = row.surface;
      existing.locale = row.locale;
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
      avgConfidence: entry.confidenceCount
        ? entry.confidenceSum / entry.confidenceCount
        : null,
      failureSignals: entry.failureSignals,
      correctedAction: entry.correctedAction,
      lastSeenAt: entry.lastSeenAt.toISOString(),
    }))
    .sort((a, b) => {
      if (b.failureCount !== a.failureCount) {
        return b.failureCount - a.failureCount;
      }
      const aConf = a.avgConfidence ?? 1;
      const bConf = b.avgConfidence ?? 1;
      return aConf - bConf;
    })
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function exportWorstPromptsFromRows(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
  limit = 50,
): AiWorstPromptsExport {
  const prompts = buildWorstPromptsFeed(rows, limit);
  return {
    periodDays,
    totalFailures: prompts.reduce((sum, row) => sum + row.failureCount, 0),
    prompts,
  };
}

/** acc-2.1 — anonymized harvest candidates for the eval labeling queue. */
export function buildEvalHarvestCandidatesFromRows(
  rows: AiTraceAnalyticsRow[],
  limit = 100,
): AiWorstPromptEntry[] {
  const failureCandidates = buildWorstPromptsFeed(rows, limit);
  const clarifyCandidates = buildClarifyQualityHarvestCandidates(rows, limit);
  const escalationCandidates = buildEscalationEvalHarvestCandidates(rows, limit);
  return mergeEvalHarvestCandidates(
    mergeEvalHarvestCandidates(failureCandidates, escalationCandidates, limit),
    clarifyCandidates,
    limit,
  );
}

function normalizeEvalLocale(locale: string): AiWorstPromptEvalDraft['locale'] {
  if (locale === 'hy' || locale === 'ru' || locale === 'translit') return locale;
  return 'en';
}

function normalizeEvalSurface(surface: string): AiWorstPromptEvalDraft['surface'] {
  if (
    surface === 'dashboard' ||
    surface === 'provider' ||
    surface === 'customer' ||
    surface === 'public'
  ) {
    return surface;
  }
  return 'dashboard';
}

export function worstPromptToEvalDraft(
  entry: AiWorstPromptEntry,
  businessId: string,
): AiWorstPromptEvalDraft {
  const signalSummary = [
    entry.failureSignals.suspected_miss ? 'retry' : null,
    entry.failureSignals.wrong_execution ? 'undo' : null,
    entry.failureSignals.clarify_abandoned ? 'abandon' : null,
    entry.failureSignals.thumbs_down ? 'thumbs_down' : null,
    entry.failureSignals.low_confidence ? 'low_confidence' : null,
    entry.failureSignals.human_escalation ? 'human_escalation' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    id: `acc-1.10-${businessId.slice(0, 8)}-${entry.promptHash}`,
    prompt: entry.promptSnippet,
    locale: normalizeEvalLocale(entry.locale),
    surface: normalizeEvalSurface(entry.surface),
    expect: {
      action: entry.action,
      ...(entry.correctedAction ? { rescuedAction: entry.correctedAction } : {}),
    },
    source: 'acc-1.10',
    promptHash: entry.promptHash,
    triageRank: entry.rank,
    note: `Production triage (${entry.failureCount} failures${signalSummary ? `: ${signalSummary}` : ''}). Label expected action/params before adding to ai-command-eval.cases.ts.`,
  };
}

export function exportWorstPromptsEvalDrafts(
  rows: AiTraceAnalyticsRow[],
  businessId: string,
  periodDays: number,
  limit = 50,
): AiWorstPromptsEvalExport {
  const prompts = buildWorstPromptsFeed(rows, limit);
  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    businessId,
    drafts: prompts.map((entry) => worstPromptToEvalDraft(entry, businessId)),
  };
}

export function isClarifyAbandonCandidate(
  outcome: AiCommandTraceOutcome,
  failureSignal: AiCommandFailureSignal | null,
): boolean {
  return outcome === 'clarified' && failureSignal == null;
}

/** Prior clarify was resolved when the follow-up executed the same intent (acc-1.5). */
export function isClarifyFollowUpSuccess(
  priorAction: string,
  newOutcome: AiCommandTraceOutcome,
  newAction: string,
): boolean {
  return (
    (newOutcome === 'executed' || newOutcome === 'approval') &&
    newAction === priorAction
  );
}

/** User is still clarifying the same intent (multi-step clarify). */
export function isClarifyContinuation(
  priorAction: string,
  newOutcome: AiCommandTraceOutcome,
  newAction: string,
): boolean {
  return newOutcome === 'clarified' && newAction === priorAction;
}

export function anonymizePromptSnippet(prompt: string, maxLen = 120): string {
  const scrubbed = prompt
    .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '[email]')
    .replace(/\b\+?\d[\d\s()-]{7,}\b/g, '[phone]')
    .replace(/\s+/g, ' ')
    .trim();
  if (scrubbed.length <= maxLen) return scrubbed;
  return `${scrubbed.slice(0, maxLen - 1)}…`;
}

export function hashPromptForAnalytics(prompt: string): string {
  return createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex').slice(0, 16);
}

export function isTraceAccurate(row: AiTraceAnalyticsRow): boolean {
  if (row.failureSignal) return false;
  if (row.feedbackRating === 'down') return false;
  if (row.outcome === 'security_blocked') return true;
  if (row.outcome === 'clarified') return true;
  if (row.outcome === 'executed') return true;
  if (row.outcome === 'approval') return true;
  return false;
}

export function aggregateTraceAccuracyAnalytics(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
): AiAccuracyAnalyticsSummary {
  const total = rows.length;
  const executed = rows.filter((r) => r.outcome === 'executed').length;
  const clarified = rows.filter((r) => r.outcome === 'clarified').length;
  const clarifyQuality = computeClarifyQualityMetrics(rows);
  const failures = rows.filter(
    (r) =>
      Boolean(r.failureSignal) ||
      r.feedbackRating === 'down' ||
      r.outcome === 'failed',
  ).length;
  const thumbsDown = rows.filter((r) => r.feedbackRating === 'down').length;

  const byIntent: AiAccuracyAnalyticsSummary['byIntent'] = {};
  const byLocale: AiAccuracyAnalyticsSummary['byLocale'] = {};
  const bySurface: AiAccuracyAnalyticsSummary['bySurface'] = {};

  for (const row of rows) {
    byIntent[row.action] ??= { total: 0, accurate: 0, clarify: 0, failures: 0 };
    byIntent[row.action].total += 1;
    if (row.outcome === 'clarified') byIntent[row.action].clarify += 1;
    if (isTraceAccurate(row)) byIntent[row.action].accurate += 1;
    if (row.failureSignal || row.feedbackRating === 'down' || row.outcome === 'failed') {
      byIntent[row.action].failures += 1;
    }

    byLocale[row.locale] ??= { total: 0, accurate: 0 };
    byLocale[row.locale].total += 1;
    if (isTraceAccurate(row)) byLocale[row.locale].accurate += 1;

    bySurface[row.surface] ??= { total: 0, accurate: 0 };
    bySurface[row.surface].total += 1;
    if (isTraceAccurate(row)) bySurface[row.surface].accurate += 1;
  }

  const now = new Date();
  const accuracySlo = buildAccuracySlo(rows);

  const confusionMatrix = buildConfusionMatrix(rows);
  const worstPrompts = buildWorstPromptsFeed(rows, 20);
  const worstClarifies = buildWorstClarifiesFeed(rows, 20);
  const escalationStats = computeEscalationAnalytics(rows);
  const clarifySegments = computeClarifyQualityByIntentAndLocale(rows);
  const clarifyNear99Gate = buildClarifyNear99ExitGateFromRows(rows, periodDays);
  const noClarifyNear99Gate = buildNoClarifyNear99ExitGateFromRows(rows, periodDays);

  return {
    periodDays,
    totalCommands: total,
    noClarifyCompletionRate: total ? executed / total : 0,
    clarifyRate: total ? clarified / total : 0,
    clarifySuccessRate: clarifyQuality.successRate,
    clarifyQualityTarget: clarifyQuality.target,
    clarifyQualityMeetsTarget: clarifyQuality.meetsTarget,
    clarifyNextTurnSampleSize: clarifyQuality.sampleSize,
    clarifyNextTurnSuccessCount: clarifyQuality.successCount,
    clarifyAbandonRate: clarifyQuality.abandonRate,
    clarifyNear99Target: CLARIFY_NEAR_99_TARGET,
    clarifyNear99MeetsTarget: clarifyNear99Gate.met,
    clarifyNear99Gate,
    noClarifyNear99Target: NO_CLARIFY_NEAR_99_TARGET,
    noClarifyNear99MeetsTarget: noClarifyNear99Gate.met,
    noClarifyNear99Gate,
    clarifyQualityByIntent: clarifySegments.byIntent,
    clarifyQualityByLocale: clarifySegments.byLocale,
    misclassificationRate: total ? failures / total : 0,
    explicitNegativeRate: total ? thumbsDown / total : 0,
    byIntent,
    byLocale,
    bySurface,
    confusionMatrix,
    worstPrompts,
    worstClarifies,
    accuracySlo,
    escalation: {
      escalationCount: escalationStats.escalationCount,
      escalationRate: escalationStats.escalationRate,
      targetRate: escalationStats.targetRate,
      meetsTarget: escalationStats.meetsTarget,
    },
  };
}

export function buildAccuracySlo(rows: AiTraceAnalyticsRow[]): AiAccuracySloExport {
  const now = new Date();
  const trend: AiAccuracySloExport['trend'] = [];
  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - dayOffset);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const dayRows = rows.filter(
      (r) => r.createdAt >= dayStart && r.createdAt < dayEnd,
    );
    const accurate = dayRows.filter(isTraceAccurate).length;
    trend.push({
      date: dayStart.toISOString().slice(0, 10),
      accuracy: dayRows.length ? accurate / dayRows.length : 0,
      total: dayRows.length,
    });
  }

  const rolling7 = rows.filter((r) => {
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    return r.createdAt >= cutoff;
  });
  const rolling7Accurate = rolling7.filter(isTraceAccurate).length;
  const rolling7DayAccuracy = rolling7.length
    ? rolling7Accurate / rolling7.length
    : 0;

  const prev7Start = new Date(now);
  prev7Start.setUTCDate(prev7Start.getUTCDate() - 14);
  const prev7End = new Date(now);
  prev7End.setUTCDate(prev7End.getUTCDate() - 7);
  const prev7 = rows.filter(
    (r) => r.createdAt >= prev7Start && r.createdAt < prev7End,
  );
  const previous7DayAccuracy = prev7.length
    ? prev7.filter(isTraceAccurate).length / prev7.length
    : rolling7DayAccuracy;
  const weeklyDelta = rolling7DayAccuracy - previous7DayAccuracy;

  return {
    periodDays: 7,
    target: ACCURACY_SLO_TARGET,
    rolling7DayAccuracy,
    previous7DayAccuracy,
    weeklyDelta,
    gapToTarget: rolling7DayAccuracy - ACCURACY_SLO_TARGET,
    meetsTarget: rolling7DayAccuracy >= ACCURACY_SLO_TARGET,
    alert: weeklyDelta < ACCURACY_SLO_WEEKLY_ALERT_DELTA,
    rolling7CommandCount: rolling7.length,
    trend,
  };
}

export function exportAccuracySloFromRows(rows: AiTraceAnalyticsRow[]): AiAccuracySloExport {
  return buildAccuracySlo(rows);
}

export type AiCommandTraceFeedbackInput = {
  rating: AiCommandFeedbackRating;
  reason?: AiCommandFeedbackReason;
};

export function normalizeFeedbackReason(
  reason: string | undefined,
): AiCommandFeedbackReason | null {
  if (!reason) return null;
  const allowed: AiCommandFeedbackReason[] = [
    'wrong_action',
    'wrong_date',
    'wrong_person',
    'wrong_service',
    'did_not_understand',
  ];
  return allowed.includes(reason as AiCommandFeedbackReason)
    ? (reason as AiCommandFeedbackReason)
    : null;
}
