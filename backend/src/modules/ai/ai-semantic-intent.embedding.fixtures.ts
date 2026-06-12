import type { CommandSurface } from './ai-command-registry.types.js';

export type SemanticEmbeddingMatchScenario = {
  id: string;
  prompt: string;
  surface: CommandSurface;
  expectedAction: string;
  expectedAnchorId: string;
};

/** Cosine embedding path acceptance cases (pipe-1.4.3). */
export const SEMANTIC_EMBEDDING_MATCH_SCENARIOS: SemanticEmbeddingMatchScenario[] =
  [
    {
      id: 'implied-trim-cosine-create-booking',
      prompt: 'My hair is getting pretty long, need a trim soon',
      surface: 'dashboard',
      expectedAction: 'create_booking',
      expectedAnchorId: 'en-implied-haircut-need',
    },
  ];
