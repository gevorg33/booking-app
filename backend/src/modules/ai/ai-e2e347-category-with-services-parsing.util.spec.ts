import {
  E2E347_BULK_DRAFT_CASES,
  E2E347_SERVICE_LINE_CASES,
} from './ai-e2e347-category-with-services-parsing.fixtures.js';
import {
  isBulkCreateCatalogPrompt,
  parseBulkCatalogFromPrompt,
  parseServiceLinesFromText,
} from './ai-catalog.util.js';

describe('e2e-bug.347: "create category with services" must parse every service line', () => {
  it.each(E2E347_SERVICE_LINE_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      expect(parseServiceLinesFromText(row.text)).toEqual(row.expected);
    },
  );

  it.each(E2E347_BULK_DRAFT_CASES.map((row) => [row.id, row] as const))(
    '%s — builds a full category draft',
    (_id, row) => {
      const draft = parseBulkCatalogFromPrompt(row.prompt);
      expect(draft).not.toBeNull();
      expect(draft?.categoryName).toBe(row.expectedCategoryName);
      expect(draft?.services.map((s) => s.serviceName)).toEqual(
        row.expectedServiceNames,
      );
    },
  );

  it('routes category+services prompts to bulk_create_catalog, not bare create_service_category', () => {
    for (const row of E2E347_BULK_DRAFT_CASES) {
      expect(isBulkCreateCatalogPrompt(row.prompt)).toBe(true);
    }
  });

  it('single-letter category names resolve (the {1,40}? two-char floor)', () => {
    // Pre-fix this returned null because the capture demanded >= 2 characters.
    expect(
      parseBulkCatalogFromPrompt('Create category Z with C (60 min, $70)')
        ?.categoryName,
    ).toBe('Z');
  });

  it('does not invent services for a bare category prompt', () => {
    expect(
      parseServiceLinesFromText('Add a new service category called Wellness'),
    ).toEqual([]);
    expect(
      isBulkCreateCatalogPrompt('Add a new service category called Wellness'),
    ).toBe(false);
  });
});
