import type {
  AiGuideTelemetry,
  AiGuideTelemetryEvent,
  AiGuideTelemetrySurface,
} from '../entities/ai-guide-telemetry.entity.js';
import {
  GUIDE_TELEMETRY_EVENT_NAMES,
  GUIDE_TELEMETRY_SURFACE_VALUES,
} from './guide-telemetry.fixtures.js';
import type {
  GuideTelemetryAnalyticsSummary,
  GuideTelemetryTopicMetrics,
  GuideUnansweredReason,
  GuideUnansweredTopicRow,
  IngestGuideTelemetryEventInput,
  ProductGuideTelemetryRecorder,
  RecordGuideGroundingFailureInput,
  RecordGuideHandoffInput,
  RecordGuideStepCompletedInput,
  RecordGuideTopicOpenedInput,
} from './guide-telemetry.types.js';
import type { GuideResponse } from '../command-completion.types.js';
import type { AppLocale } from '../../../common/i18n/messages.js';
import { resolveGuideFlowSurfaceFromRoute } from './guide-flow.merge.util.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function emptyTopicMetrics(): GuideTelemetryTopicMetrics {
  return {
    opened: 0,
    stepsCompleted: 0,
    handoffs: 0,
    groundingFailures: 0,
    guideCompletions: 0,
  };
}

function isGuideTelemetryEvent(value: string): value is AiGuideTelemetryEvent {
  return (GUIDE_TELEMETRY_EVENT_NAMES as readonly string[]).includes(value);
}

function isGuideTelemetrySurface(value: string): value is AiGuideTelemetrySurface {
  return (GUIDE_TELEMETRY_SURFACE_VALUES as readonly string[]).includes(value);
}

function normalizeOptionalString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function normalizeSessionId(value: unknown): string | undefined {
  const sessionId = normalizeOptionalString(value, 36);
  if (!sessionId || !UUID_PATTERN.test(sessionId)) return undefined;
  return sessionId;
}

function normalizeNonNegativeInt(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const rounded = Math.floor(value);
  return rounded >= 0 ? rounded : undefined;
}

export function parseGuideTelemetryEventInput(
  input: Record<string, unknown>,
): IngestGuideTelemetryEventInput | null {
  const event = normalizeOptionalString(input.event, 32);
  const surface = normalizeOptionalString(input.surface, 16);
  if (!event || !isGuideTelemetryEvent(event)) return null;
  if (!surface || !isGuideTelemetrySurface(surface)) return null;

  const issueCodesRaw = input.issueCodes;
  const issueCodes = Array.isArray(issueCodesRaw)
    ? issueCodesRaw
        .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
        .map((code) => code.trim().slice(0, 64))
        .slice(0, 20)
    : undefined;

  return {
    event,
    surface,
    topicId: normalizeOptionalString(input.topicId, 128),
    route: normalizeOptionalString(input.route, 256),
    locale: normalizeOptionalString(input.locale, 16),
    sessionId: normalizeSessionId(input.sessionId),
    stepIndex: normalizeNonNegativeInt(input.stepIndex),
    totalSteps: normalizeNonNegativeInt(input.totalSteps),
    handoffAction: normalizeOptionalString(input.handoffAction, 128),
    relatedActionsCount: normalizeNonNegativeInt(input.relatedActionsCount),
    issueCodes,
  };
}

export function buildGuideTelemetryRow(
  businessId: string,
  userId: string | undefined,
  input: IngestGuideTelemetryEventInput,
): Omit<AiGuideTelemetry, 'id' | 'createdAt'> {
  return {
    businessId,
    userId: userId ?? null,
    event: input.event,
    surface: input.surface,
    topicId: input.topicId ?? null,
    route: input.route ?? null,
    locale: input.locale ?? null,
    sessionId: input.sessionId ?? null,
    stepIndex: input.stepIndex ?? null,
    totalSteps: input.totalSteps ?? null,
    handoffAction: input.handoffAction ?? null,
    relatedActionsCount: input.relatedActionsCount ?? null,
    issueCodes: input.issueCodes?.length ? [...input.issueCodes] : null,
  };
}

export function buildGuideTopicOpenedEvent(
  input: RecordGuideTopicOpenedInput,
): IngestGuideTelemetryEventInput {
  return {
    event: 'topic_opened',
    surface: input.surface,
    topicId: input.topicId,
    route: input.route,
    locale: input.locale,
    sessionId: input.sessionId,
    totalSteps: input.totalSteps,
    relatedActionsCount: input.relatedActionsCount ?? 0,
  };
}

