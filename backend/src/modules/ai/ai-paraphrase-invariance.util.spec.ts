/**
 * AI-ROADMAP Phase 2 — unit tests for the paraphrase generator.
 *
 * The generator's value is that fixtures cannot drift from the commands they
 * test, because they are derived from `CommandSpec.examples`. These tests pin
 * that property and the meaning-preservation claim each transform rests on.
 */
import {
  buildParaphraseCases,
  checkParaphraseInvariance,
  PARAPHRASE_TRANSFORMS,
  summarizeBreaksByTransform,
  type ParaphraseSourceSpec,
} from './ai-paraphrase-invariance.util.js';

const SPEC: ParaphraseSourceSpec = {
  id: 'catalog.create_category',
  aliases: ['create_service_category'],
  examples: ['add a category called Wellness'],
};

describe('PARAPHRASE_TRANSFORMS', () => {
  it('every transform documents why it preserves meaning', () => {
    // The rationale is what justifies asserting on the transform at all.
    for (const t of PARAPHRASE_TRANSFORMS) {
      expect(t.rationale.length).toBeGreaterThan(10);
    }
  });

  it('transform ids are unique', () => {
    const ids = PARAPHRASE_TRANSFORMS.map((t) => t.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('strict transforms only change surface form, never words', () => {
    // A "strict" transform that added or removed a word would not be
    // indisputably meaning-preserving, and could not be asserted at zero.
    const words = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter(Boolean);
    const base = 'add a category called Wellness';
    for (const t of PARAPHRASE_TRANSFORMS.filter(
      (x) => x.strictness === 'strict',
    )) {
      expect(words(t.apply(base))).toEqual(words(base));
    }
  });

  it('natural transforms add phrasing without removing the request', () => {
    const base = 'add a category called Wellness';
    for (const t of PARAPHRASE_TRANSFORMS.filter(
      (x) => x.strictness === 'natural',
    )) {
      expect(t.apply(base).toLowerCase()).toContain('category called wellness');
    }
  });
});

describe('buildParaphraseCases', () => {
  it('generates one case per example × transform', () => {
    const cases = buildParaphraseCases([SPEC]);
    expect(cases).toHaveLength(PARAPHRASE_TRANSFORMS.length);
    expect(new Set(cases.map((c) => c.transformId)).size).toBe(
      PARAPHRASE_TRANSFORMS.length,
    );
  });

  it('carries the command and its legacy alias on every case', () => {
    const [first] = buildParaphraseCases([SPEC]);
    expect(first).toMatchObject({
      command: 'catalog.create_category',
      alias: 'create_service_category',
      base: 'add a category called Wellness',
    });
  });

  it('skips transforms that produced no change', () => {
    // An all-lowercase example is unchanged by `lowercase`; a case identical to
    // its base asserts nothing.
    const lower: ParaphraseSourceSpec = {
      ...SPEC,
      examples: ['add a category'],
    };
    const cases = buildParaphraseCases([lower]);
    expect(cases.map((c) => c.transformId)).not.toContain('lowercase');
  });

  it('ignores a spec with no alias, since the detector layer speaks aliases', () => {
    expect(buildParaphraseCases([{ ...SPEC, aliases: [] }])).toEqual([]);
  });
});

describe('checkParaphraseInvariance', () => {
  const cases = buildParaphraseCases([SPEC]);

  it('reports nothing when the recogniser is invariant', () => {
    const result = checkParaphraseInvariance(cases, () => true);
    expect(result.breaks).toEqual([]);
    expect(result.checked).toBe(cases.length);
  });

  it('names the transform that broke recognition', () => {
    const recognise = (p: string) => !p.startsWith('please ');
    const { breaks } = checkParaphraseInvariance(cases, recognise);
    expect(breaks.map((b) => b.transformId)).toEqual(['please_prefix']);
    expect(breaks[0].strictness).toBe('natural');
  });

  it('separates an unrecognised base from a broken variant', () => {
    // A recogniser that never matches the base has no invariance to violate;
    // counting it as breakage would report an uncovered command as a brittle
    // one, which needs a different fix.
    const { breaks, uncoveredBases, checked } = checkParaphraseInvariance(
      cases,
      () => false,
    );
    expect(breaks).toEqual([]);
    expect(checked).toBe(0);
    expect(uncoveredBases).toEqual(['add a category called Wellness']);
  });
});

describe('summarizeBreaksByTransform', () => {
  it('ranks the phrasing that breaks most often first', () => {
    const summary = summarizeBreaksByTransform([
      {
        command: 'a',
        base: 'b',
        variant: 'v',
        transformId: 'please_prefix',
        strictness: 'natural',
      },
      {
        command: 'a',
        base: 'b',
        variant: 'v',
        transformId: 'please_prefix',
        strictness: 'natural',
      },
      {
        command: 'a',
        base: 'b',
        variant: 'v',
        transformId: 'question_mark',
        strictness: 'natural',
      },
    ]);
    expect(summary).toEqual([
      { transformId: 'please_prefix', strictness: 'natural', count: 2 },
      { transformId: 'question_mark', strictness: 'natural', count: 1 },
    ]);
  });
});
