import { CLARIFY_QUALITY_TRACE_FIXTURES } from './ai-clarify-quality.fixtures.js';
import {
  buildClarifyQualityHarvestCandidates,
  buildWorstClarifiesFeed,
  shouldAutoQueueClarifyOutcome,
} from './ai-clarify-quality.util.js';
import { computeClarifyQualityByIntentAndLocale } from './ai-n99-clarify-success.util.js';
import { N99_CLARIFY_AUTO_QUEUE_SCENARIOS } from './ai-n99-clarify-quality.fixtures.js';
import { findClarifyAutoQueueCandidatesOnTraceWrite } from './ai-n99-clarify-quality.util.js';

describe('ai-n99-clarify-quality.util (n99-1.7)', () => {
  it('shouldAutoQueueClarifyOutcome only queues abandon and second_clarify', () => {
    expect(shouldAutoQueueClarifyOutcome('abandon')).toBe(true);
    expect(shouldAutoQueueClarifyOutcome('second_clarify')).toBe(true);
    expect(shouldAutoQueueClarifyOutcome('success')).toBe(false);
    expect(shouldAutoQueueClarifyOutcome('failed_follow_up')).toBe(false);
    expect(shouldAutoQueueClarifyOutcome('pending')).toBe(false);
  });

  it.each(N99_CLARIFY_AUTO_QUEUE_SCENARIOS)(
    '$id auto-queue on trace write',
    ({ prior, followUp, expectQueued, expectOutcome }) => {
      const candidates = findClarifyAutoQueueCandidatesOnTraceWrite({
        newTrace: followUp,
        recentClarifies: [prior],
      });
      if (!expectQueued) {
        expect(candidates).toEqual([]);
        return;
      }
      expect(candidates).toHaveLength(1);
      expect(candidates[0]?.harvestSource).toBe('clarify_quality');
      expect(candidates[0]?.nextTurnOutcome).toBe(expectOutcome);
    },
  );

  it('computes per-intent and per-locale clarify success from trace fixtures', () => {
    const nowMs = Date.parse('2026-06-07T13:00:00Z');
    const segments = computeClarifyQualityByIntentAndLocale(
      [
        ...CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn,
        ...CLARIFY_QUALITY_TRACE_FIXTURES.abandonedClarify,
      ],
      nowMs,
    );

    expect(segments.byIntent.create_booking?.successRate).toBe(1);
    expect(segments.byIntent.cancel_booking?.successRate).toBe(0);
    expect(segments.byLocale.en?.sampleSize).toBe(2);
  });

  it('builds worst-clarifies feed including failed follow-ups', () => {
    const nowMs = Date.parse('2026-06-07T13:00:00Z');
    const feed = buildWorstClarifiesFeed(
      CLARIFY_QUALITY_TRACE_FIXTURES.abandonedClarify,
      10,
      nowMs,
    );
    expect(feed[0]?.nextTurnOutcome).toBe('abandon');
  });

  it('harvest candidates only include abandon and second_clarify pairs', () => {
    const nowMs = Date.parse('2026-06-07T13:00:00Z');
    const rows = [
      ...CLARIFY_QUALITY_TRACE_FIXTURES.abandonedClarify,
      ...CLARIFY_QUALITY_TRACE_FIXTURES.secondClarify,
    ];
    const candidates = buildClarifyQualityHarvestCandidates(rows, 10, nowMs);
    expect(candidates.every((entry) => shouldAutoQueueClarifyOutcome(entry.nextTurnOutcome as never))).toBe(
      true,
    );
    expect(candidates.some((entry) => entry.nextTurnOutcome === 'second_clarify')).toBe(true);
    expect(candidates.some((entry) => entry.nextTurnOutcome === 'abandon')).toBe(true);
  });
});
