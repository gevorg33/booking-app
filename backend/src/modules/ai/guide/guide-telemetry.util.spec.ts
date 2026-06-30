import {
  GUIDE_TELEMETRY_AGGREGATE_ROWS,
  GUIDE_TELEMETRY_INGEST_SCENARIOS,
  GUIDE_UNANSWERED_RANKING_FIXTURES,
} from './guide-telemetry.fixtures.js';
import {
  aggregateGuideTelemetryMetrics,
  buildGuideTelemetryAnalyticsSummary,
  buildGuideGroundingFailureEvent,
  buildGuideHandoffEvent,
  buildGuideStepCompletedEvent,
  buildGuideTelemetryRow,
  buildGuideTopicOpenedEvent,
  parseGuideTelemetryEventInput,
  rankUnansweredGuideTopics,
} from './guide-telemetry.util.js';

describe('guide-telemetry.util (ai-guide-1.7.3)', () => {
  it.each(GUIDE_TELEMETRY_INGEST_SCENARIOS)(
    'parses ingest scenario $id',
    ({ input }) => {
      expect(parseGuideTelemetryEventInput(input as Record<string, unknown>)).toEqual(input);
    },
  );

  it('rejects invalid event names', () => {
    expect(
      parseGuideTelemetryEventInput({
        event: 'topic_viewed',
        surface: 'dashboard',
      }),
    ).toBeNull();
  });

  it('buildGuideTelemetryRow omits PII fields', () => {
    const row = buildGuideTelemetryRow(
      'biz-1',
      'user-1',
      buildGuideTopicOpenedEvent({
        businessId: 'biz-1',
        surface: 'dashboard',
        topicId: 'dashboard.core.schedule',
        route: '/dashboard/schedule',
        locale: 'en',
        totalSteps: 3,
        relatedActionsCount: 1,
      }),
    );
    expect(row).toMatchObject({
      businessId: 'biz-1',
      userId: 'user-1',
      event: 'topic_opened',
      topicId: 'dashboard.core.schedule',
    });
    expect(row).not.toHaveProperty('prompt');
  });

  it('aggregateGuideTelemetryMetrics computes rates', () => {
    const summary = aggregateGuideTelemetryMetrics(GUIDE_TELEMETRY_AGGREGATE_ROWS, 30);
    expect(summary.topicsOpened).toBe(2);
    expect(summary.stepsCompleted).toBe(2);
    expect(summary.handoffsToAction).toBe(1);
    expect(summary.groundingFailures).toBe(1);
    expect(summary.handoffToActionRate).toBeCloseTo(0.5);
    expect(summary.groundingFailureRate).toBeCloseTo(1 / 3);
    expect(summary.byTopic['dashboard.core.schedule'].opened).toBe(1);
    expect(summary.byTopic['dashboard.core.schedule'].guideCompletions).toBe(1);
  });

  it('buildGuideGroundingFailureEvent stores issue codes only', () => {
    expect(
      buildGuideGroundingFailureEvent({
        businessId: 'biz-1',
        surface: 'dashboard',
        topicId: 'dashboard.core.schedule',
        issueCodes: ['unknown_route', 'unknown_handoff_action'],
      }).issueCodes,
    ).toEqual(['unknown_route', 'unknown_handoff_action']);
  });

  it('buildGuideHandoffEvent preserves handoff action id', () => {
    expect(
      buildGuideHandoffEvent({
        businessId: 'biz-1',
        surface: 'provider',
        handoffAction: 'mark_paid',
      }).handoffAction,
    ).toBe('mark_paid');
  });

  it('buildGuideStepCompletedEvent records step index', () => {
    expect(
      buildGuideStepCompletedEvent({
        businessId: 'biz-1',
        surface: 'public',
        stepIndex: 1,
        totalSteps: 4,
      }),
    ).toMatchObject({ event: 'step_completed', stepIndex: 1, totalSteps: 4 });
  });
});

describe('guide-telemetry.util unanswered topics (ai-guide-1.7.4)', () => {
  it('rankUnansweredGuideTopics prioritizes low completion and grounding failures', () => {
    const ranked = rankUnansweredGuideTopics(GUIDE_UNANSWERED_RANKING_FIXTURES.byTopic, 5);
    expect(ranked.map((row) => row.topicId)).toEqual([
      'provider.today.overview',
      'unknown',
      'dashboard.core.schedule',
    ]);
    expect(ranked[0]?.reasons).toContain('grounding_failure');
    expect(ranked[1]?.reasons).toContain('missing_topic');
    expect(ranked[2]?.reasons).toContain('low_completion');
    expect(ranked.find((row) => row.topicId === 'dashboard.ai.ops')).toBeUndefined();
  });

  it('buildGuideTelemetryAnalyticsSummary attaches topUnansweredTopics', () => {
    const summary = buildGuideTelemetryAnalyticsSummary(GUIDE_TELEMETRY_AGGREGATE_ROWS, 30, 5);
    expect(summary.topUnansweredTopics.length).toBeGreaterThan(0);
    expect(summary.topicsOpened).toBe(2);
  });
});
