import {
  BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS,
  enrichBulkAssignServicesCategoryParamsFromPrompt,
  isBulkAssignServicesCategoryPrompt,
  parseBulkAssignServicesCategoryFromPrompt,
  rescueBulkAssignServicesCategoryIntent,
} from './ai-bulk-assign-services-category.util.js';

describe('ai-bulk-assign-services-category.util', () => {
  it.each(BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS)(
    'detects bulk assign prompt $id',
    ({ prompt }) => {
      expect(isBulkAssignServicesCategoryPrompt(prompt)).toBe(true);
    },
  );

  it.each(BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS)(
    'parses bulk assign prompt $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseBulkAssignServicesCategoryFromPrompt(prompt, {});
      expect(parsed).toMatchObject(paramsPartial ?? {});
    },
  );

  it('disambiguates bulk assign from single update_service', () => {
    expect(
      isBulkAssignServicesCategoryPrompt(
        'move Neck Massage under service category: Massage',
      ),
    ).toBe(false);
    expect(
      isBulkAssignServicesCategoryPrompt(
        'Move all hair services under Hair category',
      ),
    ).toBe(true);
  });

  it('rescues unknown action to bulk_assign_services_category', () => {
    expect(
      rescueBulkAssignServicesCategoryIntent(
        'Move all hair services under Hair category',
        'unknown',
      ),
    ).toEqual({
      action: 'bulk_assign_services_category',
      rescueReason: 'bulk_assign_services_category',
    });
  });

  it('enriches params from prompt', () => {
    expect(
      enrichBulkAssignServicesCategoryParamsFromPrompt(
        {},
        'Move all hair services under Hair category',
      ),
    ).toMatchObject({
      sourceCategoryHint: 'hair',
      targetCategoryName: 'Hair',
    });
  });
});

/**
 * C3 / e2e-bug.360 — this command's own documented example,
 * `"put all the massages under the Massage category"`, did not reach it.
 *
 * The cause was `hasBulkScope`, which required the literal word *services*:
 * `all the massages` names the service **type**, which is exactly as bulk. That
 * requirement was an accident of how the first examples happened to be phrased,
 * not a distinction the command draws.
 *
 * The sibling example on the same gap list — `"move haircut and blow dry into
 * Hair Care"` — is deliberately **not** fixed here. It fails `hasCategoryTarget`
 * because nothing in the string says "category": knowing that *Hair Care* is one
 * requires a catalogue lookup, which a regex cannot do. That is a genuine
 * planner-plus-retrieval case rather than a detector gap, and widening the
 * target test to "any capitalised phrase after `into`" would claim far more than
 * it should.
 */
describe('C3 — bulk scope may name the service type, not the word "services"', () => {
  it.each([
    'put all the massages under the Massage category',
    'move all the facials into the Skincare category',
    'move all the treatments into the Spa category',
  ])('claims the bulk move: %s', (prompt) => {
    expect(isBulkAssignServicesCategoryPrompt(prompt)).toBe(true);
  });

  it('still needs "all" or two named services — a singular is not bulk', () => {
    // Not a regression from the widening: a later gate requires `all`, or
    // `services in/from`, or two or more named services. "every haircut" is one
    // service, and this command is the bulk one. Pinned because the new
    // alternative reads as though it would accept it.
    expect(
      isBulkAssignServicesCategoryPrompt('assign every haircut to the Hair category'),
    ).toBe(false);
  });

  it.each([
    // People are not services. Guarded twice — at the top of the predicate and
    // in the new alternative — because this widening is the one that could
    // otherwise turn a customer-segment move into a service move.
    ['move all the customers to the VIP category', 'customers'],
    ['put all the clients under the Regular category', 'clients'],
  ])('does not claim a person move (%s — %s)', (prompt) => {
    expect(isBulkAssignServicesCategoryPrompt(prompt)).toBe(false);
  });

  it('still requires a category target — "into Hair Care" alone is not enough', () => {
    // Pinned as current behaviour, not as desired behaviour: see the note above.
    expect(
      isBulkAssignServicesCategoryPrompt('move haircut and blow dry into Hair Care'),
    ).toBe(false);
  });
});
