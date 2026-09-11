import type { AiCallContext } from './openai.types.js';

export type OpenAiEmbedScenario = {
  id: string;
  context: AiCallContext;
  text: string;
  promptTokens: number;
  expectedOperation: string;
};

export const OPENAI_EMBED_SCENARIOS: OpenAiEmbedScenario[] = [
  {
    id: 'semantic-intent-match',
    context: {
      businessId: '76c7fe27-5746-4f97-8899-f41b4ef8d41e',
      surface: 'dashboard',
      operation: 'semantic_intent_match',
      actorType: 'system',
      userId: 'user-1',
    },
    text: 'my hair is getting pretty long need a trim soon',
    promptTokens: 14,
    expectedOperation: 'semantic_intent_match',
  },
  {
    id: 'semantic-intent-anchor-warmup',
    context: {
      businessId: '76c7fe27-5746-4f97-8899-f41b4ef8d41e',
      surface: 'dashboard',
      operation: 'semantic_intent_anchor',
      actorType: 'system',
    },
    text: 'book the first available appointment slot',
    promptTokens: 9,
    expectedOperation: 'semantic_intent_anchor',
  },
];
