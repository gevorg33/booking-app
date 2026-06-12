import {
  buildCategoryAssignRescueParams,
  buildTransferRescueParams,
  buildUnassignRescueParams,
  extractCategoryToProviderFromPrompt,
  extractTransferBetweenProvidersFromPrompt,
  extractUnassignFromProviderFromPrompt,
  isAssignCategoryToProviderPrompt,
  isTransferServicesBetweenProvidersPrompt,
  isUnassignServicesFromProviderPrompt,
  rescueAssignCategoryToProviderIntent,
  rescueTransferServicesBetweenProvidersIntent,
  rescueUnassignServicesFromProviderIntent,
  resolveAssignEmployeeServicesInput,
  resolveServicesByCategoryName,
  resolveServicesForEmployeeAssignment,
  resolveTransferEmployeeServicesInput,
  resolveUnassignEmployeeServicesInput,
  resolveScopedEmployeeServices,
} from './ai-category-assignment.util.js';
import {
  ALL_CATEGORY_ASSIGNMENT_SCENARIOS,
  CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS,
  CATEGORY_TO_PROVIDER_SCENARIOS,
  CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS,
  TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS,
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
  { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s1', 's2', 's4'] },
  { id: 'e2', name: 'Maria Lopez', serviceIds: ['s1', 's2'] },
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
      expect(result.serviceIds).toEqual(
        expect.arrayContaining(['s1', 's2', 's4']),
      );
      expect(result.serviceIds).toHaveLength(3);
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

  describe('unassign and transfer prompts', () => {
    it.each(
      CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('detects unassign %s', (_id, prompt) => {
      expect(isUnassignServicesFromProviderPrompt(prompt)).toBe(true);
      expect(isTransferServicesBetweenProvidersPrompt(prompt)).toBe(false);
      expect(isAssignCategoryToProviderPrompt(prompt)).toBe(false);
    });

    it.each(
      TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('detects transfer %s', (_id, prompt) => {
      expect(isTransferServicesBetweenProvidersPrompt(prompt)).toBe(true);
      expect(isUnassignServicesFromProviderPrompt(prompt)).toBe(false);
      expect(isAssignCategoryToProviderPrompt(prompt)).toBe(false);
    });

    it.each(
      CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS.map((s) => [s.id, s]),
    )('rescues unassign %s', (_id, scenario) => {
      const rescued = rescueUnassignServicesFromProviderIntent(
        scenario.prompt,
        'unknown',
        {},
      );
      expect(rescued?.action).toBe(scenario.expectedAction);
      expect(rescued?.rescueReason).toBe(scenario.rescueReason);
      expect(rescued?.params.employeeName).toBe(scenario.employeeName);
      if (scenario.categoryName) {
        expect(rescued?.params.categoryName).toBe(scenario.categoryName);
        expect(rescued?.params.unassignFromCategory).toBe(true);
      }
      if (scenario.unassignAllServices) {
        expect(rescued?.params.unassignAllServices).toBe(true);
      }
    });

    it.each(
      TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS.map((s) => [s.id, s]),
    )('rescues transfer %s', (_id, scenario) => {
      const rescued = rescueTransferServicesBetweenProvidersIntent(
        scenario.prompt,
        'unknown',
        {},
      );
      expect(rescued?.action).toBe(scenario.expectedAction);
      expect(rescued?.rescueReason).toBe(scenario.rescueReason);
      expect(rescued?.params.fromEmployeeName).toBe(
        scenario.fromEmployeeName,
      );
      expect(rescued?.params.toEmployeeName).toBe(scenario.toEmployeeName);
      if (scenario.categoryName) {
        expect(rescued?.params.categoryName).toBe(scenario.categoryName);
        expect(rescued?.params.transferFromCategory).toBe(true);
      }
    });

    it('rejects capacity rebalance slot moves', () => {
      expect(
        isTransferServicesBetweenProvidersPrompt(
          'Move 2 facemassage slots from Gevorg to Maria on Friday',
        ),
      ).toBe(false);
    });

    it('rejects slot-count moves even without rebalance phrasing', () => {
      expect(
        isTransferServicesBetweenProvidersPrompt(
          'move 2 bookings transfer Color services from Maria to Anna',
        ),
      ).toBe(false);
    });

    it('returns null when unassign action already classified', () => {
      expect(
        rescueUnassignServicesFromProviderIntent(
          CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS[0].prompt,
          'unassign_employee_services',
          {},
        ),
      ).toBeNull();
    });

    it('returns null when transfer action already classified', () => {
      expect(
        rescueTransferServicesBetweenProvidersIntent(
          TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS[0].prompt,
          'transfer_employee_services',
          {},
        ),
      ).toBeNull();
    });
  });

  describe('resolveUnassignEmployeeServicesInput', () => {
    it('removes category services currently assigned to provider', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          unassignFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.serviceIds).toEqual(['s4']);
      expect(result.serviceNames).toEqual(
        expect.arrayContaining(['Balayage', 'Highlights']),
      );
    });

    it('removes all assigned services from provider', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Maria Lopez',
          unassignAllServices: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.serviceIds).toEqual([]);
      expect(result.serviceNames).toHaveLength(2);
    });

    it('removes a single named service from provider', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          serviceName: 'Facial',
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.serviceIds).toEqual(['s1', 's2']);
    });
  });

  describe('resolveTransferEmployeeServicesInput', () => {
    it('moves category services from source to target', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          transferFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fromServiceIds).toEqual([]);
      expect(result.toServiceIds).toEqual(
        expect.arrayContaining(['s1', 's2', 's4']),
      );
      expect(result.serviceNames).toEqual(
        expect.arrayContaining(['Balayage', 'Highlights']),
      );
    });

    it('fails when source and target are the same provider', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Maria Lopez',
          categoryName: 'Color',
          transferFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when source or target provider is missing', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Nobody',
          toEmployeeName: 'Maria Lopez',
          categoryName: 'Color',
          transferFromCategory: true,
        },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when source has no matching assigned services', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Gevorg Gasparyan',
          serviceName: 'Facial',
          transferFromCategory: false,
        },
      );
      expect(result.ok).toBe(false);
    });
  });

  describe('resolveUnassignEmployeeServicesInput failures', () => {
    it('fails when provider is not specified', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        { categoryName: 'Color', unassignFromCategory: true },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when provider has no matching assigned services', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Maria Lopez',
          serviceName: 'Facial',
        },
      );
      expect(result.ok).toBe(false);
    });

    it('fails when scope is omitted', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        { employeeName: 'Gevorg Gasparyan' },
      );
      expect(result.ok).toBe(false);
    });
  });

  describe('buildUnassignRescueParams', () => {
    it('merges extracted and param fallbacks', () => {
      expect(
        buildUnassignRescueParams(
          { categoryName: 'Hair', employeeName: 'Anna' },
          { unassignAllServices: true },
        ),
      ).toEqual({
        unassignAllServices: true,
        categoryName: 'Hair',
        employeeName: 'Anna',
        unassignFromCategory: true,
      });
    });

    it('uses string param fallbacks when extraction is empty', () => {
      expect(
        buildUnassignRescueParams(
          {},
          {
            categoryName: 'Color',
            employeeName: 'Gevorg',
            unassignFromCategory: true,
          },
        ),
      ).toEqual({
        categoryName: 'Color',
        employeeName: 'Gevorg',
        unassignFromCategory: true,
        unassignAllServices: false,
      });
    });
  });

  describe('buildTransferRescueParams', () => {
    it('merges extracted and param fallbacks', () => {
      expect(
        buildTransferRescueParams(
          {
            fromEmployeeName: 'Maria',
            toEmployeeName: 'Anna',
            categoryName: 'Spa',
          },
          {},
        ),
      ).toEqual({
        categoryName: 'Spa',
        fromEmployeeName: 'Maria',
        toEmployeeName: 'Anna',
        unassignAllServices: false,
        transferFromCategory: true,
      });
    });

    it('uses string param fallbacks when extraction is empty', () => {
      expect(
        buildTransferRescueParams(
          {},
          {
            fromEmployeeName: 'Maria',
            toEmployeeName: 'Anna',
            categoryName: 'Hair',
            transferFromCategory: true,
            unassignAllServices: true,
          },
        ),
      ).toEqual({
        fromEmployeeName: 'Maria',
        toEmployeeName: 'Anna',
        categoryName: 'Hair',
        transferFromCategory: true,
        unassignAllServices: true,
      });
    });
  });

  describe('scoped assignment edge branches', () => {
    it('transfers all assigned services when unassignAllServices is set', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Gevorg Gasparyan',
          unassignAllServices: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fromServiceIds).toEqual([]);
      expect(result.transferredServiceIds).toHaveLength(2);
    });

    it('supports serviceNames array for unassign', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          serviceNames: ['Balayage', 'Highlights'],
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.serviceIds).toEqual(['s4']);
    });

    it('fails when provider has no assigned services at all', () => {
      const result = resolveUnassignEmployeeServicesInput(
        [{ id: 'e9', name: 'Empty Provider', serviceIds: [] }],
        catalogServices,
        {
          employeeName: 'Empty Provider',
          unassignAllServices: true,
        },
      );
      expect(result.ok).toBe(false);
    });

    it('handles undefined serviceIds on employee', () => {
      const result = resolveUnassignEmployeeServicesInput(
        [{ id: 'e9', name: 'Empty Provider' }],
        catalogServices,
        {
          employeeName: 'Empty Provider',
          serviceName: 'Balayage',
        },
      );
      expect(result.ok).toBe(false);
    });

    it('ignores non-string rescue param fallbacks', () => {
      expect(
        buildUnassignRescueParams({}, { categoryName: 1, employeeName: null }),
      ).toEqual({
        categoryName: undefined,
        employeeName: undefined,
        unassignAllServices: false,
        unassignFromCategory: false,
      });
      expect(
        buildTransferRescueParams(
          {},
          {
            fromEmployeeName: false,
            toEmployeeName: 9,
            categoryName: null,
          },
        ),
      ).toEqual({
        fromEmployeeName: undefined,
        toEmployeeName: undefined,
        categoryName: undefined,
        unassignAllServices: false,
        transferFromCategory: false,
      });
    });

    it('scopes transfer via transferFromCategory flag alone', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          transferFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.scopedFromCategory).toBe(true);
    });

    it('marks unassign scopedFromCategory when flag is set', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          unassignFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.scopedFromCategory).toBe(true);
    });

    it('uses unassignFromCategory flag even when serviceName is present', () => {
      const result = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
          serviceName: 'Nonexistent',
          unassignFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.scopedFromCategory).toBe(true);
    });

    it('transfer scopedFromCategory honors transferFromCategory with serviceName set', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          categoryName: 'Color',
          serviceName: 'Nonexistent',
          transferFromCategory: true,
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.scopedFromCategory).toBe(true);
    });

    it('transfer fails when provider params are not strings', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 1,
          toEmployeeName: null,
          categoryName: 'Color',
        },
      );
      expect(result.ok).toBe(false);
    });

    it('transfer supports serviceNames array and non-string serviceName', () => {
      const result = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          serviceName: 42,
          serviceNames: ['Balayage', 'Highlights'],
        },
      );
      expect(result.ok).toBe(true);
    });

    it('transfer failure lists assigned services when source has undefined serviceIds', () => {
      const result = resolveTransferEmployeeServicesInput(
        [
          { id: 'e9', name: 'Bare Provider' },
          { id: 'e2', name: 'Maria Lopez', serviceIds: ['s1', 's2'] },
        ],
        catalogServices,
        {
          fromEmployeeName: 'Bare Provider',
          toEmployeeName: 'Maria Lopez',
          serviceName: 'Balayage',
        },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.details?.assignedServices).toEqual([]);
    });

    it('derives scopedFromCategory from categoryName without explicit flag', () => {
      const unassign = resolveUnassignEmployeeServicesInput(
        employees,
        catalogServices,
        {
          employeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
        },
      );
      expect(unassign.ok).toBe(true);
      if (!unassign.ok) return;
      expect(unassign.scopedFromCategory).toBe(true);

      const transfer = resolveTransferEmployeeServicesInput(
        employees,
        catalogServices,
        {
          fromEmployeeName: 'Maria Lopez',
          toEmployeeName: 'Gevorg Gasparyan',
          categoryName: 'Color',
        },
      );
      expect(transfer.ok).toBe(true);
      if (!transfer.ok) return;
      expect(transfer.scopedFromCategory).toBe(true);
    });
  });

  describe('resolveScopedEmployeeServices', () => {
    it('uses unassignFromCategory branch for category scope', () => {
      const scoped = resolveScopedEmployeeServices(
        { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s1', 's2', 's4'] },
        catalogServices,
        {
          categoryName: 'Color',
          unassignFromCategory: true,
          serviceName: 'Nonexistent',
        },
      );
      expect(scoped.map((s) => s.id)).toEqual(['s1', 's2']);
    });

    it('uses categoryName-only branch when flags are false', () => {
      const scoped = resolveScopedEmployeeServices(
        { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s1', 's2', 's4'] },
        catalogServices,
        {
          categoryName: 'Color',
          unassignFromCategory: false,
          transferFromCategory: false,
        },
      );
      expect(scoped.map((s) => s.id)).toEqual(['s1', 's2']);
    });
  });

  describe('extractUnassignFromProviderFromPrompt', () => {
    it.each(
      CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS.filter((s) => s.categoryName).map(
        (s) => [s.id, s],
      ),
    )('extracts unassign fields for %s', (_id, scenario) => {
      const extracted = extractUnassignFromProviderFromPrompt(scenario.prompt);
      expect(extracted.employeeName).toBe(scenario.employeeName);
      expect(extracted.categoryName).toBe(scenario.categoryName);
    });
  });

  describe('extractTransferBetweenProvidersFromPrompt', () => {
    it.each(TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS.map((s) => [s.id, s]))(
      'extracts transfer fields for %s',
      (_id, scenario) => {
        const extracted = extractTransferBetweenProvidersFromPrompt(
          scenario.prompt,
        );
        expect(extracted.fromEmployeeName).toBe(scenario.fromEmployeeName);
        expect(extracted.toEmployeeName).toBe(scenario.toEmployeeName);
        if (scenario.categoryName) {
          expect(extracted.categoryName).toBe(scenario.categoryName);
        }
      },
    );
  });
});
