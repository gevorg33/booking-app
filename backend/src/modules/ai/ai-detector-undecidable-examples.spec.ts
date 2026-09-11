/**
 * C3 / e2e-bug.360 — the spec examples the detector layer cannot decide.
 *
 * Six of the nine documented examples their own detector missed were fixed
 * (2026-08-20). These three were **deliberately not**, and this file is the
 * reason written down, because each one looks like a small regex away and each
 * would cost something real:
 *
 * 1. `catalog.list_packages` ×2 — *"What packages do I currently offer?"* and
 *    *"what packages do we sell"*. These are **already claimed** by
 *    `isDiscoverPackagesPrompt`, the consumer-side sibling. Widening the
 *    dashboard detector to catch them would create a cross-surface overlap
 *    resolved only by the surface gate, on phrasings that already reach a
 *    command today. Asserted below in both directions, so the claim is checked
 *    rather than asserted in prose.
 *
 * 2. `catalog.assign_services_category_bulk` — *"move haircut and blow dry into
 *    Hair Care"*. It fails `hasCategoryTarget` because **nothing in the string
 *    says "category"**: knowing that *Hair Care* is one requires a catalogue
 *    lookup, which a regex cannot do. Widening the target test to "any
 *    capitalised phrase after `into`" would claim far more than it should.
 *
 * These are therefore **planner-plus-retrieval cases**, which is what C3's
 * remaining checkbox means by treating them as Phase 8 handover: the residual
 * after detector work is not a backlog of missing regexes, and this file exists
 * so the next person does not rediscover that by breaking something.
 *
 * If a detector ever *does* claim one of these, this file fails — which is the
 * point. Reopen the analysis rather than deleting the assertion.
 */
import { isBulkAssignServicesCategoryPrompt } from './ai-bulk-assign-services-category.util.js';
import { isListPackagesPrompt } from './ai-catalog.util.js';
import { isDiscoverPackagesPrompt } from './ai-customer-crm.util.js';

const LIST_PACKAGES_EXAMPLES = [
  'What packages do I currently offer?',
  'what packages do we sell',
];

describe('C3 — spec examples undecidable at the detector layer', () => {
  describe('catalog.list_packages: already claimed by the consumer sibling', () => {
    it.each(LIST_PACKAGES_EXAMPLES)(
      'is not claimed by the dashboard detector: %s',
      (prompt) => {
        expect(isListPackagesPrompt(prompt)).toBe(false);
      },
    );

    it.each(LIST_PACKAGES_EXAMPLES)(
      'but does reach a command — discover_packages claims it: %s',
      (prompt) => {
        // This is what makes widening `isListPackagesPrompt` a cost rather than
        // a fix: the phrasing is not unrouted, it is routed elsewhere by design.
        expect(isDiscoverPackagesPrompt(prompt)).toBe(true);
      },
    );

    it('the dashboard detector still claims its own phrasings', () => {
      expect(isListPackagesPrompt('list packages')).toBe(true);
      expect(isListPackagesPrompt('show me the packages')).toBe(true);
    });
  });

  describe('catalog.assign_services_category_bulk: needs a catalogue lookup', () => {
    it('does not claim "move haircut and blow dry into Hair Care"', () => {
      expect(
        isBulkAssignServicesCategoryPrompt(
          'move haircut and blow dry into Hair Care',
        ),
      ).toBe(false);
    });

    it('claims the same move once the target is named as a category', () => {
      // The discriminator is the word "category", not the capitalisation — which
      // is precisely why a regex cannot decide the example above.
      expect(
        isBulkAssignServicesCategoryPrompt(
          'move haircut and blow dry into the Hair Care category',
        ),
      ).toBe(true);
    });
  });
});
