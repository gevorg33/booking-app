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
      isBulkAssignServicesCategoryPrompt('Move all hair services under Hair category'),
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
