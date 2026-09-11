import { LIST_PROVIDER_REVIEWS_PROMPTS } from './ai-list-provider-reviews.fixtures.js';
import {
  enrichListProviderReviewsParamsFromPrompt,
  isListProviderReviewsPrompt,
  rescueListProviderReviewsIntent,
} from './ai-list-provider-reviews.util.js';

describe('ai-list-provider-reviews.util', () => {
  it.each(LIST_PROVIDER_REVIEWS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects + rescues fixture %s',
    (_id, row) => {
      expect(isListProviderReviewsPrompt(row.prompt)).toBe(true);
      expect(
        rescueListProviderReviewsIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
      if (row.providerName) {
        expect(
          enrichListProviderReviewsParamsFromPrompt({}, row.prompt)
            .providerName,
        ).toBe(row.providerName);
      }
    },
  );

  it('e2e-bug.92 detects team-wide reviews phrasing', () => {
    expect(
      isListProviderReviewsPrompt('what do reviews say about your providers?'),
    ).toBe(true);
  });
});
