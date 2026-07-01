import {
  compactPromptSpacing,
  generateTypoVariants,
  lowercasePrompt,
  stripPromptPunctuation,
} from './ai-typo-corpus.util.js';
import {
  TYPO_CORPUS_ENTRIES,
  TYPO_CORPUS_SEEDS,
} from './ai-typo-corpus.fixtures.js';
import {
  isExplainConsumerCheckoutTaxPrompt,
  parseExplainConsumerCheckoutTaxFromPrompt,
} from './ai-consumer-checkout-tax.util.js';

describe('ai-typo-corpus.util (acc-2.5)', () => {
  it('lowercases and strips punctuation deterministically', () => {
    expect(lowercasePrompt('Cancel My Booking')).toBe('cancel my booking');
    expect(stripPromptPunctuation('Why is there a tax line?')).toBe(
      'Why is there a tax line',
    );
    expect(compactPromptSpacing('List   my   appointments')).toBe(
      'List my appointments',
    );
  });

  it('generates unique typo variants per seed prompt', () => {
    for (const seed of TYPO_CORPUS_SEEDS) {
      const variants = generateTypoVariants(seed.prompt);
      expect(variants.length).toBeGreaterThanOrEqual(1);
      const prompts = variants.map((row) => row.prompt.toLowerCase());
      expect(new Set(prompts).size).toBe(prompts.length);
    }
  });

  it('builds a typo corpus entry for every seed variant', () => {
    expect(TYPO_CORPUS_ENTRIES.length).toBeGreaterThanOrEqual(
      TYPO_CORPUS_SEEDS.length,
    );
  });

  it('keeps consumer checkout tax rescue working for whitespace variants', () => {
    const seed = TYPO_CORPUS_SEEDS.find(
      (row) => row.id === 'checkout-tax-line',
    );
    expect(seed).toBeDefined();
    for (const variant of generateTypoVariants(seed!.prompt)) {
      expect(isExplainConsumerCheckoutTaxPrompt(variant.prompt)).toBe(true);
      expect(parseExplainConsumerCheckoutTaxFromPrompt(variant.prompt)).toEqual(
        {
          aspect: 'checkout',
        },
      );
    }
  });
});
