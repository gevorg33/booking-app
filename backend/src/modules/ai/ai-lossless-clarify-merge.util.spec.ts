import { describe, expect, it } from '@jest/globals';
import {
  enrichSessionWithLosslessClarifyPartials,
  mergeLosslessClarifyFollowUp,
  parseStructuredClarifyAnswersFromPrompt,
  shouldExecuteClarifyImmediately,
} from './ai-lossless-clarify-merge.util.js';
import { LOSSLESS_CLARIFY_MERGE_SCENARIOS } from './ai-lossless-clarify-merge.fixtures.js';

describe('ai-lossless-clarify-merge.util (n99-1.4)', () => {
  it.each(LOSSLESS_CLARIFY_MERGE_SCENARIOS)('$id lossless merge', (scenario) => {
    const result = mergeLosslessClarifyFollowUp({
      followUpPrompt: scenario.followUpPrompt,
      followUpAnswers: scenario.followUpAnswers,
      sessionContext: scenario.sessionContext,
      surface: scenario.surface,
      classifierAction: scenario.classifierAction,
      classifierParams: scenario.classifierParams,
    });

    expect(result.restoredAction).toBe(scenario.expectRestoredAction);
    expect(result.executeImmediately).toBe(scenario.expectExecuteImmediately);

    for (const [key, value] of Object.entries(scenario.expectMergedParams)) {
      expect(result.mergedParams[key]).toBe(value);
    }
  });

  it('parseStructuredClarifyAnswersFromPrompt extracts multi-field form answers', () => {
    expect(
      parseStructuredClarifyAnswersFromPrompt(
        'book with Anna. I meant Anna Smith. Date: 2026-06-09. Time: 10:00',
      ),
    ).toEqual({
      employeeName: 'Anna Smith',
      date: '2026-06-09',
      timeSlot: '10:00',
    });
  });

  it('enrichSessionWithLosslessClarifyPartials accumulates clarify memory into partialParams', () => {
    const enriched = enrichSessionWithLosslessClarifyPartials({
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Swedish Massage' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
      _clarifyMemory: { employeeName: 'Anna Smith', date: '2026-06-09' },
    });

    expect(
      (enriched._clarifyContext as { partialParams: Record<string, unknown> }).partialParams,
    ).toMatchObject({
      serviceName: 'Swedish Massage',
      employeeName: 'Anna Smith',
      date: '2026-06-09',
    });
  });

  it('shouldExecuteClarifyImmediately is false for incomplete booking', () => {
    expect(
      shouldExecuteClarifyImmediately('create_booking', 'book with Gevorg', {
        employeeName: 'Gevorg',
      }),
    ).toBe(false);
  });
});
