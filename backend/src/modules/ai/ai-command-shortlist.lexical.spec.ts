/**
 * §97 — the lexical half of the hybrid scorer.
 *
 * The property that matters is not the score itself but that it can only ever
 * *add*: a message sharing no words with a command must leave that command's
 * cosine untouched, because that is every non-Latin prompt in the corpus (§48).
 */
import {
  lexicalIdentityScore,
  LEXICAL_BONUS_WEIGHT,
} from './ai-command-shortlist.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (id: string, description: string): CommandSpec =>
  ({
    id,
    aliases: [id.split('.')[1]],
    domain: id.split('.')[0],
    surfaces: ['dashboard'],
    tiers: { dashboard: ['owner'] },
    risk: 'T0',
    description,
    variables: {},
    examples: [],
    confirm: 'never',
    handler: 'H',
  }) as CommandSpec;

const packages = spec('catalog.list_packages', 'List the packages offered.');

describe('lexicalIdentityScore', () => {
  it('scores a message naming the command', () => {
    expect(
      lexicalIdentityScore('What packages do I currently offer?', packages),
    ).toBeGreaterThan(0);
  });

  it('scores zero when nothing overlaps', () => {
    expect(lexicalIdentityScore('cancel my appointment', packages)).toBe(0);
  });

  it('scores zero for a non-Latin message, leaving cosine to decide', () => {
    // The whole reason the bonus is additive: Armenian traffic has no lexical
    // overlap with an English description and must not be penalised for it.
    expect(
      lexicalIdentityScore('Այս շաբաթվա տուրերը օրացույցում', packages),
    ).toBe(0);
  });

  it('ignores case and punctuation', () => {
    expect(lexicalIdentityScore('PACKAGES!!!', packages)).toBe(
      lexicalIdentityScore('packages', packages),
    );
  });

  it('does not credit stopwords or very short tokens', () => {
    // "the/do/i" are in the description; matching them would score every message.
    expect(lexicalIdentityScore('do I the', packages)).toBe(0);
  });

  it('never exceeds 1', () => {
    expect(
      lexicalIdentityScore('catalog list packages offered the', packages),
    ).toBeLessThanOrEqual(1);
  });

  it('is bounded below by 0 for an empty message', () => {
    expect(lexicalIdentityScore('', packages)).toBe(0);
  });

  it('keeps the bonus small enough not to dominate cosine', () => {
    // A full identity match adds LEXICAL_BONUS_WEIGHT. Cosine differences
    // between a right and a random command run to ~0.4 on this cache, so the
    // bonus must stay under that to remain a tie-breaker rather than the ranking.
    expect(LEXICAL_BONUS_WEIGHT).toBeLessThan(0.4);
    expect(LEXICAL_BONUS_WEIGHT).toBeGreaterThan(0);
  });
});
