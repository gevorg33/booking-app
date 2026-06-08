import { AiEvalHarvestScheduler } from './ai-eval-harvest.scheduler.js';
import {
  buildEvalHarvestCandidatesFromRows,
  isEvalHarvestCandidate,
  type AiTraceAnalyticsRow,
} from './ai-command-trace.util.js';

/** acc-2.1 — production prompt harvester gate (trace → anonymized labeling queue). */
describe('ai-eval-harvest eval gate (acc-2.1)', () => {
  const now = new Date();

  function trace(
    overrides: Partial<AiTraceAnalyticsRow> & Pick<AiTraceAnalyticsRow, 'traceId'>,
  ): AiTraceAnalyticsRow {
    return {
      surface: 'dashboard',
      locale: 'en',
      action: 'create_booking',
      outcome: 'executed',
      confidence: 0.9,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'book haircut tomorrow',
      createdAt: now,
      ...overrides,
    };
  }

  it('harvests suspected_miss, thumbs-down, low-confidence, failed, and clarify-abandoned traces', () => {
    const signals: Array<{ id: string; row: AiTraceAnalyticsRow; expect: boolean }> = [
      {
        id: 'suspected_miss',
        row: trace({
          traceId: 't1',
          rawPrompt: 'book anna for haircut tomorrow',
          failureSignal: 'suspected_miss',
          outcome: 'clarified',
          confidence: 0.4,
        }),
        expect: true,
      },
      {
        id: 'thumbs_down',
        row: trace({
          traceId: 't2',
          rawPrompt: 'cancel maria appointment',
          feedbackRating: 'down',
        }),
        expect: true,
      },
      {
        id: 'low_confidence',
        row: trace({
          traceId: 't3',
          rawPrompt: 'reschedule to 3pm',
          confidence: 0.42,
        }),
        expect: true,
      },
      {
        id: 'failed_outcome',
        row: trace({
          traceId: 't4',
          rawPrompt: 'mark booking paid',
          outcome: 'failed',
        }),
        expect: true,
      },
      {
        id: 'clarify_abandoned',
        row: trace({
          traceId: 't5',
          rawPrompt: 'book massage with anna',
          failureSignal: 'clarify_abandoned',
          outcome: 'clarified',
        }),
        expect: true,
      },
      {
        id: 'healthy_trace',
        row: trace({
          traceId: 't6',
          rawPrompt: 'show appointments today',
          action: 'list_bookings',
          confidence: 0.95,
        }),
        expect: false,
      },
    ];

    for (const entry of signals) {
      expect(isEvalHarvestCandidate(entry.row)).toBe(entry.expect);
    }

    const candidates = buildEvalHarvestCandidatesFromRows(
      signals.filter((entry) => entry.expect).map((entry) => entry.row),
      50,
    );
    expect(candidates).toHaveLength(5);
    expect(candidates.every((row) => !row.promptSnippet.includes('@'))).toBe(true);
  });

  it('deduplicates by prompt hash and aggregates failure counts', () => {
    const rows = [
      trace({
        traceId: 'dup-1',
        failureSignal: 'suspected_miss',
        rawPrompt: 'book anna@gmail.com tomorrow',
        confidence: 0.4,
      }),
      trace({
        traceId: 'dup-2',
        feedbackRating: 'down',
        rawPrompt: 'book anna@gmail.com tomorrow',
        confidence: 0.88,
      }),
    ];

    const candidates = buildEvalHarvestCandidatesFromRows(rows, 10);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.failureCount).toBe(2);
    expect(candidates[0]?.promptSnippet).toContain('[email]');
  });

  it('weekly scheduler harvests all active businesses for a 7-day window', async () => {
    const harvestAllBusinesses = jest.fn(async () => 4);
    const scheduler = new AiEvalHarvestScheduler({
      harvestAllBusinesses,
    } as never);

    await scheduler.harvestProductionPrompts();

    expect(harvestAllBusinesses).toHaveBeenCalledWith(7);
  });
});
