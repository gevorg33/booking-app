import {
  buildClarifyPromptFix,
  buildEntityAliasesFromExpectedParams,
  buildFailureClosurePlan,
  buildLearnedTelemetryRescueRule,
  inferFailureFixType,
  markFailureClosureApplied,
  mergeClarifyPromptFixes,
  mergeLearnedTelemetryRescueRules,
  matchLearnedTelemetryRescueRule,
} from './ai-failure-closure.util.js';
import { FAILURE_CLOSURE_SCENARIOS } from './ai-failure-closure.fixtures.js';

describe('ai-failure-closure.util (acc-6.2)', () => {
  it.each(FAILURE_CLOSURE_SCENARIOS)('$id infers fix type', (scenario) => {
    expect(
      inferFailureFixType({
        classifiedAction: scenario.classifiedAction ?? 'unknown',
        correctedAction: (scenario as any).correctedAction,
        expectedRescuedAction: (scenario as any).expectedRescuedAction,
        labelOutcome: (scenario as any).labelOutcome,
        expectedClarifyFields: (scenario as any).expectedClarifyFields,
        expectedParams: (scenario as any).expectedParams,
      }),
    ).toBe(scenario.expectFixType);
  });

  it('buildFailureClosurePlan tracks open status', () => {
    const plan = buildFailureClosurePlan({
      classifiedAction: 'list_bookings',
      expectedRescuedAction: 'show_appointments',
    });
    expect(plan.fixStatus).toBe('open');
    expect(plan.fixType).toBe('rescue');
  });

  it('buildLearnedTelemetryRescueRule captures prompt-specific rescue', () => {
    const rule = buildLearnedTelemetryRescueRule({
      promptHash: 'abc123def456',
      promptSnippet: 'show my appointments today',
      surface: 'dashboard',
      classifiedAction: 'list_bookings',
      expectedRescuedAction: 'show_appointments',
      correctedAction: null,
      expectedAction: null,
      rescueFromAction: 'list_bookings',
      evalCaseId: 'harvest-biz-1-abc',
    });
    expect(rule?.toAction).toBe('show_appointments');
    expect(
      matchLearnedTelemetryRescueRule(
        'show my appointments today please',
        'list_bookings',
        [rule!],
        'dashboard',
      )?.id,
    ).toBe(rule?.id);
  });

  it('buildEntityAliasesFromExpectedParams maps entity fields', () => {
    const aliases = buildEntityAliasesFromExpectedParams({
      customerName: 'Maria K.',
      employeeName: 'Anna',
    });
    expect(aliases['maria k.']).toEqual({ customerName: 'Maria K.' });
    expect(aliases.anna).toEqual({ employeeName: 'Anna' });
  });

  it('mergeLearnedTelemetryRescueRules replaces by id', () => {
    const merged = mergeLearnedTelemetryRescueRules(
      [
        {
          id: 'learned-abc',
          fromAction: 'a',
          toAction: 'b',
          rescueReason: 'x',
          promptSnippet: 'old',
          promptHash: 'abc',
          learnedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {
        id: 'learned-abc',
        fromAction: 'a',
        toAction: 'c',
        rescueReason: 'y',
        promptSnippet: 'new',
        promptHash: 'abc',
        learnedAt: '2026-06-01T00:00:00.000Z',
      },
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.toAction).toBe('c');
  });

  it('buildClarifyPromptFix stores expected clarify fields', () => {
    const fix = buildClarifyPromptFix({
      promptHash: 'hash-1',
      promptSnippet: 'book anna',
      classifiedAction: 'create_booking',
      expectedClarifyFields: ['date', 'serviceName'],
      evalCaseId: 'case-1',
    });
    expect(fix?.clarifyFields).toEqual(['date', 'serviceName']);
    expect(
      mergeClarifyPromptFixes([], fix!).map((row) => row.id),
    ).toEqual([fix!.id]);
  });

  it('markFailureClosureApplied sets applied status', () => {
    const plan = markFailureClosureApplied(
      buildFailureClosurePlan({
        classifiedAction: 'create_booking',
        correctedAction: 'list_bookings',
      }),
    );
    expect(plan.fixStatus).toBe('applied');
  });
});
