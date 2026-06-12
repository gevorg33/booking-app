import { IMPLICATION_CORPUS_PROVIDER_SCENARIOS } from './ai-implication-corpus-provider.fixtures.js';
import { rescueProviderAiIntent } from '../provider-mobile/provider-ai-intent.util.js';

describe('ai-implication-corpus provider fixtures (pipe-1.12.5)', () => {
  it.each(IMPLICATION_CORPUS_PROVIDER_SCENARIOS)(
    '$id maps implied provider phrasing to $expectedAction',
    ({ prompt, expectedAction }) => {
      expect(rescueProviderAiIntent(prompt, 'unknown')).toBe(expectedAction);
    },
  );
});
