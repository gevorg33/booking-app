import {
  accumulateCrossTurnPartialParams,
  mergeCrossTurnClarifyParams,
  mergeCrossTurnClarifyPrompt,
  mergeParamsWithoutLoss,
  readClarifyPartialParams,
  restoreOriginalIntentFromClarifySession,
} from './ai-clarify-cross-turn-merge.util.js';
import { CROSS_TURN_SLOT_MERGE_SCENARIOS } from './ai-clarify-cross-turn-merge.fixtures.js';

describe('ai-clarify-cross-turn-merge.util (acc-4.5)', () => {
  it.each(CROSS_TURN_SLOT_MERGE_SCENARIOS)('$id cross-turn slot merge', (scenario) => {
    const intent = {
      action: scenario.classifierAction ?? scenario.originalAction,
      params: { ...(scenario.classifierParams ?? {}) },
      reasoning: 'classifier',
      confidence: 0.7,
    };

    restoreOriginalIntentFromClarifySession(intent, scenario.sessionContext);
    const merged = mergeCrossTurnClarifyParams(intent.params, scenario.sessionContext, {
      surface: scenario.surface,
    });

    if (scenario.expectAction) {
      expect(intent.action).toBe(scenario.expectAction);
    }

    for (const [key, value] of Object.entries(scenario.expectParams)) {
      expect(merged[key]).toBe(value);
    }

    if (scenario.followUpPrompt) {
      expect(
        mergeCrossTurnClarifyPrompt(scenario.prompt, scenario.sessionContext),
      ).toBe(scenario.followUpPrompt);
    }
  });

  it('mergeParamsWithoutLoss never overwrites non-empty classifier params', () => {
    expect(
      mergeParamsWithoutLoss(
        { serviceName: 'Deep Tissue Massage', employeeName: 'Anna Smith' },
        { serviceName: 'Swedish Massage', date: '2026-06-08' },
      ),
    ).toEqual({
      serviceName: 'Deep Tissue Massage',
      employeeName: 'Anna Smith',
      date: '2026-06-08',
    });
  });

  it('readClarifyPartialParams combines context partials and clarify memory', () => {
    expect(
      readClarifyPartialParams({
        _clarifyContext: {
          originalPrompt: 'book massage',
          originalAction: 'create_booking',
          partialParams: { employeeName: 'Gevorg' },
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
        _clarifyMemory: { date: '2026-06-08' },
      }),
    ).toEqual({
      employeeName: 'Gevorg',
      date: '2026-06-08',
    });
  });

  it('accumulateCrossTurnPartialParams layers new answers onto prior partials', () => {
    expect(
      accumulateCrossTurnPartialParams(
        { timeSlot: '10:00', date: '2026-06-09' },
        {
          _clarifyContext: {
            originalPrompt: 'book massage with Anna',
            originalAction: 'create_booking',
            partialParams: {
              serviceName: 'Swedish Massage',
              employeeName: 'Anna Smith',
            },
            clarifyRound: 1,
            clarifyKind: 'targeted_slots',
          },
        },
      ),
    ).toEqual({
      serviceName: 'Swedish Massage',
      employeeName: 'Anna Smith',
      timeSlot: '10:00',
      date: '2026-06-09',
    });
  });

  it('restoreOriginalIntentFromClarifySession keeps original action on unknown follow-up', () => {
    const intent = restoreOriginalIntentFromClarifySession(
      { action: 'unknown', params: { date: '2026-06-09' }, reasoning: 'x' },
      {
        _clarifyContext: {
          originalPrompt: 'book massage',
          originalAction: 'create_booking',
          partialParams: { serviceName: 'Massage' },
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      },
    );
    expect(intent.action).toBe('create_booking');
  });

  it('mergeCrossTurnClarifyPrompt preserves original booking prompt', () => {
    expect(
      mergeCrossTurnClarifyPrompt('tomorrow at 10', {
        _clarifyContext: {
          originalPrompt: 'book massage with Anna',
          originalAction: 'create_booking',
          partialParams: { serviceName: 'massage' },
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      }),
    ).toBe('book massage with Anna. tomorrow at 10');
  });
});
