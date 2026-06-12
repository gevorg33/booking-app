import type { CommandSurface } from './ai-command-registry.types.js';
import { IMPLICATION_TOKEN_COSINE_SCENARIOS } from './ai-semantic-intent.implication.fixtures.js';

export type DeterministicSemanticFallbackScenario = {
  id: string;
  hasEmbeddingApi: boolean;
  nodeEnv: string;
  expectedFallback: boolean;
};

/** Scenarios for shouldUseDeterministicSemanticFallback (pipe-1.4.4). */
export const DETERMINISTIC_SEMANTIC_FALLBACK_SCENARIOS: DeterministicSemanticFallbackScenario[] =
  [
    {
      id: 'node-env-test-forces-fallback',
      hasEmbeddingApi: true,
      nodeEnv: 'test',
      expectedFallback: true,
    },
    {
      id: 'no-api-key-forces-fallback',
      hasEmbeddingApi: false,
      nodeEnv: 'production',
      expectedFallback: true,
    },
    {
      id: 'api-available-outside-test-uses-embeddings',
      hasEmbeddingApi: true,
      nodeEnv: 'production',
      expectedFallback: false,
    },
  ];

export type DeterministicTokenCosineScenario = {
  id: string;
  prompt: string;
  surface: CommandSurface;
  expectedAction: string;
  minTokenCosine?: number;
};

/** Token-cosine paraphrase cases exercised without embeddings (pipe-1.4.4). */
export const DETERMINISTIC_TOKEN_COSINE_SCENARIOS: DeterministicTokenCosineScenario[] =
  [
    ...IMPLICATION_TOKEN_COSINE_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      prompt: scenario.prompt,
      surface: scenario.surface,
      expectedAction: scenario.expectedAction,
    })),
    {
      id: 'who-free-token-cosine',
      prompt: 'See who on the team is open tomorrow morning',
      surface: 'dashboard',
      expectedAction: 'check_providers_for_service',
    },
  ];

export { IMPLICATION_TOKEN_COSINE_SCENARIOS };
