import {
  GET_DIRECTIONS_TO_SALON_PROMPTS,
  GET_DIRECTIONS_TO_SALON_RESCUE_SCENARIOS,
} from './ai-get-directions-to-salon.fixtures.js';
import {
  CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES,
  detectGetDirectionsToSalonAction,
  enrichGetDirectionsToSalonParamsFromPrompt,
  isGetDirectionsToSalonPrompt,
  rescueGetDirectionsToSalonIntent,
} from './ai-get-directions-to-salon.util.js';
import { GET_DIRECTIONS_TO_SALON_MULTILINGUAL_SCENARIOS } from './ai-get-directions-to-salon-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_GET_DIRECTIONS_TO_SALON_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { isExplainBusinessHoursAndLocationPrompt } from './ai-explain-business-hours-and-location.util.js';

describe('ai-get-directions-to-salon.util (ai-cmd-customer-4.3.3)', () => {
  it('exports classifier rules for get_directions_to_salon', () => {
    expect(CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES).toContain(
      'get_directions_to_salon',
    );
    expect(CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES).toContain(
      'Directions to the salon',
    );
  });

  it.each(GET_DIRECTIONS_TO_SALON_PROMPTS.map((row) => [row.id, row] as const))(
    'detects salon directions prompt $id',
    (_id, row) => {
      expect(isGetDirectionsToSalonPrompt(row.prompt)).toBe(true);
      expect(detectGetDirectionsToSalonAction(row.prompt)).toBe(
        row.expectedAction,
      );
      expect(isExplainBusinessHoursAndLocationPrompt(row.prompt)).toBe(false);
    },
  );

  it.each(
    GET_DIRECTIONS_TO_SALON_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual salon directions prompt $id', (_id, row) => {
    expect(isGetDirectionsToSalonPrompt(row.prompt)).toBe(true);
    expect(
      rescueGetDirectionsToSalonIntent(row.prompt, 'unknown')?.action,
    ).toBe('get_directions_to_salon');
  });

  it.each(GET_DIRECTIONS_TO_SALON_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues salon directions prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueGetDirectionsToSalonIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
    },
  );

  it.each(GET_DIRECTIONS_TO_SALON_RESCUE_SCENARIOS)(
    'rescues $id from misclassification',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueGetDirectionsToSalonIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'salon_directions',
      });
    },
  );

  it('enriches aspect params', () => {
    const enriched = enrichGetDirectionsToSalonParamsFromPrompt(
      {},
      'Where do I park?',
    );
    expect(enriched.aspect).toBe('parking');
  });

  it('does not classify static hours/location prompts', () => {
    expect(isGetDirectionsToSalonPrompt('What are your opening hours?')).toBe(
      false,
    );
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      GET_DIRECTIONS_TO_SALON_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      GET_DIRECTIONS_TO_SALON_PROMPTS.filter((row) => row.surface === 'public')
        .length,
    ).toBeGreaterThanOrEqual(10);

    for (const evalCase of AI_COMMAND_EVAL_GET_DIRECTIONS_TO_SALON_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
