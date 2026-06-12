import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  AMBIGUITY_CORPUS_SCENARIOS,
  type AmbiguityCorpusScenario,
} from './ai-ambiguity-corpus.fixtures.js';

const EMPTY_ENTITIES: ResolvedCommand['entities'] = {
  employees: [],
  services: [],
  customers: [],
  templates: [],
};

export function buildAmbiguityValidationCommand(
  scenario: Pick<
    AmbiguityCorpusScenario,
    'prompt' | 'action' | 'validationParamsPartial'
  >,
): ResolvedCommand {
  return {
    action: scenario.action!,
    params: { ...(scenario.validationParamsPartial ?? {}) },
    reasoning: 'ambiguity-corpus-eval',
    prompt: scenario.prompt,
    businessId: 'eval-business',
    entities: EMPTY_ENTITIES,
    enrichedParams: {},
  };
}

export function evaluateAmbiguityValidationScenario(
  scenario: AmbiguityCorpusScenario,
): { ok: boolean; issueFields: string[] } {
  const result = validateCommand(buildAmbiguityValidationCommand(scenario));
  return {
    ok: result.ok,
    issueFields: result.issues.map((issue) => issue.field),
  };
}

export function passesAmbiguityValidationScenario(
  scenario: AmbiguityCorpusScenario,
): boolean {
  if (scenario.kind !== 'validation_clarify') return false;
  const { ok, issueFields } = evaluateAmbiguityValidationScenario(scenario);
  if (ok) return false;
  for (const field of scenario.clarifyFieldsContains ?? []) {
    if (!issueFields.includes(field)) return false;
  }
  return true;
}

export function listAmbiguityValidationScenarioIds(): string[] {
  return AMBIGUITY_CORPUS_SCENARIOS.filter(
    (row) => row.kind === 'validation_clarify',
  ).map((row) => row.id);
}
