import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  type ImplicationCorpusScenario,
} from './ai-implication-corpus.fixtures.js';

/** pipe-1.4.8 — implication prompts resolved by meaning, not literal booking verbs. */
export const SEMANTIC_IMPLICATION_PIPE_MARKER = 'pipe-1.4.8';

export type SemanticImplicationScenario = Omit<
  ImplicationCorpusScenario,
  'topIntent'
> & {
  topIntent?: ImplicationCorpusScenario['topIntent'];
};

const PIPE_1_4_8_SCENARIO_IDS = new Set([
  'en-hair-long-implied-booking',
  'en-work-time-implied-schedule',
  'hy-trim-implied-booking',
  'ru-trim-implied-booking',
  'hy-work-hours-implied-schedule',
  'ru-work-hours-implied-schedule',
  'en-hair-long-not-schedule',
  'en-work-time-not-booking',
  'customer-hair-long-implied-booking',
  'public-hair-long-implied-booking',
]);

/** Implication corpus — lifestyle/need phrasing → booking or schedule intent. */
export const SEMANTIC_IMPLICATION_SCENARIOS: SemanticImplicationScenario[] =
  AI_IMPLICATION_CORPUS_SCENARIOS.filter((scenario) =>
    PIPE_1_4_8_SCENARIO_IDS.has(scenario.id),
  ).map(({ topIntent: _topIntent, ...scenario }) => scenario);

/** Subset wired into deterministic token-cosine gate (pipe-1.4.4). */
export const IMPLICATION_TOKEN_COSINE_SCENARIOS = SEMANTIC_IMPLICATION_SCENARIOS.filter(
  (scenario) =>
    scenario.id === 'en-hair-long-implied-booking' ||
    scenario.id === 'en-work-time-implied-schedule',
);
