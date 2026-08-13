/**
 * e2e-bug.349 — `Under <Category> add <service lines>` across sentences.
 *
 * The reported dashboard prompt scopes services to a category by sentence
 * rather than with the `category Y with services: …` shape the bulk parser
 * expects, so the whole request produced nothing. Two root causes were already
 * fixed (the cross-surface steal, and the plural `categories` cue); this covers
 * the third, which is why it still created nothing.
 *
 * The two halves of the change only work together, and that is asserted below:
 * the sentence split alone is a no-op on this prompt, because its sentences
 * begin "Create, Under, Under, Turn" and only `under` was added to the
 * lookahead alongside the catalog verbs.
 */
import {
  decomposeCatalogCompoundPrompt,
  parseScopedCategoryLinesFromSegment,
} from './ai-catalog.util.js';

const REPORTED =
  'Create categories Y and Z. Under Y add service A (30 min, $50) and service B (45 min, $45). Under Z add service C (60 min, $70). Turn on online payment for everything.';

describe('e2e-bug.349 — the reported prompt now decomposes', () => {
  const steps = decomposeCatalogCompoundPrompt(REPORTED);

  it('yields one bulk_create_catalog step per scoped category', () => {
    expect(steps.map((s) => s.action)).toEqual([
      'bulk_create_catalog',
      'bulk_create_catalog',
    ]);
  });

  it('scopes the right services to the right category', () => {
    const drafts = steps.map(
      (s) => (s.params as { catalogDraft: any }).catalogDraft,
    );
    expect(drafts[0].categoryName).toBe('Y');
    expect(drafts[0].services.map((x: any) => x.serviceName)).toEqual(['A', 'B']);
    expect(drafts[1].categoryName).toBe('Z');
    expect(drafts[1].services.map((x: any) => x.serviceName)).toEqual(['C']);
  });

  it('keeps duration and price per line', () => {
    const first = (steps[0].params as { catalogDraft: any }).catalogDraft;
    expect(first.services[0]).toMatchObject({
      durationMinutes: 30,
      price: 50,
    });
    expect(first.services[1]).toMatchObject({
      durationMinutes: 45,
      price: 45,
    });
  });

  it('does not need a separate step for "Create categories Y and Z"', () => {
    // `bulk_create_catalog` creates the category when it does not exist
    // (ai-catalog.logic.ts — `if (!category) … categoryService.create`), so the
    // leading sentence is redundant rather than dropped work. Asserted so a
    // future reader does not "fix" it by adding a duplicate create step.
    expect(steps).toHaveLength(2);
  });
});

describe('e2e-bug.349 — the segment parser', () => {
  it('reads the category and its lines', () => {
    expect(
      parseScopedCategoryLinesFromSegment(
        'Under Hair add Cut (30 min, $50) and Colour (60 min, $90)',
      ),
    ).toEqual({
      categoryName: 'Hair',
      services: [
        { serviceName: 'Cut', durationMinutes: 30, price: 50 },
        { serviceName: 'Colour', durationMinutes: 60, price: 90 },
      ],
    });
  });

  it('accepts the explicit "under category X" wording', () => {
    expect(
      parseScopedCategoryLinesFromSegment(
        'Under category Nails add Manicure (30 min, $25)',
      )?.categoryName,
    ).toBe('Nails');
  });

  it('returns null when there are no parseable service lines', () => {
    expect(
      parseScopedCategoryLinesFromSegment('Under Y add something vague'),
    ).toBeNull();
  });

  it('returns null for text that is not the scoped shape', () => {
    expect(
      parseScopedCategoryLinesFromSegment('Create category Y'),
    ).toBeNull();
  });
});

describe('e2e-bug.349 — does not reintroduce the e2e-bug.347 over-splitting class', () => {
  it('a service enumeration with periods is not shredded', () => {
    // Sentence-splitting on every "." would make each line its own step and
    // lose the category link — exactly what e2e-bug.347 fixed for semicolons.
    // The lookahead requires a catalog verb or `under`, so prose sentences do
    // not split.
    const steps = decomposeCatalogCompoundPrompt(
      'Create category Hair with services: Cut (30 min, $50), Colour (60 min, $90). Thanks very much.',
    );
    expect(steps).toHaveLength(1);
    expect(steps[0].action).toBe('bulk_create_catalog');
    expect(
      (steps[0].params as { catalogDraft: any }).catalogDraft.services,
    ).toHaveLength(2);
  });

  it('a decimal price does not split the segment', () => {
    const steps = decomposeCatalogCompoundPrompt(
      'Under Hair add Cut (30 min, $50.50) and Colour (60 min, $90.25)',
    );
    expect(steps).toHaveLength(1);
    expect(
      (steps[0].params as { catalogDraft: any }).catalogDraft.services,
    ).toHaveLength(2);
  });
});
