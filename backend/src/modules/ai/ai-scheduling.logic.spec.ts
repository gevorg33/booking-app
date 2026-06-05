import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import {
  buildHolidayModeFailure,
  buildOnboardProviderFailure,
  buildRebalanceCapacityFailure,
  buildSwapSchedulesFailure,
  executeSprint23Plan,
  prepareHolidayModePlanLogic,
  prepareOnboardProviderSchedulePlanLogic,
  prepareRebalanceCapacityPlanLogic,
  prepareSwapSchedulesPlanLogic,
  resolveHolidayDatesForBusinessLogic,
} from './ai-scheduling.logic.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ai-scheduling.logic', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan', businessId: 'biz-1', isActive: true },
    { id: 'e2', name: 'Maria Lopez', businessId: 'biz-1', isActive: true },
    { id: 'e3', name: 'Anna Kim', businessId: 'biz-1', isActive: true },
  ] as Employee[];

  const services = [
    { id: 's1', name: 'facemassage', businessId: 'biz-1', durationMinutes: 60 },
  ] as Service[];

  const planBuilder = new OperationalPlanBuilderService();
  const templateRepo = { find: jest.fn() };
  const periodRepo = { find: jest.fn() };
  const bookingRepo = { find: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const orchestration = { executePlan: jest.fn() };

  const deps = {
    templateRepo,
    periodRepo,
    bookingRepo,
    businessRepo,
    orchestration,
    planBuilder,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    templateRepo.find.mockResolvedValue([
      { id: 't1', name: 'Weekday', businessId: 'biz-1' },
    ]);
    periodRepo.find.mockResolvedValue([
      {
        startTime: new Date('2026-06-06T09:00:00.000Z'),
        endTime: new Date('2026-06-06T17:00:00.000Z'),
        type: 'service_block',
        serviceIds: ['s1'],
      },
    ]);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-06-06T10:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
      },
    ]);
    businessRepo.findOne.mockResolvedValue({
      settings: { holidays: ['2026-12-25'] },
    });
    orchestration.executePlan.mockResolvedValue({
      success: true,
      action: 'swap_schedules',
      summary: 'ok',
      details: { taskId: 'task-1' },
      taskId: 'task-1',
      requiresApproval: false,
    });
  });

  it('builds failure summaries for each scheduling intent', () => {
    expect(buildSwapSchedulesFailure({}).summary).toContain(
      'Specify two providers',
    );
    expect(
      buildSwapSchedulesFailure({
        employeeName: 'Gevorg Gasparyan',
        swapWithEmployeeName: 'Maria Lopez',
      }).summary,
    ).toContain('specify when');
    expect(buildRebalanceCapacityFailure({}).action).toBe('rebalance_capacity');
    expect(buildHolidayModeFailure({}).action).toBe('holiday_mode');
    expect(buildOnboardProviderFailure({}).action).toBe(
      'onboard_provider_schedule',
    );
  });

  it('executes plans with autoExecute heuristics', async () => {
    const plan = await prepareSwapSchedulesPlanLogic(
      deps,
      'biz-1',
      'Swap schedules',
      {
        employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
        date: '06/06/2026',
      },
      employees,
    );
    const result = await executeSprint23Plan(deps, plan!, 'biz-1', 'user-1', 2);
    expect(result.success).toBe(true);
    expect(orchestration.executePlan.mock.calls[0][0].autoExecute).toBe(false);

    orchestration.executePlan.mockResolvedValueOnce({
      success: false,
      action: 'holiday_mode',
      summary: 'failed',
    });
    const onboardPlan = await prepareOnboardProviderSchedulePlanLogic(
      deps,
      'biz-1',
      'Set up Anna',
      {
        employeeName: 'Anna Kim',
        templateName: 'Weekday',
        dateFrom: '2026-06-09',
        dateTo: '2026-06-13',
      },
      employees,
      services,
    );
    const onboardResult = await executeSprint23Plan(
      deps,
      onboardPlan!,
      'biz-1',
      undefined,
    );
    expect(onboardResult.details).toEqual({
      taskId: undefined,
      requiresApproval: undefined,
    });
  });

  describe('prepareSwapSchedulesPlanLogic', () => {
    it('returns null for incomplete swap inputs', async () => {
      expect(
        await prepareSwapSchedulesPlanLogic(
          deps,
          'biz-1',
          'swap',
          {},
          employees,
        ),
      ).toBeNull();
      expect(
        await prepareSwapSchedulesPlanLogic(
          deps,
          'biz-1',
          'swap',
          { employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'] },
          employees,
        ),
      ).toBeNull();
      expect(
        await prepareSwapSchedulesPlanLogic(
          deps,
          'biz-1',
          'swap',
          { employeeName: 'Gevorg Gasparyan', date: '06/06/2026' },
          employees,
        ),
      ).toBeNull();
      expect(
        await prepareSwapSchedulesPlanLogic(
          deps,
          'biz-1',
          'swap',
          {
            employeeNames: ['Gevorg Gasparyan', 'Unknown'],
            date: '06/06/2026',
          },
          employees,
        ),
      ).toBeNull();
    });

    it('builds multi-day swap plans', async () => {
      const plan = await prepareSwapSchedulesPlanLogic(
        deps,
        'biz-1',
        'Swap schedules',
        {
          employeeName: 'Gevorg Gasparyan',
          swapWithEmployeeName: 'Maria Lopez',
          dateFrom: '2026-06-06',
          dateTo: '2026-06-07',
        },
        employees,
      );
      expect(plan?.intent).toBe('swap_schedules');
      expect(plan?.steps.length).toBeGreaterThan(4);
    });
  });

  describe('prepareRebalanceCapacityPlanLogic', () => {
    it('returns null for invalid rebalance inputs', async () => {
      expect(
        await prepareRebalanceCapacityPlanLogic(
          deps,
          'biz-1',
          'move',
          {},
          employees,
          services,
        ),
      ).toBeNull();
      expect(
        await prepareRebalanceCapacityPlanLogic(
          deps,
          'biz-1',
          'move',
          {
            fromEmployeeName: 'Ghost',
            toEmployeeName: 'Maria Lopez',
            serviceName: 'facemassage',
            date: '06/06/2026',
          },
          employees,
          services,
        ),
      ).toBeNull();
      expect(
        await prepareRebalanceCapacityPlanLogic(
          deps,
          'biz-1',
          'move',
          {
            fromEmployeeName: 'Gevorg Gasparyan',
            toEmployeeName: 'Maria Lopez',
            serviceName: 'unknown',
            date: '06/06/2026',
          },
          employees,
          services,
        ),
      ).toBeNull();
      expect(
        await prepareRebalanceCapacityPlanLogic(
          deps,
          'biz-1',
          'move',
          {
            fromEmployeeName: 'Gevorg Gasparyan',
            toEmployeeName: 'Maria Lopez',
            serviceName: 'facemassage',
          },
          employees,
          services,
        ),
      ).toBeNull();
      bookingRepo.find.mockResolvedValueOnce([]);
      expect(
        await prepareRebalanceCapacityPlanLogic(
          deps,
          'biz-1',
          'move',
          {
            fromEmployeeName: 'Gevorg Gasparyan',
            toEmployeeName: 'Maria Lopez',
            serviceName: 'facemassage',
            date: '06/06/2026',
          },
          employees,
          services,
        ),
      ).toBeNull();
    });

    it('supports employeeNames, toEmployeeName, and params.date fallbacks', async () => {
      const byNames = await prepareRebalanceCapacityPlanLogic(
        deps,
        'biz-1',
        'move',
        {
          employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
          serviceName: 'facemassage',
          date: '06/06/2026',
        },
        employees,
        services,
      );
      expect(byNames?.intent).toBe('rebalance_capacity');

      const byToEmployee = await prepareRebalanceCapacityPlanLogic(
        deps,
        'biz-1',
        'move',
        {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          serviceName: 'facemassage',
          date: '2026-06-06',
        },
        employees,
        services,
      );
      expect(byToEmployee?.steps).toHaveLength(1);
    });
  });

  describe('prepareHolidayModePlanLogic', () => {
    it('builds closure-only and extended holiday plans', async () => {
      const closureOnly = await prepareHolidayModePlanLogic(
        deps,
        'biz-1',
        'Close Dec 24 for all',
        { allProviders: true, closeDates: ['2026-12-24'] },
        employees,
      );
      expect(closureOnly?.intent).toBe('holiday_mode');

      const extended = await prepareHolidayModePlanLogic(
        deps,
        'biz-1',
        'Close for all staff and extend Dec 23',
        {
          closeDates: ['2026-12-24'],
          extendDate: '2026-12-23',
          extendTimeFrom: '09:00',
          extendTimeTo: '21:00',
        },
        employees,
      );
      expect(
        extended?.steps.some((s) => s.action === 'create_direct_schedule'),
      ).toBe(true);

      const partialExtend = await prepareHolidayModePlanLogic(
        deps,
        'biz-1',
        'Close Dec 24',
        {
          allProviders: true,
          closeDates: ['2026-12-24'],
          extendDate: '2026-12-23',
        },
        employees,
      );
      expect(
        partialExtend?.steps.every(
          (s) => s.action !== 'create_direct_schedule',
        ),
      ).toBe(true);

      const customPlaceholder = await prepareHolidayModePlanLogic(
        deps,
        'biz-1',
        'Close for all',
        {
          allProviders: true,
          closeDates: ['2026-12-24'],
          placeholder: 'Closed',
        },
        employees,
      );
      expect(customPlaceholder).not.toBeNull();
    });

    it('returns null without targets or close dates', async () => {
      expect(
        await prepareHolidayModePlanLogic(
          deps,
          'biz-1',
          'close',
          { employeeName: 'Nobody' },
          employees,
        ),
      ).toBeNull();
      expect(
        await prepareHolidayModePlanLogic(
          deps,
          'biz-1',
          'close for all',
          { allProviders: true },
          employees,
        ),
      ).toBeNull();
    });
  });

  describe('prepareOnboardProviderSchedulePlanLogic', () => {
    it('builds schedule-only and full onboarding plans', async () => {
      const scheduleOnly = await prepareOnboardProviderSchedulePlanLogic(
        deps,
        'biz-1',
        'Set up Anna',
        {
          employeeName: 'Anna Kim',
          templateName: 'Weekday',
          dateFrom: '2026-06-09',
          dateTo: '2026-06-13',
        },
        employees,
        [],
      );
      expect(scheduleOnly?.steps).toHaveLength(1);

      const full = await prepareOnboardProviderSchedulePlanLogic(
        deps,
        'biz-1',
        'Set up Anna',
        {
          employeeName: 'Anna Kim',
          templateName: 'Weekday',
          dateFrom: '2026-06-09',
          dateTo: '2026-06-13',
          serviceName: 'facemassage',
          repeatWeeksCount: 2,
        },
        employees,
        services,
      );
      expect(full?.steps.length).toBe(2);
    });

    it('returns null for invalid onboarding inputs', async () => {
      expect(
        await prepareOnboardProviderSchedulePlanLogic(
          deps,
          'biz-1',
          'onboard',
          { employeeName: 'Anna Kim', templateName: 'Weekday' },
          employees,
          services,
        ),
      ).toBeNull();
      expect(
        await prepareOnboardProviderSchedulePlanLogic(
          deps,
          'biz-1',
          'onboard',
          {
            employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
            templateName: 'Weekday',
          },
          employees,
          services,
        ),
      ).toBeNull();
      expect(
        await prepareOnboardProviderSchedulePlanLogic(
          deps,
          'biz-1',
          'onboard',
          {
            employeeName: 'Anna Kim',
            templateName: 'Missing',
            dateFrom: '2026-06-09',
            dateTo: '2026-06-13',
          },
          employees,
          services,
        ),
      ).toBeNull();
    });
  });

  it('resolves holiday dates from business settings', async () => {
    await expect(
      resolveHolidayDatesForBusinessLogic(businessRepo, 'biz-1'),
    ).resolves.toEqual(['2026-12-25']);
    businessRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      resolveHolidayDatesForBusinessLogic(businessRepo, 'biz-1'),
    ).resolves.toEqual([]);
  });
});
