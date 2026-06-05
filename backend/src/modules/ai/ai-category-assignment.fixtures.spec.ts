import {
  ALL_CATEGORY_ASSIGNMENT_SCENARIOS,
  CATEGORY_ASSIGNMENT_MISCLASSIFICATION_SCENARIOS,
  CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS,
  CATEGORY_TO_PROVIDER_SCENARIOS,
} from './ai-category-assignment.fixtures.js';

describe('ai-category-assignment.fixtures', () => {
  it('has unique scenario ids', () => {
    const ids = ALL_CATEGORY_ASSIGNMENT_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines at least 10 positive category-to-provider scenarios', () => {
    expect(CATEGORY_TO_PROVIDER_SCENARIOS.length).toBeGreaterThanOrEqual(10);
  });

  it('each positive scenario has required fields', () => {
    for (const scenario of CATEGORY_TO_PROVIDER_SCENARIOS) {
      expect(scenario.prompt.length).toBeGreaterThan(10);
      expect(scenario.categoryName.length).toBeGreaterThan(0);
      expect(scenario.employeeName.length).toBeGreaterThan(0);
      expect(scenario.expectedAction).toBe('assign_employee_services');
      expect(scenario.rescueReason).toBe('assign_category_to_provider');
    }
  });

  it('negative scenarios avoid category-to-provider detection targets', () => {
    expect(
      CATEGORY_ASSIGNMENT_NEGATIVE_SCENARIOS.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('misclassification scenarios redirect to assign_employee_services', () => {
    for (const scenario of CATEGORY_ASSIGNMENT_MISCLASSIFICATION_SCENARIOS) {
      expect(scenario.expectedAction).toBe('assign_employee_services');
      expect(scenario.rescueReason).toBe('assign_category_to_provider');
    }
  });
});
