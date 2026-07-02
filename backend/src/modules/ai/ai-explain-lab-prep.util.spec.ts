import {
  CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES,
  EXPLAIN_LAB_PREP_PROMPTS,
  EXPLAIN_LAB_PREP_RESCUE_SCENARIOS,
  detectExplainLabPrepAction,
  enrichExplainLabPrepParamsFromPrompt,
  isExplainLabPrepPrompt,
  rescueExplainLabPrepIntent,
} from './ai-explain-lab-prep.util.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS } from './ai-explain-lab-prep-multilingual.fixtures.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainPreparationNotesPrompt } from './ai-explain-preparation-notes.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_LAB_PREP_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-lab-prep.util (ai-cmd-customer-4.7.1)', () => {
  it('exports classifier rules for explain_lab_prep', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES).toContain(
      'explain_lab_prep',
    );
  });

  it.each(EXPLAIN_LAB_PREP_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_lab_prep for $id',
    (_id, row) => {
      expect(isExplainLabPrepPrompt(row.prompt)).toBe(true);
      expect(detectExplainLabPrepAction(row.prompt)).toBe(row.expectedAction);
      expect(rescueExplainLabPrepIntent(row.prompt, 'unknown')?.action).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(
    EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_lab_prep for $id', (_id, row) => {
    expect(isExplainLabPrepPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_LAB_PREP_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueExplainLabPrepIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('explain_lab_prep');
  });

  it('rejects checkout, visit-prep, and empty prompts', () => {
    expect(isExplainLabPrepPrompt('')).toBe(false);
    expect(
      isExplainLabPrepPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(false);
    expect(
      isExplainClinicBookingPrompt('Do I need to fast before this blood draw?'),
    ).toBe(true);
    expect(
      isExplainLabPrepPrompt('Do I need to fast before this blood draw?'),
    ).toBe(false);
    expect(
      isExplainPreparationNotesPrompt('Do I need to fast before my visit?'),
    ).toBe(true);
    expect(isExplainLabPrepPrompt('Do I need to fast before my visit?')).toBe(
      false,
    );
    expect(isExplainLabPrepPrompt('Show my lab test results')).toBe(false);
    expect(isExplainLabPrepPrompt('Book lab draw earliest slot')).toBe(false);
  });

  it('enriches serviceName from prompt', () => {
    expect(
      enrichExplainLabPrepParamsFromPrompt({}, 'Does CBC require fasting?')
        .serviceName,
    ).toBe('CBC');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(EXPLAIN_LAB_PREP_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_EXPLAIN_LAB_PREP_CASES.length).toBe(
      EXPLAIN_LAB_PREP_PROMPTS.length +
        EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS.length +
        EXPLAIN_LAB_PREP_RESCUE_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_LAB_PREP_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