export function buildGuideStepCompletedEvent(
  input: RecordGuideStepCompletedInput,
): IngestGuideTelemetryEventInput {
  return {
    event: 'step_completed',
    surface: input.surface,
    topicId: input.topicId,
    route: input.route,
    locale: input.locale,
    sessionId: input.sessionId,
    stepIndex: input.stepIndex,
    totalSteps: input.totalSteps,
  };
}

export function buildGuideHandoffEvent(
  input: RecordGuideHandoffInput,
): IngestGuideTelemetryEventInput {
  return {
    event: 'handoff_to_action',
    surface: input.surface,
    topicId: input.topicId,
    route: input.route,
    locale: input.locale,
    sessionId: input.sessionId,
    handoffAction: input.handoffAction,
    totalSteps: input.totalSteps,
  };
}

export function buildGuideGroundingFailureEvent(
  input: RecordGuideGroundingFailureInput,
): IngestGuideTelemetryEventInput {
  return {
    event: 'grounding_failure',
    surface: input.surface,
    topicId: input.topicId,
    route: input.route,
    locale: input.locale,
    issueCodes: [...input.issueCodes],
  };
}

function bumpTopicMetrics(
  bucket: GuideTelemetryTopicMetrics,
  row: Pick<
    AiGuideTelemetry,
    'event' | 'stepIndex' | 'totalSteps'
  >,
): void {
  switch (row.event) {
    case 'topic_opened':
      bucket.opened += 1;
      break;
    case 'step_completed':
      bucket.stepsCompleted += 1;
      if (
        row.stepIndex != null &&
        row.totalSteps != null &&
        row.stepIndex >= row.totalSteps - 1
      ) {
        bucket.guideCompletions += 1;
      }
      break;
    case 'handoff_to_action':
      bucket.handoffs += 1;
      break;
    case 'grounding_failure':
      bucket.groundingFailures += 1;
      break;
    default:
      break;
  }
}

const GUIDE_UNANSWERED_COMPLETION_THRESHOLD = 0.5;

function collectUnansweredReasons(
  topicId: string,
  metrics: GuideTelemetryTopicMetrics,
  completionRate: number,
): GuideUnansweredReason[] {
  const reasons: GuideUnansweredReason[] = [];
  if (topicId === 'unknown') {
    reasons.push('missing_topic');
  }
  if (metrics.groundingFailures > 0) {
    reasons.push('grounding_failure');
  }
  if (metrics.opened > 0 && completionRate < GUIDE_UNANSWERED_COMPLETION_THRESHOLD) {
    reasons.push('low_completion');
  }
  return reasons;
}

export function rankUnansweredGuideTopics(
  byTopic: Record<string, GuideTelemetryTopicMetrics>,
  limit = 10,
): GuideUnansweredTopicRow[] {
  const rows: GuideUnansweredTopicRow[] = [];

  for (const [topicId, metrics] of Object.entries(byTopic)) {
    const totalSignals = metrics.opened + metrics.groundingFailures;
    if (totalSignals === 0) continue;

    const completionRate =
      metrics.opened > 0 ? metrics.guideCompletions / metrics.opened : 0;
    const unansweredRate =
      metrics.opened > 0 ? 1 - completionRate : metrics.groundingFailures > 0 ? 1 : 0;
    const reasons = collectUnansweredReasons(topicId, metrics, completionRate);
    if (reasons.length === 0) continue;

    const priorityScore =
      Math.max(0, metrics.opened - metrics.guideCompletions) +
      metrics.groundingFailures * 3 +
      (topicId === 'unknown' ? metrics.opened * 2 : 0);

    rows.push({
      topicId,
      opened: metrics.opened,
      guideCompletions: metrics.guideCompletions,
      groundingFailures: metrics.groundingFailures,
      stepsCompleted: metrics.stepsCompleted,
      handoffs: metrics.handoffs,
      completionRate,
      unansweredRate,
      priorityScore,
      reasons,
      inCorpus: false,
    });
  }

  return rows
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }
      return right.opened - left.opened;
    })
    .slice(0, Math.max(1, limit));
}

