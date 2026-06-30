import {
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS,
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_RESCUE_SCENARIOS,
} from './ai-deactivate-service-category-scope.fixtures.js';
import {
  enrichDeactivateServiceCategoryScopeParamsFromPrompt,
  isDeactivateServiceCategoryScopePrompt,
  parseDeactivateServiceCategoryScopeFromPrompt,
  rescueDeactivateServiceCategoryScopeIntent,
  resolveServicesForDeactivateCategoryScope,
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_CLASSIFIER_RULES,
} from './ai-deactivate-service-category-scope.util.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';

const catalog = [
  {
    id: '1',
    name: 'Walk-in Trim',
    isActive: true,
    category: { name: 'Hair' },
  },
  {
    id: '2',
    name: 'Dental Cleaning',
    isActive: true,
    category: { name: 'Dental' },
  },
  {
    id: '3',
    name: 'Dental X-Ray',
    isActive: true,
    category: { name: 'Dental' },
  },
  {
    id: '4',
    name: 'Inactive Dental',
    isActive: false,
    category: { name: 'Dental' },
  },
] as const;

describe('ai-deactivate-service-category-scope.util', () => {
  it('exports classifier rules', () => {
    expect(DEACTIVATE_SERVICE_CATEGORY_SCOPE_CLASSIFIER_RULES).toContain(
      'allInCategory',
    );
  });

  it.each(
    DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS.filter(
      (row) => row.paramsPartial?.allInCategory,
    ),
  )('detects category scope for $id', ({ prompt }) => {
    expect(isDeactivateServiceCategoryScopePrompt(prompt, {})).toBe(true);
  });

  it.each(DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS)(
    'parses deactivate params for $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseDeactivateServiceCategoryScopeFromPrompt(prompt, {});
      if (paramsPartial?.allInCategory) {
        expect(parsed?.allInCategory).toBe(true);
        expect(parsed?.categoryName?.toLowerCase()).toBe(
          paramsPartial.categoryName?.toLowerCase(),
        );
      } else if (paramsPartial?.serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          paramsPartial.serviceName.toLowerCase(),
        );
      }
    },
  );

  it.each(DEACTIVATE_SERVICE_CATEGORY_SCOPE_RESCUE_SCENARIOS)(
    'rescues misclassified $id → deactivate_service',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueDeactivateServiceCategoryScopeIntent(
          prompt,
          misclassifiedAction!,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(
    DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS.filter(
      (row) => row.paramsPartial?.allInCategory,
    ),
  )('enriches category params for $id', ({ prompt, paramsPartial }) => {
    const enriched = enrichDeactivateServiceCategoryScopeParamsFromPrompt(
      {},
      prompt,
    );
    expect(enriched.allInCategory).toBe(true);
    expect(String(enriched.categoryName).toLowerCase()).toBe(
      paramsPartial!.categoryName!.toLowerCase(),
    );
  });

  it('resolves active services in category only', () => {
    const matched = resolveServicesForDeactivateCategoryScope(catalog, 'dental');
    expect(matched.map((service) => service.id)).toEqual(['2', '3']);
  });

  it('does not treat provider skill removal as category deactivate', () => {
    expect(
      isDeactivateServiceCategoryScopePrompt(
        'Remove all Color category services from Gevorg',
        {},
      ),
    ).toBe(false);
  });

  it('rescues via catalog intent with enriched params', () => {
    const prompt = 'Deactivate all dental services';
    const rescued = rescueCatalogIntent(prompt, 'unassign_employee_services');
    expect(rescued?.action).toBe('deactivate_service');
    expect(rescued?.params?.allInCategory).toBe(true);
    expect(rescued?.params?.categoryName).toBe('dental');
  });
});
