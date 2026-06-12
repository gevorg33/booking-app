import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { resolveAssignEmployeeServicesInput } from './ai-category-assignment.util.js';
import { CATEGORY_TO_PROVIDER_SCENARIOS } from './ai-category-assignment.fixtures.js';

describe('category assignment handler flows', () => {
  const planBuilder = new OperationalPlanBuilderService();
  const employeeUpdate = jest.fn();

  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan', serviceIds: ['s-3-1'] },
    { id: 'e2', name: 'Maria Lopez', serviceIds: ['s-1-1'] },
    { id: 'e3', name: 'Anna Smith', serviceIds: [] },
    { id: 'e4', name: 'Mary Torgomyan', serviceIds: [] },
    { id: 'e5', name: 'Gevorg', serviceIds: [] },
    { id: 'e6', name: 'James', serviceIds: [] },
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

  beforeEach(() => {
    employeeUpdate.mockReset();
  });

  describe('assign_employee_services plan — category merge', () => {
    it.each(CATEGORY_TO_PROVIDER_SCENARIOS.map((s) => [s.id, s]))(
      'builds plan for %s',
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

        const plan = planBuilder.buildAssignEmployeeServicesPlan({
          businessId: 'biz-1',
          employeeId: resolved.employeeId,
          employeeName: resolved.employeeName,
          serviceIds: resolved.serviceIds,
          serviceNames: resolved.serviceNames,
          userId: 'user-1',
        });

        expect(plan.intent).toBe('assign_employee_services');
        expect(plan.steps).toHaveLength(1);
        expect(plan.steps[0].action).toBe('assign_employee_services');
        expect(plan.steps[0].params.employeeId).toBe(resolved.employeeId);
        expect(plan.steps[0].params.serviceIds).toEqual(resolved.serviceIds);
        expect(plan.steps[0].params.businessId).toBe('biz-1');
      },
    );

    it('merges Color category onto Gevorg existing Spa skill', () => {
      const resolved = resolveAssignEmployeeServicesInput(employees, services, {
        employeeName: 'Gevorg Gasparyan',
        categoryName: 'Color',
        assignFromCategory: true,
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;

      expect(resolved.serviceIds).toEqual(
        expect.arrayContaining(['s-0-1', 's-0-2', 's-3-1']),
      );
      expect(resolved.mergedFromCategory).toBe(true);

      const plan = planBuilder.buildAssignEmployeeServicesPlan({
        businessId: 'biz-1',
        employeeId: resolved.employeeId,
        employeeName: resolved.employeeName,
        serviceIds: resolved.serviceIds,
        serviceNames: resolved.serviceNames,
      });

      employeeUpdate(resolved.employeeId, {
        serviceIds: plan.steps[0].params.serviceIds,
      });
      expect(employeeUpdate).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({
          serviceIds: expect.arrayContaining(['s-0-1', 's-0-2', 's-3-1']),
        }),
      );
    });

    it('extends skills for explicit named services (non-category)', () => {
      const resolved = resolveAssignEmployeeServicesInput(employees, services, {
        employeeName: 'Maria Lopez',
        serviceName: 'Spa Service A',
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;
      expect(resolved.serviceIds).toEqual(
        expect.arrayContaining(['s-1-1', 's-3-1']),
      );
      expect(resolved.serviceIds).toHaveLength(2);
      expect(resolved.mergedFromCategory).toBe(false);
    });
  });
});