export function buildGuideTelemetryAnalyticsSummary(
  rows: readonly Pick<
    AiGuideTelemetry,
    'event' | 'surface' | 'topicId' | 'stepIndex' | 'totalSteps'
  >[],
  periodDays = 30,
  topUnansweredLimit = 10,
): GuideTelemetryAnalyticsSummary {
  const summary = aggregateGuideTelemetryMetrics(rows, periodDays);
  return {
    ...summary,
    topUnansweredTopics: rankUnansweredGuideTopics(summary.byTopic, topUnansweredLimit),
  };
}

export function aggregateGuideTelemetryMetrics(
  rows: readonly Pick<
    AiGuideTelemetry,
    'event' | 'surface' | 'topicId' | 'stepIndex' | 'totalSteps'
  >[],
  periodDays = 30,
): GuideTelemetryAnalyticsSummary {
  const byTopic: Record<string, GuideTelemetryTopicMetrics> = {};
  const bySurface = Object.fromEntries(
    GUIDE_TELEMETRY_SURFACE_VALUES.map((surface) => [surface, emptyTopicMetrics()]),
  ) as Record<AiGuideTelemetrySurface, GuideTelemetryTopicMetrics>;

  let topicsOpened = 0;
  let stepsCompleted = 0;
  let handoffsToAction = 0;
  let groundingFailures = 0;
  let guideCompletions = 0;

  for (const row of rows) {
    switch (row.event) {
      case 'topic_opened':
        topicsOpened += 1;
        break;
      case 'step_completed':
        stepsCompleted += 1;
        if (
          row.stepIndex != null &&
          row.totalSteps != null &&
          row.stepIndex >= row.totalSteps - 1
        ) {
          guideCompletions += 1;
        }
        break;
      case 'handoff_to_action':
        handoffsToAction += 1;
        break;
      case 'grounding_failure':
        groundingFailures += 1;
        break;
      default:
        break;
    }

    const topicKey = row.topicId?.trim() || 'unknown';
    if (!byTopic[topicKey]) byTopic[topicKey] = emptyTopicMetrics();
    bumpTopicMetrics(byTopic[topicKey], row);
    bumpTopicMetrics(bySurface[row.surface], row);
  }

  const guideAttempts = topicsOpened + groundingFailures;
  return {
    periodDays,
    topicsOpened,
    stepsCompleted,
    handoffsToAction,
    groundingFailures,
    guideCompletionRate: topicsOpened > 0 ? guideCompletions / topicsOpened : 0,
    avgStepsCompletedPerGuide: topicsOpened > 0 ? stepsCompleted / topicsOpened : 0,
    handoffToActionRate: topicsOpened > 0 ? handoffsToAction / topicsOpened : 0,
    groundingFailureRate: guideAttempts > 0 ? groundingFailures / guideAttempts : 0,
    byTopic,
    bySurface,
    topUnansweredTopics: [],
  };
}

export function recordProductGuideTopicOpenedTelemetry(
  recorder: ProductGuideTelemetryRecorder | undefined,
  params: {
    businessId: string;
    userId?: string;
    route?: string;
    surface?: IngestGuideTelemetryEventInput['surface'];
    locale: AppLocale;
  },
  guide: GuideResponse,
): void {
  if (!recorder || !guide.steps?.length) return;
  recorder.recordTopicOpened({
    businessId: params.businessId,
    userId: params.userId,
    surface:
      params.surface ??
      resolveGuideFlowSurfaceFromRoute(params.route) ??
      'dashboard',
    topicId: guide.topicId,
    route: params.route,
    locale: params.locale,
    totalSteps: guide.steps.length,
    relatedActionsCount: guide.relatedActions?.length ?? 0,
  });
}

export function recordProductGuideGroundingFailureTelemetry(
  recorder: ProductGuideTelemetryRecorder | undefined,
  params: {
    businessId: string;
    userId?: string;
    route?: string;
    surface?: IngestGuideTelemetryEventInput['surface'];
    locale: AppLocale;
    topicId?: string;
  },
  issueCodes: readonly string[],
): void {
  if (!recorder || issueCodes.length === 0) return;
  recorder.recordGroundingFailure({
    businessId: params.businessId,
    userId: params.userId,
    surface:
      params.surface ??
      resolveGuideFlowSurfaceFromRoute(params.route) ??
      'dashboard',
    topicId: params.topicId,
    route: params.route,
    locale: params.locale,
    issueCodes,
  });
}
