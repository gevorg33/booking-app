import {
  buildCategoryAssignRescueParams,
  extractCategoryToProviderFromPrompt,
  isAssignCategoryToProviderPrompt,
  rescueAssignCategoryToProviderIntent,
  resolveAssignEmployeeServicesInput,
  resolveServicesByCategoryName,
  resolveServicesForEmployeeAssignment,
} from './ai-category-assignment.util.js';
import {
  ALL_CATEGORY_ASSIGNMENT_SCENARIOS,
  CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS,
  CATEGORY_TO_PROVIDER_SCENARIOS,
} from './ai-category-assignment.fixtures.js';

const colorCategory = { id: 'cat-color', name: 'Color' };
const hairCategory = { id: 'cat-hair', name: 'Hair' };

const catalogServices = [
  {
    id: 's1',
    name: 'Balayage',
    category: colorCategory,
    categoryId: 'cat-color',
  },
  {
    id: 's2',
    name: 'Highlights',
    category: colorCategory,
    categoryId: 'cat-color',
  },
  {
    id: 's3',
    name: "Women's Cut",
    category: hairCategory,
    categoryId: 'cat-hair',
  },
  {
    id: 's4',
    name: 'Facial',
    category: { id: 'cat-spa', name: 'Spa' },
    categoryId: 'cat-spa',
  },
];

