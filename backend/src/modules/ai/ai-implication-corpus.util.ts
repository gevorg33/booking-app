import type {
  ImplicationCorpusScenario,
  ImplicationTopIntent,
} from './ai-implication-corpus.fixtures.js';
import { isGenericSemanticAnchorPrompt } from './intent-anchor.seed.util.js';

export const MIN_IMPLICATION_PROMPTS_PER_INTENT = 10;

export function countImplicationScenariosByIntent(
  scenarios: readonly ImplicationCorpusScenario[],
): Record<ImplicationTopIntent, number> {
  const counts: Record<ImplicationTopIntent, number> = {
    booking: 0,
    schedule: 0,
    availability: 0,
  };
  for (const scenario of scenarios) {
    counts[scenario.topIntent] += 1;
  }
  return counts;
}

export function assertImplicationCorpusCoverage(
  scenarios: readonly ImplicationCorpusScenario[],
  minPerIntent = MIN_IMPLICATION_PROMPTS_PER_INTENT,
): void {
  const counts = countImplicationScenariosByIntent(scenarios);
  for (const intent of Object.keys(counts) as ImplicationTopIntent[]) {
    if (counts[intent] < minPerIntent) {
      throw new Error(
        `implication corpus requires ≥${minPerIntent} prompts for ${intent}; found ${counts[intent]}`,
      );
    }
  }
}

export function filterImplicationCorpusByIntent(
  scenarios: readonly ImplicationCorpusScenario[],
  topIntent: ImplicationTopIntent,
): ImplicationCorpusScenario[] {
  return scenarios.filter((scenario) => scenario.topIntent === topIntent);
}

export function findCorpusPromptsWithEntityNames(
  scenarios: readonly ImplicationCorpusScenario[],
): ImplicationCorpusScenario[] {
  return scenarios.filter(
    (scenario) => !isGenericSemanticAnchorPrompt(scenario.prompt),
  );
}

export function listImplicationCorpusIds(
  scenarios: readonly ImplicationCorpusScenario[],
): string[] {
  return scenarios.map((scenario) => scenario.id);
}
