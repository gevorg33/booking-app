import type { IngestGuideTelemetryEventInput } from './guide-telemetry.types.js';

export const GUIDE_TELEMETRY_EVENT_NAMES = [
  'topic_opened',
  'step_completed',
  'handoff_to_action',
  'grounding_failure',
] as const;

export const GUIDE_TELEMETRY_SURFACE_VALUES = [
  'dashboard',
  'provider',
  'customer',
  'public',
] as const;

export const GUIDE_TELEMETRY_INGEST_SCENARIOS: readonly {
  id: string;
  input: IngestGuideTelemetryEventInput;
}[] = [
  {
    id: 'dashboard-topic-opened',
    input: {
      event: 'topic_opened',
      surface: 'dashboard',
      topicId: 'dashboard.core.schedule',
      route: '/dashboard/schedule',
      locale: 'en',
      sessionId: '11111111-1111-4111-8111-111111111111',
      totalSteps: 3,
      relatedActionsCount: 1,
    },
  },
  {
    id: 'dashboard-step-completed',
    input: {
      event: 'step_completed',
      surface: 'dashboard',
      topicId: 'dashboard.core.schedule',
      route: '/dashboard/schedule',
      locale: 'en',
      sessionId: '11111111-1111-4111-8111-111111111111',
      stepIndex: 1,
      totalSteps: 3,
    },
  },
  {
    id: 'dashboard-handoff',
    input: {
      event: 'handoff_to_action',
      surface: 'dashboard',
      topicId: 'dashboard.core.schedule',
      route: '/dashboard/schedule',
      locale: 'en',
      sessionId: '11111111-1111-4111-8111-111111111111',
      handoffAction: 'apply_schedule',
      totalSteps: 3,
    },
  },
  {
    id: 'provider-grounding-failure',
    input: {
      event: 'grounding_failure',
      surface: 'provider',
      topicId: 'provider.today.overview',
      route: '/provider/today',
      locale: 'en',
      issueCodes: ['unknown_route'],
    },
  },
  {
    id: 'public-topic-opened',
    input: {
      event: 'topic_opened',
      surface: 'public',
      topicId: 'public.checkout',
      route: 'checkout',
      locale: 'hy',
      sessionId: '22222222-2222-4222-8222-222222222222',
      totalSteps: 2,
      relatedActionsCount: 0,
    },
  },
];

export const GUIDE_TELEMETRY_AGGREGATE_ROWS = [
  {
    event: 'topic_opened' as const,
    surface: 'dashboard' as const,
    topicId: 'dashboard.core.schedule',
    stepIndex: null,
    totalSteps: 3,
    relatedActionsCount: 1,
  },
  {
    event: 'step_completed' as const,
    surface: 'dashboard' as const,
    topicId: 'dashboard.core.schedule',
    stepIndex: 0,
    totalSteps: 3,
    relatedActionsCount: null,
  },
  {
    event: 'step_completed' as const,
    surface: 'dashboard' as const,
    topicId: 'dashboard.core.schedule',
    stepIndex: 2,
    totalSteps: 3,
    relatedActionsCount: null,
  },
  {
    event: 'handoff_to_action' as const,
    surface: 'dashboard' as const,
    topicId: 'dashboard.core.schedule',
    stepIndex: null,
    totalSteps: 3,
    relatedActionsCount: null,
    handoffAction: 'apply_schedule',
  },
  {
    event: 'grounding_failure' as const,
    surface: 'provider' as const,
    topicId: 'provider.today.overview',
    stepIndex: null,
    totalSteps: null,
    relatedActionsCount: null,
  },
  {
    event: 'topic_opened' as const,
    surface: 'provider' as const,
    topicId: 'provider.today.overview',
    stepIndex: null,
    totalSteps: 2,
    relatedActionsCount: 0,
  },
];

/** ai-guide-1.7.4 — unanswered topic ranking fixtures. */
export const GUIDE_UNANSWERED_RANKING_FIXTURES = {
  byTopic: {
    'dashboard.core.schedule': {
      opened: 10,
      stepsCompleted: 8,
      handoffs: 1,
      groundingFailures: 0,
      guideCompletions: 2,
    },
    'provider.today.overview': {
      opened: 5,
      stepsCompleted: 2,
      handoffs: 0,
      groundingFailures: 3,
      guideCompletions: 1,
    },
    unknown: {
      opened: 4,
      stepsCompleted: 0,
      handoffs: 0,
      groundingFailures: 0,
      guideCompletions: 0,
    },
    'dashboard.ai.ops': {
      opened: 3,
      stepsCompleted: 3,
      handoffs: 0,
      groundingFailures: 0,
      guideCompletions: 3,
    },
  },
} as const;