const employees = [
  { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s4'] },
  { id: 'e2', name: 'Maria Lopez', serviceIds: [] },
];

describe('ai-category-assignment.util', () => {
  describe('isAssignCategoryToProviderPrompt', () => {
    it.each(CATEGORY_TO_PROVIDER_SCENARIOS.map((s) => [s.id, s.prompt]))(
      'detects %s',
      (_id, prompt) => {
        expect(isAssignCategoryToProviderPrompt(prompt)).toBe(true);
      },
    );

    it.each(
      CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('rejects %s', (_id, prompt) => {
      expect(isAssignCategoryToProviderPrompt(prompt)).toBe(false);
    });
  });

  describe('extractCategoryToProviderFromPrompt', () => {
    it.each(CATEGORY_TO_PROVIDER_SCENARIOS.map((s) => [s.id, s]))(
      'extracts category and provider for %s',
      (_id, scenario) => {
        const extracted = extractCategoryToProviderFromPrompt(scenario.prompt);
        expect(extracted.categoryName).toBe(scenario.categoryName);
        expect(extracted.employeeName).toBe(scenario.employeeName);
      },
    );

    it('returns empty object for unrelated prompt', () => {
      expect(extractCategoryToProviderFromPrompt('List all customers')).toEqual(
        {},
      );
    });
  });

  describe('resolveServicesByCategoryName', () => {
    it('matches exact category name on relation', () => {
      const matched = resolveServicesByCategoryName(catalogServices, 'Color');
      expect(matched.map((s) => s.id)).toEqual(['s1', 's2']);
    });

    it('matches by category id list', () => {
      const matched = resolveServicesByCategoryName(catalogServices, 'Hair', [
        { id: 'cat-hair', name: 'Hair' },
      ]);
      expect(matched.map((s) => s.id)).toEqual(['s3']);
    });

    it('returns empty for unknown category without fallback substring', () => {
      const matched = resolveServicesByCategoryName(
        [
          {
            id: 'x',
            name: 'Other Service',
            category: { name: 'Other' },
            categoryId: 'c',
          },
        ],
        'UnknownCat',
      );
      expect(matched).toHaveLength(0);
    });

    it('matches case-insensitive exact category name', () => {
      const matched = resolveServicesByCategoryName(catalogServices, 'color');
      expect(matched.map((s) => s.id)).toEqual(['s1', 's2']);
    });

    it('returns empty for blank category name', () => {
      expect(resolveServicesByCategoryName(catalogServices, '')).toEqual([]);
      expect(resolveServicesByCategoryName(catalogServices, '   ')).toEqual([]);
    });
  });

  describe('resolveServicesForEmployeeAssignment', () => {
    it('prefers explicit service names over category', () => {
      const matched = resolveServicesForEmployeeAssignment(catalogServices, {
        serviceName: 'Facial',
        categoryName: 'Color',
      });
      expect(matched.map((s) => s.id)).toEqual(['s4']);
    });

    it('resolves from category when no service names', () => {
      const matched = resolveServicesForEmployeeAssignment(catalogServices, {
        categoryName: 'Color',
      });
      expect(matched.map((s) => s.id)).toEqual(['s1', 's2']);
    });

    it('returns empty when neither services nor category match', () => {
      expect(
        resolveServicesForEmployeeAssignment(catalogServices, {
          categoryName: 'UnknownCat',
        }),
      ).toEqual([]);
    });
  });

  describe('resolveAssignEmployeeServicesInput', () => {
    it('merges category services with existing provider skills', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          assignFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.mergedFromCategory).toBe(true);
      expect(result.serviceIds).toEqual(
        expect.arrayContaining(['s1', 's2', 's4']),
      );
      expect(result.serviceIds).toHaveLength(3);
      expect(result.employeeName).toBe('Gevorg Gasparyan');
    });

    it('extends existing skills when assigning explicit service names', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          serviceName: 'Highlights',
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.mergedFromCategory).toBe(false);
      expect(result.serviceIds).toEqual(expect.arrayContaining(['s2', 's4']));
      expect(result.serviceIds).toHaveLength(2);
    });

    it('fails when multiple providers match', () => {
      const result = resolveAssignEmployeeServicesInput(
        [
          { id: 'e1', name: 'Maria A', serviceIds: [] },
          { id: 'e2', name: 'Maria B', serviceIds: [] },
        ],
        catalogServices,
        {
          employeeNames: ['Maria A', 'Maria B'],
          categoryName: 'Color',
          assignFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.summary).toMatch(/one service provider/i);
    });

    it('fails when category has no services', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Maria Lopez',
          categoryName: 'UnknownCat',
          assignFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.summary).toMatch(/service\(s\) or service category/i);
      expect(result.details?.categoryName).toBe('UnknownCat');
      expect(result.details?.availableServices).toEqual(
        catalogServices.map((s) => s.name),
      );
    });

    it('merges from categoryName alone without assignFromCategory flag', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Maria Lopez',
          categoryName: 'Color',
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.mergedFromCategory).toBe(true);
    });
  });

  describe('rescueAssignCategoryToProviderIntent', () => {
    it.each(ALL_CATEGORY_ASSIGNMENT_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s from wrong action',
      (_id, scenario) => {
        const rescued = rescueAssignCategoryToProviderIntent(
          scenario.prompt,
          'unknown',
          {},
        );
        expect(rescued).not.toBeNull();
        expect(rescued?.action).toBe(scenario.expectedAction);
        expect(rescued?.rescueReason).toBe(scenario.rescueReason);
        expect(rescued?.params.categoryName).toBe(scenario.categoryName);
        expect(rescued?.params.employeeName).toBe(scenario.employeeName);
        expect(rescued?.params.assignFromCategory).toBe(true);
        scenario.paramsAssert?.(rescued!.params);
      },
    );

    it('returns null when action already assign_employee_services', () => {
      expect(
        rescueAssignCategoryToProviderIntent(
          CATEGORY_TO_PROVIDER_SCENARIOS[0].prompt,
          'assign_employee_services',
          {},
        ),
      ).toBeNull();
    });

    it('returns null for senior matrix prompt', () => {
      expect(
        rescueAssignCategoryToProviderIntent(
          'Assign all color services to senior stylists only',
          'unknown',
          {},
        ),
      ).toBeNull();
    });
  });

  describe('buildCategoryAssignRescueParams', () => {
    it('falls back to params when extraction omits fields', () => {
      expect(
        buildCategoryAssignRescueParams(
          {},
          { categoryName: 'Color', employeeName: 'Gevorg' },
        ),
      ).toEqual({
        categoryName: 'Color',
        employeeName: 'Gevorg',
        assignFromCategory: true,
      });
    });

    it('prefers extracted values over params', () => {
      expect(
        buildCategoryAssignRescueParams(
          { categoryName: 'Hair', employeeName: 'Maria' },
          { categoryName: 'Color', employeeName: 'Gevorg' },
        ),
      ).toEqual({
        categoryName: 'Hair',
        employeeName: 'Maria',
        assignFromCategory: true,
      });
    });

    it('ignores non-string param fallbacks', () => {
      expect(
        buildCategoryAssignRescueParams(
          {},
          { categoryName: 42, employeeName: null },
        ),
      ).toEqual({
        categoryName: undefined,
        employeeName: undefined,
        assignFromCategory: true,
      });
    });
  });

  describe('edge branches', () => {
    it('rejects junior-only matrix phrasing', () => {
      expect(
        isAssignCategoryToProviderPrompt(
          'Assign all massage services to junior staff only',
        ),
      ).toBe(false);
    });

    it('rejects seniors-only phrasing without named provider target', () => {
      expect(
        isAssignCategoryToProviderPrompt(
          'Assign all Hair services to seniors only',
        ),
      ).toBe(false);
    });

    it('returns empty for blank category in assignment resolver', () => {
      expect(
        resolveServicesForEmployeeAssignment(catalogServices, {
          categoryName: '   ',
        }),
      ).toEqual([]);
    });

    it('resolves category via categories list when relation name missing', () => {
      const matched = resolveServicesByCategoryName(
        [{ id: 's9', name: 'Tint', category: null, categoryId: 'cat-brow' }],
        'Brow',
        [{ id: 'cat-brow', name: 'Brow' }],
      );
      expect(matched.map((s) => s.id)).toEqual(['s9']);
    });

    it('returns empty when categories list has no matching services by id', () => {
      const matched = resolveServicesByCategoryName(
        [{ id: 's9', name: 'Tint', category: null, categoryId: 'other' }],
        'Brow',
        [{ id: 'cat-brow', name: 'Brow' }],
      );
      expect(matched).toEqual([]);
    });

    it('fails when no provider specified', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          categoryName: 'Color',
          assignFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when provider name not found', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Nobody Here',
          categoryName: 'Color',
          assignFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when explicit service name does not resolve', () => {
      const result = resolveAssignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Maria Lopez',
          serviceName: 'Nonexistent Service',
        },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.details?.categoryName).toBeNull();
    });
  });
});
