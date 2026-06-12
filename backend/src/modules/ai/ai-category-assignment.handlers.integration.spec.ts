import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import {
  resolveAssignEmployeeServicesInput,
  resolveTransferEmployeeServicesInput,
  resolveUnassignEmployeeServicesInput,
} from './ai-category-assignment.util.js';
import {
  CATEGORY_TO_PROVIDER_SCENARIOS,
  CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS,
  TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS,
} from './ai-category-assignment.fixtures.js';

describe('category assignment handler flows', () => {
  const planBuilder = new OperationalPlanBuilderService();
  const employeeUpdate = jest.fn();

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
  const allServiceIds = services.map((s) => s.id);

  const employees = [
    {
      id: 'e1',
      name: 'Gevorg Gasparyan',
      serviceIds: allServiceIds,
    },
    {
      id: 'e2',
      name: 'Maria Lopez',
      serviceIds: [
        's-0-1',
        's-0-2',
        's-1-1',
        's-1-2',
        's-2-1',
        's-2-2',
        's-3-1',
        's-3-2',
      ],
    },
    {
      id: 'e3',
      name: 'Anna Smith',
      serviceIds: ['s-1-1', 's-1-2', 's-2-1', 's-2-2', 's-4-1', 's-4-2'],
    },
    { id: 'e4', name: 'Mary Torgomyan', serviceIds: ['s-2-1', 's-2-2'] },
    { id: 'e5', name: 'Gevorg', serviceIds: ['s-4-1', 's-4-2', 's-5-1', 's-5-2', 's-6-1', 's-6-2'] },
    { id: 'e6', name: 'James', serviceIds: ['s-2-1', 's-2-2', 's-3-1', 's-3-2'] },
  ];

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
        serviceName: 'Nails Service A',
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;
      expect(resolved.serviceIds).toEqual(
        expect.arrayContaining(['s-2-1', 's-0-1', 's-0-2']),
      );
      expect(resolved.serviceIds.length).toBeGreaterThan(2);
      expect(resolved.mergedFromCategory).toBe(false);
    });
  });

  describe('unassign_employee_services plan', () => {
    it.each(
      CATEGORY_UNASSIGN_FROM_PROVIDER_SCENARIOS.filter((s) => s.categoryName).map(
        (s) => [s.id, s],
      ),
    )('builds unassign plan for %s', (_id, scenario) => {
      const resolved = resolveUnassignEmployeeServicesInput(employees, services, {
        employeeName: scenario.employeeName,
        categoryName: scenario.categoryName,
        unassignFromCategory: true,
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) return;

      const plan = planBuilder.buildUnassignEmployeeServicesPlan({
        businessId: 'biz-1',
        employeeId: resolved.employeeId,
        employeeName: resolved.employeeName,
        serviceIds: resolved.serviceIds,
        serviceNames: resolved.serviceNames,
        removedServiceNames: resolved.serviceNames,
        userId: 'user-1',
      });

      expect(plan.intent).toBe('unassign_employee_services');
      expect(plan.steps[0].action).toBe('unassign_employee_services');
      expect(plan.steps[0].params.serviceIds).toEqual(resolved.serviceIds);
    });
  });

  describe('transfer_employee_services plan', () => {
    it.each(TRANSFER_SERVICES_BETWEEN_PROVIDERS_SCENARIOS.map((s) => [s.id, s]))(
      'builds transfer plan for %s',
      (_id, scenario) => {
        const resolved = resolveTransferEmployeeServicesInput(employees, services, {
          fromEmployeeName: scenario.fromEmployeeName,
          toEmployeeName: scenario.toEmployeeName,
          categoryName: scenario.categoryName,
          serviceName: scenario.serviceName,
          transferFromCategory: scenario.categoryName != null,
          unassignAllServices: scenario.unassignAllServices,
        });
        expect(resolved.ok).toBe(true);
        if (!resolved.ok) return;

        const plan = planBuilder.buildTransferEmployeeServicesPlan({
          businessId: 'biz-1',
          fromEmployeeId: resolved.fromEmployeeId,
          fromEmployeeName: resolved.fromEmployeeName,
          fromServiceIds: resolved.fromServiceIds,
          toEmployeeId: resolved.toEmployeeId,
          toEmployeeName: resolved.toEmployeeName,
          toServiceIds: resolved.toServiceIds,
          serviceNames: resolved.serviceNames,
          userId: 'user-1',
        });

        expect(plan.intent).toBe('transfer_employee_services');
        expect(plan.steps).toHaveLength(2);
        expect(plan.steps[0].action).toBe('unassign_employee_services');
        expect(plan.steps[1].action).toBe('assign_employee_services');
        expect(plan.steps[1].dependsOn).toEqual([plan.steps[0].id]);
      },
    );
  });
});
