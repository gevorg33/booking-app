import {
  EXPLAIN_PREPARATION_NOTES_PROMPTS,
  EXPLAIN_PREPARATION_NOTES_RESCUE_SCENARIOS,
} from './ai-explain-preparation-notes.fixtures.js';
import {
  CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES,
  detectExplainPreparationNotesAction,
  enrichExplainPreparationNotesParamsFromPrompt,
  isExplainPreparationNotesPrompt,
  rescueExplainPreparationNotesIntent,
} from './ai-explain-preparation-notes.util.js';
import { EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_SCENARIOS } from './ai-explain-preparation-notes-multilingual.fixtures.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_PREPARATION_NOTES_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-preparation-notes.util (ai-cmd-customer-4.3.4)', () => {
  it('exports classifier rules for explain_preparation_notes', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES,
    ).toContain('explain_preparation_notes');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES,
    ).toContain('before my visit');
  });

  it.each(
    EXPLAIN_PREPARATION_NOTES_PROMPTS.map((row) => [row.id, row] as const),
  )('detects preparation notes prompt $id', (_id, row) => {
    expect(isExplainPreparationNotesPrompt(row.prompt)).toBe(true);
    expect(detectExplainPreparationNotesAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual preparation notes prompt $id', (_id, row) => {
    expect(isExplainPreparationNotesPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainPreparationNotesIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_preparation_notes');
  });

  it.each(
    EXPLAIN_PREPARATION_NOTES_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues preparation notes prompt $id from unknown', (_id, row) => {
    const rescued = rescueExplainPreparationNotesIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it.each(EXPLAIN_PREPARATION_NOTES_RESCUE_SCENARIOS)(
    'rescues $id from misclassification',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPreparationNotesIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'preparation_notes',
      });
    },
  );

  it('enriches aspect params', () => {
    const enriched = enrichExplainPreparationNotesParamsFromPrompt(
      {},
      'What should I bring to my appointment?',
    );
    expect(enriched.aspect).toBe('what_to_bring');
  });

  it('does not steal checkout clinic booking prompts', () => {
    expect(
      isExplainPreparationNotesPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(false);
    expect(
      isExplainClinicBookingPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(true);
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      EXPLAIN_PREPARATION_NOTES_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      EXPLAIN_PREPARATION_NOTES_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);

    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PREPARATION_NOTES_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
