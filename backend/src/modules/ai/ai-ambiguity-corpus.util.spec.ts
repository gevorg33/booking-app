import { validateCommand } from './command-completion.validator.js';
import {
  AMBIGUITY_CORPUS_SCENARIOS,
  type AmbiguityCorpusScenario,
} from './ai-ambiguity-corpus.fixtures.js';
import {
  buildAmbiguityValidationCommand,
  passesAmbiguityValidationScenario,
} from './ai-ambiguity-corpus.util.js';

describe('ai-ambiguity-corpus.util (acc-2.6)', () => {
  it.each(
    AMBIGUITY_CORPUS_SCENARIOS.filter(
      (row) => row.kind === 'validation_clarify',
    ).map((scenario) => [scenario.id, scenario]),
  )('expects validation clarify for %s', (_id, scenario) => {
    expect(passesAmbiguityValidationScenario(scenario)).toBe(true);
    const result = validateCommand(buildAmbiguityValidationCommand(scenario));
    expect(result.ok).toBe(false);
    for (const field of scenario.clarifyFieldsContains ?? []) {
      expect(result.issues.map((issue) => issue.field)).toContain(field);
    }
  });
});
