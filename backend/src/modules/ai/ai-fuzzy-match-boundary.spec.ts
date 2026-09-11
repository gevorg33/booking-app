/**
 * e2e-bug.362 — `fuzzyMatchByName`'s "the query contains the name" tier.
 *
 * That tier was a raw substring test, so a short name matched letters inside
 * unrelated words: an employee called "Al" was returned for "is the salon open"
 * (s-**al**-on) and for "book Alice for a haircut". Both look like confident
 * resolutions of someone the user never named, and `fuzzyMatchByName` is the
 * platform's main name→entity resolver with 27 call sites.
 */
import { fuzzyMatchByName } from './ai-orchestration.helpers.js';

const named = (...names: string[]) => names.map((name) => ({ name }));

describe('fuzzyMatchByName word-boundary tier', () => {
  it('still resolves a name the user actually said', () => {
    expect(
      fuzzyMatchByName(named('Al'), 'book me a haircut with Al')?.name,
    ).toBe('Al');
  });

  it('does not match a name that is only a prefix of another word', () => {
    // "Alice" is not Al.
    expect(
      fuzzyMatchByName(named('Al'), 'book Alice for a haircut'),
    ).toBeUndefined();
  });

  it('does not match letters buried inside an unrelated word', () => {
    // s-al-on
    expect(fuzzyMatchByName(named('Al'), 'is the salon open')).toBeUndefined();
  });

  it('matches a name at the start and end of the query', () => {
    expect(fuzzyMatchByName(named('Al'), 'Al is free tomorrow')?.name).toBe(
      'Al',
    );
    expect(fuzzyMatchByName(named('Al'), 'book it with Al')?.name).toBe('Al');
  });

  it('treats punctuation as a boundary', () => {
    expect(fuzzyMatchByName(named('Al'), 'who is free, Al?')?.name).toBe('Al');
  });

  it('keeps the earlier tiers intact', () => {
    // exact
    expect(
      fuzzyMatchByName(named('Jo', 'John Smith'), 'John Smith')?.name,
    ).toBe('John Smith');
    // item name contains the query
    expect(
      fuzzyMatchByName(named('Deep Tissue', 'Swedish Massage'), 'massage')
        ?.name,
    ).toBe('Swedish Massage');
    // token prefix
    expect(fuzzyMatchByName(named('John Baker'), 'Joh')?.name).toBe(
      'John Baker',
    );
  });

  it('works for non-Latin names', () => {
    // The boundary check uses Unicode letter classes, not \b, which is
    // ASCII-only — §48 established this corpus is Armenian and Russian too.
    expect(fuzzyMatchByName(named('Կարո'), 'ամրագրիր Կարո մոտ')?.name).toBe(
      'Կարո',
    );
    expect(fuzzyMatchByName(named('Ան'), 'Անna գրանցիր')).toBeUndefined();
  });

  it('returns undefined when nothing matches', () => {
    expect(
      fuzzyMatchByName(named('Ann'), 'cancel my appointment'),
    ).toBeUndefined();
  });
});
