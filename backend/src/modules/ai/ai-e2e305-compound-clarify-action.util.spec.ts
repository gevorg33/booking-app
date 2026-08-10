import { E2E305_MIDSTEP_ACTION_CASES } from './ai-e2e305-compound-clarify-action.fixtures.js';
import { attachCompoundResumeToClarifyResult } from './ai-compound-resume.util.js';

describe('e2e-bug.305: mid-step compound clarify action=compound_intent', () => {
  it.each(E2E305_MIDSTEP_ACTION_CASES)(
    'top-level action $id',
    ({
      clarifyAction,
      stepIndex,
      compoundActions,
      compoundStep,
      expectTopAction,
      expectCompoundStep,
    }) => {
      const clarify = attachCompoundResumeToClarifyResult(
        {
          success: false,
          action: clarifyAction,
          summary: `I need one more detail for ${clarifyAction}.`,
          details: {
            needsClarification: true,
            missing: [
              { field: 'timeSlot', label: 'Start time', message: 'required' },
            ],
          },
        },
        {
          plans: [],
          subIntents: compoundActions.map((action) => ({
            action,
            params: {},
            reasoning: action,
          })),
          stepIndex,
          compoundActions: [...compoundActions],
          confirmationPrompt: 'compound prompt',
          compoundStep,
        },
      );

      expect(clarify.action).toBe(expectTopAction);
      expect(clarify.action).not.toBe(clarifyAction);
      expect(clarify.details?.compoundStep).toBe(expectCompoundStep);
      expect(clarify.details?.compoundStepIndex).toBe(stepIndex);
      expect(clarify.details?.compoundActions).toEqual([...compoundActions]);
      expect(clarify.details?.decomposed).toBe(true);
      expect(
        (clarify.details?.sessionContext as Record<string, unknown>)
          ?.lastAction,
      ).toBe('compound_intent');
    },
  );

  it('does not leave clients reading only create_booking', () => {
    const clarify = attachCompoundResumeToClarifyResult(
      {
        success: false,
        action: 'create_booking',
        summary: 'Start time required',
        details: { needsClarification: true },
      },
      {
        plans: [],
        subIntents: [
          { action: 'reschedule_booking', params: {}, reasoning: 'move' },
          { action: 'create_booking', params: {}, reasoning: 'book' },
        ],
        stepIndex: 1,
        compoundActions: ['reschedule_booking', 'create_booking'],
        confirmationPrompt: 'Move X; then book Y',
        compoundStep: 'create_booking',
      },
    );
    expect(clarify.action).toBe('compound_intent');
    expect(clarify.details?.compoundStep).toBe('create_booking');
  });
});
