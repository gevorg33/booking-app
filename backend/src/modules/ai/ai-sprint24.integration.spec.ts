import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { AiSprint24Service } from './ai-sprint24.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildNoShowRecoveryPlanSteps,
  buildSickDayReplanPlanSteps,
  buildUpdateServicePricesPlanSteps,
  buildStaffServiceMatrixPlanSteps,
  buildImportServicesReviewPlanSteps,
} from './ai-sprint24-plan.util.js';

describe('Sprint 24 AI booking & business ops', () => {
  const employees = [
    { id: 'e1', name: 'Maria Lopez', businessId: 'biz-1', isActive: true, serviceIds: ['s1'], metadata: { seniority: 'senior' } },
    { id: 'e2', name: 'Junior Sam', businessId: 'biz-1', isActive: true, serviceIds: ['s1', 's2'], metadata: { level: 'junior' } },
    { id: 'e3', name: 'Anna Kim', businessId: 'biz-1', isActive: true, serviceIds: [], metadata: {} },
  ] as Employee[];

  const services = [
    { id: 's1', name: 'Full Color', businessId: 'biz-1', price: 120, category: { name: 'Color' } },
    { id: 's2', name: 'Massage', businessId: 'biz-1', price: 80, category: { name: 'Wellness' } },
  ] as Service[];

  const planBuilder = new OperationalPlanBuilderService();

  describe('intent rescue', () => {
    const rescue = new AiIntentRescueService();

    it('ai-b3 rescues no-show recovery', () => {
      const result = rescue.rescue({
        prompt: 'Mark no-shows today, release slots, suggest rebooking messages',
        action: 'unknown',
        params: { date: '02/06/2026' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('no_show_recovery');
    });

    it('ai-b4 enriches payment sweep params', () => {
      const result = rescue.rescue({
        prompt: 'Mark all completed today as paid except walk-ins',
        action: 'payment_sweep',
        params: { date: '02/06/2026' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('payment_sweep');
      expect(result?.params.excludeWalkIns).toBe(true);
      expect(result?.params.statusFilter).toBe(BookingStatus.COMPLETED);
    });

    it('ai-b5 rescues sick-day replan', () => {
      const result = rescue.rescue({
        prompt: 'Maria is sick — cancel her day and redistribute urgent bookings',
        action: 'unknown',
        params: { date: '02/06/2026' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('sick_day_replan');
      expect(result?.params.employeeName).toBe('Maria');
    });

    it('ai-o1 rescues menu import', () => {
      const result = rescue.rescue({
        prompt: 'Import services from the menu photo',
        action: 'unknown',
        params: { menuText: 'Facial 60min $50' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('import_services_from_menu');
    });

    it('ai-o2 rescues price adjustment', () => {
      const result = rescue.rescue({
        prompt: 'Raise all massage prices 10% from June 1',
        action: 'unknown',
        params: {},
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('update_service_prices');
    });

    it('ai-o3 rescues staff-service matrix', () => {
      const result = rescue.rescue({
        prompt: 'Assign all color services to senior stylists only',
        action: 'unknown',
        params: {},
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('staff_service_matrix');
    });

    it('ai-o4 rescues compliance check', () => {
      const result = rescue.rescue({
        prompt: 'Any appointments outside business hours this month?',
        action: 'unknown',
        params: { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(result?.action).toBe('check_schedule_compliance');
    });

    it('ai-o5 rescues revenue forecast and evening availability', () => {
      expect(
        rescue.rescue({
          prompt: 'Project next week revenue from current schedule',
          action: 'unknown',
          params: { dateFrom: '2026-06-09', dateTo: '2026-06-15' },
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
        })?.action,
      ).toBe('revenue_forecast');

      const evening = rescue.rescue({
        prompt: 'Which evening slots are available for Maria on Friday?',
        action: 'check_availability',
        params: { employeeName: 'Maria Lopez', date: '06/06/2026' },
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
      });
      expect(evening?.params.timeOfDay).toBe('evening');
    });
  });

  describe('plan builders', () => {
    it('ai-b3 builds no-show recovery plan chain', () => {
      const steps = buildNoShowRecoveryPlanSteps({
        businessId: 'biz-1',
        bookingIds: ['bk1', 'bk2'],
        date: '2026-06-02',
        userId: 'u1',
      });
      const plan = planBuilder.wrapSprint24Plan('biz-1', 'no_show_recovery', steps, {
        reasoning: 'test',
        risk: { level: 'low', factors: [] },
        requiresApproval: true,
      });
      expect(plan.intent).toBe('no_show_recovery');
      expect(plan.steps.map((s) => s.action)).toEqual([
        'mark_no_shows',
        'find_freed_slots',
        'find_rebooking_candidates',
        'propose_reassignment',
      ]);
      expect(plan.steps[1].params.includeNoShows).toBe(true);
    });

    it('ai-b5 builds sick-day replan with cancel + block', () => {
      const steps = buildSickDayReplanPlanSteps({
        businessId: 'biz-1',
        employeeId: 'e1',
        employeeName: 'Maria Lopez',
        date: '2026-06-02',
        bookingIds: ['bk1'],
        userId: 'u1',
      });
      const plan = planBuilder.wrapSprint24Plan('biz-1', 'sick_day_replan', steps, {
        reasoning: 'test',
        risk: { level: 'medium', factors: [] },
        requiresApproval: true,
      });
      expect(plan.intent).toBe('sick_day_replan');
      expect(plan.steps.some((s) => s.action === 'cancel_bookings')).toBe(true);
      expect(plan.steps.some((s) => s.action === 'block_schedule')).toBe(true);
    });

    it('ai-o1/o2/o3 build catalog ops plans', () => {
      const importSteps = buildImportServicesReviewPlanSteps({
        businessId: 'biz-1',
        services: [{ name: 'Facial', durationMinutes: 60, price: 50 }],
      });
      expect(importSteps[0].action).toBe('create_service');

      const priceSteps = buildUpdateServicePricesPlanSteps({
        businessId: 'biz-1',
        updates: [{ serviceId: 's2', serviceName: 'Massage', currentPrice: 80, newPrice: 88 }],
      });
      expect(priceSteps[0].action).toBe('update_service');

      const matrixSteps = buildStaffServiceMatrixPlanSteps({
        businessId: 'biz-1',
        seniorAssignments: [{ employeeId: 'e1', employeeName: 'Maria', serviceIds: ['s1'] }],
        juniorAssignments: [{ employeeId: 'e2', employeeName: 'Sam', serviceIds: [] }],
        serviceNames: ['Full Color'],
      });
      expect(matrixSteps).toHaveLength(2);
    });
  });

  describe('AiSprint24Service handlers', () => {
    const bookingRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'bk1',
          employeeId: 'e1',
          notes: 'urgent appt',
          metadata: {},
          startTime: new Date('2026-06-02T10:00:00.000Z'),
          status: BookingStatus.CONFIRMED,
        },
        {
          id: 'bk2',
          employeeId: 'e1',
          notes: '',
          metadata: { urgent: true },
          startTime: new Date('2026-06-02T11:00:00.000Z'),
          status: BookingStatus.CONFIRMED,
        },
      ]),
    };
    const businessRepo = {
      findOne: jest.fn().mockResolvedValue({
        settings: { hours: { open: '09:00', close: '19:00' } },
      }),
    };
    const orchestration = {
      executePlan: jest.fn().mockResolvedValue({
        success: true,
        action: 'no_show_recovery',
        summary: 'ok',
        details: { taskId: 'task-1' },
        taskId: 'task-1',
        requiresApproval: true,
      }),
    };

    const service = new AiSprint24Service(
      bookingRepo as any,
      businessRepo as any,
      orchestration as any,
      planBuilder,
    );

    it('prepares and executes booking ops plans', async () => {
      const recovery = await service.prepareNoShowRecoveryPlan(
        'biz-1',
        'Mark no-shows today, release slots',
        { date: '2026-06-02' },
        ['bk1'],
        'u1',
      );
      expect(recovery?.intent).toBe('no_show_recovery');

      const sick = await service.prepareSickDayReplanPlan(
        'biz-1',
        'Maria is sick cancel urgent bookings today',
        { employeeName: 'Maria Lopez', date: '2026-06-02' },
        employees,
        'UTC',
        'u1',
      );
      expect(sick?.intent).toBe('sick_day_replan');
      const cancelStep = sick?.steps.find((s) => s.action === 'cancel_bookings');
      expect(cancelStep?.params.bookingIds).toEqual(['bk1', 'bk2']);

      orchestration.executePlan.mockResolvedValueOnce({
        success: true,
        action: 'sick_day_replan',
        summary: 'ok',
        requiresApproval: true,
      });
      const sickResult = await service.handleSickDayReplan(
        'biz-1',
        'Maria is sick cancel her day today',
        { employeeName: 'Maria Lopez', date: '2026-06-02' },
        employees,
        'UTC',
        'u1',
      );
      expect(sickResult.success).toBe(true);
    });

    it('prepares catalog and matrix plans', () => {
      const importPlan = service.prepareImportServicesFromMenuPlan(
        'biz-1',
        'Import from menu',
        { menuText: 'Facial 60min $50\nMassage 45min $70' },
        'u1',
      );
      expect(importPlan?.intent).toBe('import_services_from_menu');
      expect(importPlan?.steps.length).toBeGreaterThanOrEqual(1);

      const pricePlan = service.prepareUpdateServicePricesPlan(
        'biz-1',
        'Raise all massage prices 10%',
        {},
        services,
        'u1',
      );
      expect(pricePlan?.intent).toBe('update_service_prices');

      const matrixPlan = service.prepareStaffServiceMatrixPlan(
        'biz-1',
        'Assign all color services to senior stylists only',
        {},
        employees,
        services,
        'u1',
      );
      expect(matrixPlan?.intent).toBe('staff_service_matrix');
    });

    it('handles read-only compliance and revenue forecast', async () => {
      bookingRepo.find.mockResolvedValueOnce([
        {
          id: 'bk-out',
          startTime: new Date('2026-06-02T07:00:00.000Z'),
          endTime: new Date('2026-06-02T08:00:00.000Z'),
          employee: null,
          service: null,
        },
      ]);
      const compliance = await service.handleCheckScheduleCompliance(
        'biz-1',
        'appointments outside business hours this month',
        { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
      );
      expect(compliance.action).toBe('check_schedule_compliance');
      expect(compliance.summary).toContain('Provider');

      bookingRepo.find
        .mockResolvedValueOnce([
          { status: BookingStatus.CONFIRMED, service: { price: 120 } },
          { status: BookingStatus.CONFIRMED, service: { price: 80 } },
        ])
        .mockResolvedValueOnce([
          { status: BookingStatus.COMPLETED },
          { status: BookingStatus.NO_SHOW },
        ]);
      const forecast = await service.handleRevenueForecast(
        'biz-1',
        'Project next week revenue',
        { dateFrom: '2026-06-09', dateTo: '2026-06-15' },
      );
      expect(forecast.action).toBe('revenue_forecast');
      expect(forecast.details.grossRevenue).toBe(200);
    });

    it('returns failure summaries when plans cannot be built', async () => {
      expect((await service.handleNoShowRecovery('biz-1', 'recover', {}, [], 'u1')).success).toBe(false);
      expect((await service.handleSickDayReplan('biz-1', 'sick', {}, employees, 'UTC')).success).toBe(false);
      expect((await service.handleImportServicesFromMenu('biz-1', 'import', {})).success).toBe(false);
      expect((await service.handleUpdateServicePrices('biz-1', 'prices', {}, services)).success).toBe(false);
      expect(
        (await service.handleStaffServiceMatrix('biz-1', 'matrix', {}, [], services)).success,
      ).toBe(false);
    });
  });
});
