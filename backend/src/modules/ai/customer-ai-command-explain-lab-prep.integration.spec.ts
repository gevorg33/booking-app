import {
  EXPLAIN_LAB_PREP_PROMPTS,
  EXPLAIN_LAB_PREP_RESCUE_SCENARIOS,
  rescueExplainLabPrepIntent,
} from './ai-explain-lab-prep.util.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS } from './ai-explain-lab-prep-multilingual.fixtures.js';

describe('customer/public explain_lab_prep integration (ai-cmd-customer-4.7.1)', () => {
  it.each(EXPLAIN_LAB_PREP_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain_lab_prep for $id on $surface',
    (_id, row) => {
      expect(rescueExplainLabPrepIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_lab_prep',
      );
    },
  );

  it.each(
    EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual explain_lab_prep for $id', (_id, row) => {
    expect(rescueExplainLabPrepIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_lab_prep',
    );
  });

  it.each(
    EXPLAIN_LAB_PREP_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues misclassified explain_lab_prep for $id', (_id, row) => {
    expect(
      rescueExplainLabPrepIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('explain_lab_prep');
  });
});
