import {
  buildAccuracyExitGateFromAnalytics,
  computeCompletionPlusGoodClarifyRate,
  computePrimaryLocaleSpread,
  evaluateAccuracyExitGate,
} from './ai-accuracy-exit-gate.util.js';
import {
  ACCURACY_EXIT_GATE_SCENARIOS,
  ACCURACY_EXIT_LOCALE_MIN_SAMPLES,
} from './ai-accuracy-exit-gate.fixtures.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';

function traceRow(
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
    createdAt: new Date('2026-06-01T10:00:00Z'),
    userId: 'u1',
    ...overrides,
  };
}

describe('ai-accuracy-exit-gate.util (acc-6.8)', () => {
  it.each(ACCURACY_EXIT_GATE_SCENARIOS)('$id exit gate', (scenario) => {
    const result = evaluateAccuracyExitGate(scenario.input);
    expect(result.met).toBe(scenario.expectMet);
    expect(result.criteria).toHaveLength(4);
  });

  it('computeCompletionPlusGoodClarifyRate counts executed + successful clarifies only', () => {
    const rows: AiTraceAnalyticsRow[] = [
      ...Array.from({ length: 90 }, (_, index) =>
        traceRow({ traceId: `exec-${index}` }),
      ),
      traceRow({
        traceId: 'clarify-good',
        outcome: 'clarified',
        createdAt: new Date('2026-06-01T11:00:00Z'),
      }),
      traceRow({
        traceId: 'clarify-follow',
        outcome: 'executed',
        createdAt: new Date('2026-06-01T11:01:00Z'),
      }),
      traceRow({
        traceId: 'clarify-bad',
        outcome: 'clarified',
        action: 'list_bookings',
        createdAt: new Date('2026-06-01T12:00:00Z'),
      }),
      traceRow({
        traceId: 'clarify-bad-follow',
        outcome: 'failed',
        action: 'list_bookings',
        createdAt: new Date('2026-06-01T12:01:00Z'),
      }),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const rate = computeCompletionPlusGoodClarifyRate(rows);
    expect(rate).toBeCloseTo(92 / 94, 4);
  });

  it('computePrimaryLocaleSpread requires en/hy/ru samples', () => {
    const spread = computePrimaryLocaleSpread({
      en: { total: 10, accurate: 9 },
      hy: { total: 2, accurate: 2 },
      ru: { total: 8, accurate: 7 },
    });
    expect(spread.insufficientLocales).toContain('hy');
    expect(spread.spread).toBe(Number.POSITIVE_INFINITY);
  });

  it('buildAccuracyExitGateFromAnalytics attaches four documented criteria', () => {
    const rows = Array.from({ length: ACCURACY_EXIT_LOCALE_MIN_SAMPLES }, (_, index) =>
      traceRow({
        traceId: `en-${index}`,
        locale: 'en',
      }),
    );
    for (const locale of ['hy', 'ru'] as const) {
      for (let index = 0; index < ACCURACY_EXIT_LOCALE_MIN_SAMPLES; index += 1) {
        rows.push(
          traceRow({
            traceId: `${locale}-${index}`,
            locale,
          }),
        );
      }
    }

    const analytics = {
      periodDays: 30,
      totalCommands: rows.length,
      noClarifyCompletionRate: 1,
      clarifyRate: 0,
      clarifySuccessRate: 1,
      clarifyQualityTarget: 0.9,
      clarifyQualityMeetsTarget: true,
      clarifyNextTurnSampleSize: 0,
      clarifyNextTurnSuccessCount: 0,
      clarifyAbandonRate: 0,
      misclassificationRate: 0,
      explicitNegativeRate: 0,
      byIntent: {},
      byLocale: {
        en: { total: ACCURACY_EXIT_LOCALE_MIN_SAMPLES, accurate: ACCURACY_EXIT_LOCALE_MIN_SAMPLES },
        hy: { total: ACCURACY_EXIT_LOCALE_MIN_SAMPLES, accurate: ACCURACY_EXIT_LOCALE_MIN_SAMPLES },
        ru: { total: ACCURACY_EXIT_LOCALE_MIN_SAMPLES, accurate: ACCURACY_EXIT_LOCALE_MIN_SAMPLES },
      },
      bySurface: {},
      confusionMatrix: [],
      worstPrompts: [],
      worstClarifies: [],
      accuracySlo: {} as any,
    };

    const gate = buildAccuracyExitGateFromAnalytics(analytics, rows);
    expect(gate.criteria.map((row) => row.id)).toEqual([
      'no_clarify',
      'completion_plus_good_clarify',
      'wrong_execution',
      'locale_parity',
    ]);
    expect(gate.met).toBe(true);
  });
});
