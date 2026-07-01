import type {
  AiGuideTelemetryEvent,
  AiGuideTelemetrySurface,
} from '../entities/ai-guide-telemetry.entity.js';

export interface GuideTelemetryContext {
  businessId: string;
  surface: AiGuideTelemetrySurface;
  userId?: string;
  topicId?: string;
  route?: string;
  locale?: string;
  sessionId?: string;
}

export interface RecordGuideTopicOpenedInput extends GuideTelemetryContext {
  totalSteps: number;
  relatedActionsCount?: number;
}

export interface RecordGuideStepCompletedInput extends GuideTelemetryContext {
  stepIndex: number;
  totalSteps: number;
}

export interface RecordGuideHandoffInput extends GuideTelemetryContext {
  handoffAction: string;
  totalSteps?: number;
}

export interface RecordGuideGroundingFailureInput extends GuideTelemetryContext {
  issueCodes: readonly string[];
}

export interface ProductGuideTelemetryRecorder {
  recordTopicOpened(input: RecordGuideTopicOpenedInput): void;
  recordGroundingFailure(input: RecordGuideGroundingFailureInput): void;
}

export interface IngestGuideTelemetryEventInput {
  event: AiGuideTelemetryEvent;
  surface: AiGuideTelemetrySurface;
  topicId?: string;
  route?: string;
  locale?: string;
  sessionId?: string;
  stepIndex?: number;
  totalSteps?: number;
  handoffAction?: string;
  relatedActionsCount?: number;
  issueCodes?: readonly string[];
}

export interface GuideTelemetryTopicMetrics {
  opened: number;
  stepsCompleted: number;
  handoffs: number;
  groundingFailures: number;
  guideCompletions: number;
}

export interface GuideTelemetryAnalyticsSummary {
  periodDays: number;
  topicsOpened: number;
  stepsCompleted: number;
  handoffsToAction: number;
  groundingFailures: number;
  guideCompletionRate: number;
  avgStepsCompletedPerGuide: number;
  handoffToActionRate: number;
  groundingFailureRate: number;
  byTopic: Record<string, GuideTelemetryTopicMetrics>;
  bySurface: Record<AiGuideTelemetrySurface, GuideTelemetryTopicMetrics>;
  topUnansweredTopics: GuideUnansweredTopicRow[];
}

export type GuideUnansweredReason =
  | 'low_completion'
  | 'grounding_failure'
  | 'missing_topic';

export interface GuideUnansweredTopicRow {
  topicId: string;
  opened: number;
  guideCompletions: number;
  groundingFailures: number;
  stepsCompleted: number;
  handoffs: number;
  completionRate: number;
  unansweredRate: number;
  priorityScore: number;
  reasons: readonly GuideUnansweredReason[];
  anchor?: string;
  titleKey?: string;
  inCorpus: boolean;
}
