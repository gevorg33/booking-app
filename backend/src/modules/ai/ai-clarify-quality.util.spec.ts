import {
  buildClarifyQualityHarvestCandidates,
  computeClarifyQualityMetrics,
  mergeEvalHarvestCandidates,
  pairClarifyFollowUps,
  resolveClarifyNextTurnOutcome,
} from './ai-clarify-quality.util.js';
import { CLARIFY_QUALITY_TRACE_FIXTURES } from './ai-clarify-quality.fixtures.js';
import {
  CLARIFY_NEXT_TURN_SUCCESS_TARGET,
} from './ai-platform.util.js';
import { aggregateTraceAccuracyAnalytics } from './ai-command-trace.util.js';

describe('ai-clarify-quality.util (acc-4.8)', () => {
  it('counts clarify success when next turn executes same intent', () => {
    const metrics = computeClarifyQualityMetrics(
      CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn,
      Date.parse('2026-06-07T10:05:00Z'),
    );
    expect(metrics.sampleSize).toBe(1);
    expect(metrics.successCount).toBe(1);
    expect(metrics.successRate).toBe(1);
    expect(metrics.meetsTarget).toBe(true);
  });

  it('marks abandoned clarifies as bad quality', () => {
    const metrics = computeClarifyQualityMetrics(
      CLARIFY_QUALITY_TRACE_FIXTURES.abandonedClarify,
      Date.parse('2026-06-07T11:05:00Z'),
    );
    expect(metrics.successCount).toBe(0);
    expect(metrics.abandonCount).toBe(1);
    expect(metrics.successRate).toBe(0);
    expect(metrics.meetsTarget).toBe(false);
  });

  it('flags second clarify without execution as bad quality', () => {
    const outcome = resolveClarifyNextTurnOutcome(
      CLARIFY_QUALITY_TRACE_FIXTURES.secondClarify[0],
      CLARIFY_QUALITY_TRACE_FIXTURES.secondClarify[1],
    );
    expect(outcome).toBe('second_clarify');

    const metrics = computeClarifyQualityMetrics(
      CLARIFY_QUALITY_TRACE_FIXTURES.secondClarify,
      Date.parse('2026-06-07T12:05:00Z'),
    );
    expect(metrics.secondClarifyCount).toBe(1);
    expect(metrics.successRate).toBe(0);
  });

  it('aggregateTraceAccuracyAnalytics exposes clarify quality fields', () => {
    const summary = aggregateTraceAccuracyAnalytics(
      CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn,
      7,
    );
    expect(summary.clarifySuccessRate).toBe(1);
    expect(summary.clarifyQualityTarget).toBe(CLARIFY_NEXT_TURN_SUCCESS_TARGET);
    expect(summary.clarifyQualityMeetsTarget).toBe(true);
    expect(summary.clarifyNextTurnSampleSize).toBe(1);
    expect(summary.worstClarifies).toEqual([]);
  });

  it('buildClarifyQualityHarvestCandidates queues bad clarifies for acc-2', () => {
    const candidates = buildClarifyQualityHarvestCandidates(
      [
        ...CLARIFY_QUALITY_TRACE_FIXTURES.abandonedClarify,
        ...CLARIFY_QUALITY_TRACE_FIXTURES.secondClarify,
      ],
      10,
      Date.parse('2026-06-07T13:00:00Z'),
    );
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.every((row) => row.harvestSource === 'clarify_quality')).toBe(
      true,
    );
  });

  it('mergeEvalHarvestCandidates prefers clarify quality metadata on hash collision', () => {
    const merged = mergeEvalHarvestCandidates(
      [
        {
          rank: 1,
          promptHash: 'abc',
          promptSnippet: 'book haircut',
          action: 'create_booking',
          surface: 'dashboard',
          locale: 'en',
          failureCount: 1,
          avgConfidence: 0.4,
          failureSignals: {
            suspected_miss: 1,
            wrong_execution: 0,
            clarify_abandoned: 0,
            thumbs_down: 0,
            failed_outcome: 0,
            low_confidence: 0,
          },
          correctedAction: null,
          lastSeenAt: '2026-06-07T12:00:00Z',
        },
      ],
      [
        {
          rank: 1,
          promptHash: 'abc',
          promptSnippet: 'book haircut',
          action: 'create_booking',
          surface: 'dashboard',
          locale: 'en',
          failureCount: 2,
          avgConfidence: null,
          failureSignals: {
            suspected_miss: 0,
            wrong_execution: 0,
            clarify_abandoned: 2,
            thumbs_down: 0,
            failed_outcome: 0,
            low_confidence: 0,
          },
          correctedAction: null,
          lastSeenAt: '2026-06-07T12:00:00Z',
          harvestSource: 'clarify_quality',
          clarifyKind: 'entity_disambiguation',
          nextTurnOutcome: 'second_clarify',
        },
      ],
    );
    expect(merged[0]?.harvestSource).toBe('clarify_quality');
    expect(merged[0]?.clarifyKind).toBe('entity_disambiguation');
  });

  it('pairClarifyFollowUps respects user/session boundaries', () => {
    const pairs = pairClarifyFollowUps(
      [
        ...CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn,
        {
          ...CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn[0],
          traceId: 'other-user',
          userId: 'u9',
        },
      ],
      Date.parse('2026-06-07T10:05:00Z'),
    );
    expect(pairs).toHaveLength(2);
  });
});
