import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { AiSprint23Service } from './ai-sprint23.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('Sprint 23 AI scheduling scenarios', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan', businessId: 'biz-1', isActive: true },
    { id: 'e2', name: 'Maria Lopez', businessId: 'biz-1', isActive: true },
    { id: 'e3', name: 'Anna Kim', businessId: 'biz-1', isActive: true },
  ] as Employee[];

  const services = [
    { id: 's1', name: 'facemassage', businessId: 'biz-1', durationMinutes: 60 },
  ] as Service[];

  const planBuilder = new OperationalPlanBuilderService();

  describe('intent rescue', () => {
    const rescue = new AiIntentRescueService();

    it('ai-s3 rescues schedule swap', () => {
      const result = rescue.rescue({
        prompt: 'Swap Friday schedules between Gevorg and Maria',
        action: 'unknown',
        params: { employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'], date: '06/06/2026' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('swap_schedules');
    });

    it('ai-s4 rescues capacity rebalance over generic reschedule', () => {
      const result = rescue.rescue({
        prompt: 'Move 2 facemassage slots from Gevorg to Maria on Friday',
        action: 'unknown',
        params: {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          serviceName: 'facemassage',
          date: '06/06/2026',
        },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('rebalance_capacity');
    });

    it('ai-s5 rescues holiday mode', () => {
      const result = rescue.rescue({
        prompt: 'Close Dec 24-26 for all providers, extend Dec 23 until 21:00',
        action: 'unknown',
        params: {
          allProviders: true,
          closeDates: ['2026-12-24', '2026-12-25', '2026-12-26'],
          extendDate: '2026-12-23',
          extendTimeTo: '21:00',
        },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('holiday_mode');
    });

    it('ai-s6 rescues onboard provider schedule', () => {
      const result = rescue.rescue({
        prompt: "Set up Anna's first week from weekday template and assign massage services",
        action: 'unknown',
        params: {
          employeeName: 'Anna Kim',
          templateName: 'Weekday',
          dateFrom: '2026-06-09',
          dateTo: '2026-06-13',
        },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('onboard_provider_schedule');
    });

    it('ai-s2 enriches block_schedule params', () => {
      const result = rescue.rescue({
        prompt: 'Block lunch 12-13 for everyone, repeat 4 weeks, skip holidays',
        action: 'block_schedule',
        params: { dateFrom: '2026-06-01', dateTo: '2026-06-28' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('block_schedule');
      expect(result?.params.allProviders).toBe(true);
      expect(result?.params.skipHolidays).toBe(true);
      expect(result?.params.weeksCount).toBe(4);
    });
  });

  describe('plan builders', () => {
    it('ai-s3 builds swap schedule plan with clear + direct steps', () => {
      const plan = planBuilder.buildSwapSchedulesPlan({
        businessId: 'biz-1',
        swaps: [
          {
            date: '2026-06-06',
            employeeA: {
              id: 'e1',
              name: 'Gevorg Gasparyan',
              periods: [{ startTime: '09:00', endTime: '17:00', type: 'service_block', serviceIds: [] }],
            },
            employeeB: {
              id: 'e2',
              name: 'Maria Lopez',
              periods: [{ startTime: '10:00', endTime: '18:00', type: 'service_block', serviceIds: [] }],
            },
          },
        ],
      });
      expect(plan.intent).toBe('swap_schedules');
      expect(plan.steps).toHaveLength(4);
      expect(plan.steps.filter((s) => s.action === 'clear_schedule')).toHaveLength(2);
      expect(plan.steps.filter((s) => s.action === 'create_direct_schedule')).toHaveLength(2);
    });

    it('ai-s4 builds rebalance capacity plan', () => {
      const plan = planBuilder.buildRebalanceCapacityPlan({
        businessId: 'biz-1',
        fromName: 'Gevorg Gasparyan',
        toName: 'Maria Lopez',
        serviceName: 'facemassage',
        date: '2026-06-06',
        moves: [
          {
            bookingId: 'b1',
            label: 'Move booking',
            startTime: '2026-06-06T10:00:00.000Z',
            employeeId: 'e2',
            serviceId: 's1',
          },
        ],
      });
      expect(plan.intent).toBe('rebalance_capacity');
      expect(plan.steps[0].action).toBe('reschedule_booking');
    });

    it('ai-s5 builds holiday mode plan with optional extend', () => {
      const blockPlan = planBuilder.buildBlockSchedulePlan({
        businessId: 'biz-1',
        blocks: [
          {
            employeeId: 'e1',
            employeeName: 'Gevorg Gasparyan',
            isRepetitive: false,
            placeholder: 'Holiday closure',
            singleBlock: {
              startTime: '2026-12-24T00:00:00.000Z',
              endTime: '2026-12-24T23:59:59.999Z',
            },
          },
        ],
      });
      const extendPlan = planBuilder.buildDirectSchedulePlan({
        businessId: 'biz-1',
        employeeId: 'e1',
        employeeName: 'Gevorg Gasparyan',
        dates: ['2026-12-23'],
        periods: [{ startTime: '09:00', endTime: '21:00', type: 'service_block', serviceIds: [] }],
      });
      const plan = planBuilder.buildHolidayModePlan({
        businessId: 'biz-1',
        blockPlan,
        extendPlans: [extendPlan],
        closeDates: ['2026-12-24'],
        extendDate: '2026-12-23',
      });
      expect(plan.intent).toBe('holiday_mode');
      expect(plan.steps.length).toBeGreaterThan(1);
    });

    it('ai-s6 builds onboard provider schedule plan', () => {
      const applyPlan = planBuilder.buildApplySchedulePlan({
        businessId: 'biz-1',
        templateId: 't1',
        templateName: 'Weekday',
        employeeIds: ['e3'],
        employeeNames: ['Anna Kim'],
        startDate: '2026-06-09',
        endDate: '2026-06-13',
        applyDays: [1, 2, 3, 4, 5],
        repeatWeeksCount: 1,
      });
      const assignPlan = planBuilder.buildAssignEmployeeServicesPlan({
        businessId: 'biz-1',
        employeeId: 'e3',
        employeeName: 'Anna Kim',
        serviceIds: ['s1'],
        serviceNames: ['facemassage'],
      });
      const plan = planBuilder.buildOnboardProviderSchedulePlan({
        businessId: 'biz-1',
        employeeName: 'Anna Kim',
        templateName: 'Weekday',
        serviceNames: ['facemassage'],
        applyPlan,
        assignPlan,
      });
      expect(plan.intent).toBe('onboard_provider_schedule');
      expect(plan.steps.length).toBe(applyPlan.steps.length + assignPlan.steps.length);
    });
  });

  describe('AiSprint23Service handlers', () => {
    const templateRepo = {
      find: jest.fn().mockResolvedValue([{ id: 't1', name: 'Weekday', businessId: 'biz-1' }]),
    };
    const periodRepo = {
      find: jest.fn().mockResolvedValue([
        {
          startTime: new Date('2026-06-06T09:00:00.000Z'),
          endTime: new Date('2026-06-06T17:00:00.000Z'),
          type: 'service_block',
          serviceIds: ['s1'],
        },
      ]),
    };
    const bookingRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'b1',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-06-06T10:00:00.000Z'),
          status: BookingStatus.CONFIRMED,
        },
        {
          id: 'b2',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-06-06T11:00:00.000Z'),
          status: BookingStatus.CONFIRMED,
        },
      ]),
    };
    const businessRepo = {
      findOne: jest.fn().mockResolvedValue({
        settings: { schedule: { holidayDates: ['2026-12-25'] } },
      }),
    };
    const orchestration = {
      executePlan: jest.fn().mockResolvedValue({
        success: true,
        action: 'swap_schedules',
        summary: 'ok',
        details: { taskId: 'task-1' },
        taskId: 'task-1',
        requiresApproval: false,
      }),
    };

    const service = new AiSprint23Service(
      templateRepo as any,
      periodRepo as any,
      bookingRepo as any,
      businessRepo as any,
      orchestration as any,
      planBuilder,
    );

    it('prepares swap schedules plan', async () => {
      const plan = await service.prepareSwapSchedulesPlan(
        'biz-1',
        'Swap Friday schedules between Gevorg and Maria',
        {
          employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'],
          date: '06/06/2026',
        },
        employees,
      );
      expect(plan?.intent).toBe('swap_schedules');
    });

    it('prepares rebalance capacity plan', async () => {
      const plan = await service.prepareRebalanceCapacityPlan(
        'biz-1',
        'Move 2 facemassage slots from Gevorg to Maria on Friday',
        {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          serviceName: 'facemassage',
          date: '06/06/2026',
          slotCount: 2,
        },
        employees,
        services,
      );
      expect(plan?.intent).toBe('rebalance_capacity');
      expect(plan?.steps).toHaveLength(2);
    });

    it('prepares holiday mode and onboard plans', async () => {
      const holidayPlan = await service.prepareHolidayModePlan(
        'biz-1',
        'Close Dec 24-26 for all',
        {
          allProviders: true,
          closeDates: ['2026-12-24', '2026-12-25', '2026-12-26'],
        },
        employees,
      );
      expect(holidayPlan?.intent).toBe('holiday_mode');

      const holidayExtend = await service.prepareHolidayModePlan(
        'biz-1',
        'Close Dec 24 for all, extend Dec 23 until 21:00',
        {
          allProviders: true,
          closeDates: ['2026-12-24'],
          extendDate: '2026-12-23',
          extendTimeFrom: '09:00',
          extendTimeTo: '21:00',
        },
        employees,
      );
      expect(holidayExtend?.steps.some((s) => s.action === 'create_direct_schedule')).toBe(true);

      const onboardPlan = await service.prepareOnboardProviderSchedulePlan(
        'biz-1',
        "Set up Anna's first week from weekday template",
        {
          employeeName: 'Anna Kim',
          templateName: 'Weekday',
          dateFrom: '2026-06-09',
          dateTo: '2026-06-13',
          serviceName: 'facemassage',
        },
        employees,
        services,
      );
      expect(onboardPlan?.intent).toBe('onboard_provider_schedule');
    });

    it('executes handlers and resolves business holidays', async () => {
      const swap = await service.handleSwapSchedules(
        'biz-1',
        'Swap Friday schedules between Gevorg and Maria',
        { employeeNames: ['Gevorg Gasparyan', 'Maria Lopez'], date: '06/06/2026' },
        employees,
        'user-1',
      );
      expect(swap.success).toBe(true);

      orchestration.executePlan.mockResolvedValueOnce({
        success: true,
        action: 'rebalance_capacity',
        summary: 'ok',
        details: {},
        taskId: 'task-2',
        requiresApproval: false,
      });
      const rebalance = await service.handleRebalanceCapacity(
        'biz-1',
        'Move 2 facemassage slots from Gevorg to Maria on Friday',
        {
          fromEmployeeName: 'Gevorg Gasparyan',
          toEmployeeName: 'Maria Lopez',
          serviceName: 'facemassage',
          date: '06/06/2026',
          slotCount: 2,
        },
        employees,
        services,
      );
      expect(rebalance.action).toBe('rebalance_capacity');

      await expect(service.resolveHolidayDatesForBusiness('biz-1')).resolves.toEqual(['2026-12-25']);
    });

    it('returns failure summaries when plans cannot be built', async () => {
      expect((await service.handleSwapSchedules('biz-1', 'swap', {}, employees)).success).toBe(false);
      expect((await service.handleRebalanceCapacity('biz-1', 'move', {}, employees, services)).success).toBe(
        false,
      );
      expect((await service.handleHolidayMode('biz-1', 'close', {}, employees)).success).toBe(false);
      expect(
        (await service.handleOnboardProviderSchedule('biz-1', 'onboard', {}, employees, services)).success,
      ).toBe(false);
    });
  });
});
