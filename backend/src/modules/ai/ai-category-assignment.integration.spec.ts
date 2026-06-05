import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isStaffServiceMatrixPrompt,
  rescueOperationsIntent,
} from './ai-operations.util.js';
import {
  ALL_CATEGORY_ASSIGNMENT_SCENARIOS,
  CATEGORY_ASSIGNMENT_MISCLASSIFICATION_SCENARIOS,
  CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS,
  CATEGORY_TO_PROVIDER_SCENARIOS,
} from './ai-category-assignment.fixtures.js';
import {
  extractCategoryToProviderFromPrompt,
  isAssignCategoryToProviderPrompt,
  resolveAssignEmployeeServicesInput,
} from './ai-category-assignment.util.js';

describe('category assignment AI integration', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s4'] },
    { id: 'e2', name: 'Maria Lopez', serviceIds: [] },
    { id: 'e3', name: 'Anna Smith', serviceIds: [] },
    { id: 'e4', name: 'Mary Torgomyan', serviceIds: [] },
    { id: 'e5', name: 'James', serviceIds: [] },
  ];
  const categoryNames = [
    'Color',
    'Hair',
    'Nails',
    'Spa',
    'Wax',
    'Brow',
    'Massage',
  ] as const;
  const services = categoryNames.flatMap((name, index) => {
    const category = { id: `cat-${name.toLowerCase()}`, name };
    return [
      {
        id: `s-${index}-1`,
        name: `${name} Service A`,
        category,
        categoryId: category.id,
      },
      {
        id: `s-${index}-2`,
        name: `${name} Service B`,
        category,
        categoryId: category.id,
      },
    ];
  });

  describe('intent rescue — category to named provider', () => {
    it.each(CATEGORY_TO_PROVIDER_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s',
      (_id, scenario) => {
        expect(isAssignCategoryToProviderPrompt(scenario.prompt)).toBe(true);
        expect(isStaffServiceMatrixPrompt(scenario.prompt)).toBe(false);

        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
        expect(result?.params.categoryName).toBe(scenario.categoryName);
        expect(result?.params.employeeName).toBe(scenario.employeeName);
        expect(result?.params.assignFromCategory).toBe(true);
        scenario.paramsAssert?.(result?.params ?? {});

        const extracted = extractCategoryToProviderFromPrompt(scenario.prompt);
        expect(extracted.categoryName).toBe(scenario.categoryName);
        expect(extracted.employeeName).toBe(scenario.employeeName);
      },
    );
  });

  describe('misclassification recovery', () => {
    it.each(
      CATEGORY_ASSIGNMENT_MISCLASSIFICATION_SCENARIOS.map((s) => [s.id, s]),
    )('rescues %s from wrong action', (_id, scenario) => {
      const result = rescue.rescue({
        prompt: scenario.prompt,
        action: scenario.wrongAction,
        params: {},
        employees,
      });
      expect(result?.action).toBe(scenario.expectedAction);
      expect(result?.rescueReason).toBe(scenario.rescueReason);
    });
  });

  describe('operations rescue does not steal category-to-provider', () => {
    it.each(CATEGORY_TO_PROVIDER_SCENARIOS.map((s) => [s.id, s.prompt]))(
      'routes %s to assign_employee_services via operations rescue',
      (_id, prompt) => {
        const ops = rescueOperationsIntent(prompt, 'staff_service_matrix', {});
        expect(ops?.action).toBe('assign_employee_services');
      },
    );
  });

  describe('negative scenarios stay off category-to-provider', () => {
    it.each(
      CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('does not rescue %s as category-to-provider', (_id, prompt) => {
      expect(isAssignCategoryToProviderPrompt(prompt)).toBe(false);
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.rescueReason).not.toBe('assign_category_to_provider');
    });

    it('still rescues senior matrix to staff_service_matrix', () => {
      const prompt = 'Assign all color services to senior stylists only';
      expect(isStaffServiceMatrixPrompt(prompt)).toBe(true);
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).toBe('staff_service_matrix');
    });
  });

  describe('resolution merges skills for full scenario set', () => {
    it.each(ALL_CATEGORY_ASSIGNMENT_SCENARIOS.map((s) => [s.id, s]))(
      'resolves services for %s',
      (_id, scenario) => {
        const resolved = resolveAssignEmployeeServicesInput(
          employees,
          services,
          {
            employeeName: scenario.employeeName,
            categoryName: scenario.categoryName,
            assignFromCategory: true,
          },
        );
        expect(resolved.ok).toBe(true);
        if (!resolved.ok) return;
        expect(resolved.serviceNames.length).toBeGreaterThan(0);
        if (scenario.categoryName === 'Color') {
          expect(resolved.serviceIds).toEqual(
            expect.arrayContaining(['s-0-1', 's-0-2']),
          );
        }
        if (scenario.categoryName === 'Hair') {
          expect(resolved.serviceIds).toEqual(
            expect.arrayContaining(['s-1-1', 's-1-2']),
          );
        }
      },
    );
  });
});
