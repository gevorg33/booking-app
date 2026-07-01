import {
  EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS,
  EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS,
} from './ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS } from './ai-explain-public-intake-form-multilingual.fixtures.js';
import { rescueExplainPublicIntakeFormIntent } from './ai-explain-public-intake-form.util.js';

describe('customer/public explain_public_intake_form integration (ai-cmd-customer-4.14.1)', () => {
  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_public_intake_form for $id on $surface', (_id, row) => {
    expect(
      rescueExplainPublicIntakeFormIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_public_intake_form');
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual explain_public_intake_form for $id', (_id, row) => {
    expect(
      rescueExplainPublicIntakeFormIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_public_intake_form');
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified explain_public_intake_form for $id', (_id, row) => {
    expect(
      rescueExplainPublicIntakeFormIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_public_intake_form');
  });
});
