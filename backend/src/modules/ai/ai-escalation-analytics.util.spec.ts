import {
  buildEscalationEvalHarvestCandidates,
  buildEscalationReviewEntries,
  computeEscalationAnalytics,
  computeEscalationAnalyticsBySurface,
  exportEscalationAnalyticsFromRows,
  isEscalationTraceRow,
} from './ai-escalation-analytics.util.js';
import {
  ESCALATION_ANALYTICS_SCENARIOS,
  ESCALATION_RATE_TARGET,
} from './ai-escalation-analytics.fixtures.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import { extractTraceFailureSignal } from './ai-command-trace.util.js';

function row(
  overrides: Partial<AiTraceAnalyticsRow> & Pick<AiTraceAnalyticsRow, 'traceId'>,
): AiTraceAnalyticsRow {
  return {
    surface: 'dashboard',
    locale: 'en',
    action: 'unknown',
    outcome: 'clarified',
    confidence: null,
    failureSignal: null,
    feedbackRating: null,
    correctedAction: null,
    rawPrompt: 'help me book',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('ai-escalation-analytics.util (acc-6.7)', () => {
  it.each(ESCALATION_ANALYTICS_SCENARIOS)('$id escalation rate', (scenario) => {
    const rows = Array.from({ length: scenario.total }, (_, index) =>
      row({
        traceId: `t-${index}`,
        failureSignal:
          index < scenario.escalations ? ('human_escalation' as const) : null,
      }),
    );
    const summary = computeEscalationAnalytics(rows);
    expect(summary.escalationRate).toBeCloseTo(scenario.expectRate, 5);
    expect(summary.meetsTarget).toBe(scenario.expectMeetsTarget);
    expect(summary.impliedAccuracy).toBeCloseTo(1 - scenario.expectRate, 5);
  });

  it('isEscalationTraceRow matches failureSignal and human_handoff clarify', () => {
    expect(
      isEscalationTraceRow(
        row({ traceId: 'a', failureSignal: 'human_escalation' }),
      ),
    ).toBe(true);
    expect(
      isEscalationTraceRow(
        row({ traceId: 'b', clarifyKind: 'human_handoff' }),
      ),
    ).toBe(true);
    expect(isEscalationTraceRow(row({ traceId: 'c' }))).toBe(false);
  });

  it('buildEscalationReviewEntries returns newest escalations first', () => {
    const older = new Date('2026-01-01T10:00:00Z');
    const newer = new Date('2026-01-02T10:00:00Z');
    const entries = buildEscalationReviewEntries([
      row({
        traceId: 'old',
        failureSignal: 'human_escalation',
        rawPrompt: 'older prompt',
        createdAt: older,
      }),
      row({
        traceId: 'new',
        clarifyKind: 'human_handoff',
        rawPrompt: 'newer prompt',
        createdAt: newer,
      }),
    ]);
    expect(entries.map((entry) => entry.traceId)).toEqual(['new', 'old']);
  });

  it('computeEscalationAnalyticsBySurface groups by surface', () => {
    const bySurface = computeEscalationAnalyticsBySurface([
      row({ traceId: '1', surface: 'dashboard' }),
      row({ traceId: '2', surface: 'dashboard', failureSignal: 'human_escalation' }),
      row({ traceId: '3', surface: 'customer', clarifyKind: 'human_handoff' }),
    ]);
    expect(bySurface.dashboard).toEqual({
      total: 2,
      escalationCount: 1,
      escalationRate: 0.5,
    });
    expect(bySurface.customer.escalationCount).toBe(1);
  });

  it('buildEscalationEvalHarvestCandidates tags escalation harvest source', () => {
    const candidates = buildEscalationEvalHarvestCandidates([
      row({
        traceId: '1',
        failureSignal: 'human_escalation',
        rawPrompt: 'need human help with booking',
        action: 'request_human_help',
      }),
    ]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].harvestSource).toBe('escalation');
    expect(candidates[0].failureSignals.human_escalation).toBe(1);
  });

  it('exportEscalationAnalyticsFromRows includes periodDays', () => {
    const summary = exportEscalationAnalyticsFromRows([], 14, 5);
    expect(summary.periodDays).toBe(14);
    expect(summary.targetRate).toBe(ESCALATION_RATE_TARGET);
  });
});

describe('extractTraceFailureSignal (acc-6.7)', () => {
  it('persists human_escalation from executed handoff result', () => {
    expect(
      extractTraceFailureSignal({
        action: 'request_human_help',
        details: { humanHandoff: true, failureSignal: 'human_escalation' },
      }),
    ).toBe('human_escalation');
  });

  it('returns null for normal executed commands', () => {
    expect(
      extractTraceFailureSignal({
        action: 'create_booking',
        details: {},
      }),
    ).toBeNull();
  });
});
