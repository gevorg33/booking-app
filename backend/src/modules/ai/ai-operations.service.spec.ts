import { AiOperationsService } from './ai-operations.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('AiOperationsService (thin wrapper)', () => {
  const bookingRepo = {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: 'bk1', notes: '', metadata: { urgent: true } },
      ]),
  };
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      settings: { hours: '09:00–19:00' },
    }),
  };
  const orchestration = {
    executePlan: jest.fn().mockResolvedValue({
      success: true,
      action: 'no_show_recovery',
      summary: 'done',
      requiresApproval: true,
    }),
  };
  const planBuilder = {
    wrapOperationsPlan: jest.fn((_b, intent, steps, meta) => ({
      id: 'p1',
      intent,
      steps,
      reasoning: meta.reasoning,
      riskAssessment: meta.risk,
      businessId: 'biz-1',
      agentType: 'scheduling_optimization',
      constraints: [],
      status: 'draft',
      createdAt: new Date(),
    })),
  };

  const employees = [
    {
      id: 'e1',
      name: 'Maria',
      serviceIds: [],
      metadata: { seniority: 'senior' },
      isActive: true,
    },
  ] as any[];
  const services = [
    { id: 's1', name: 'Massage', price: 100, category: { name: 'Wellness' } },
  ] as any[];

  const serviceRepo = { find: jest.fn(async () => []) };
  const employeeService = {
    create: jest.fn(),
    findAll: jest.fn(async () => []),
    remove: jest.fn(),
  };
  const invitationsService = {
    create: jest.fn(),
    sendEmployeeAppAccess: jest.fn(),
  };

  const service = new AiOperationsService(
    bookingRepo as any,
    businessRepo as any,
    serviceRepo as any,
    orchestration as any,
    planBuilder as any,
    employeeService as any,
    invitationsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    orchestration.executePlan.mockResolvedValue({
      success: true,
      action: 'no_show_recovery',
      summary: 'done',
      requiresApproval: true,
    });
  });

  it('delegates no-show recovery', async () => {
    const plan = await service.prepareNoShowRecoveryPlan(
      'biz-1',
      'today',
      { date: '2026-06-02' },
      ['bk1'],
      'u1',
    );
    expect(plan?.intent).toBe('no_show_recovery');

    const result = await service.handleNoShowRecovery(
      'biz-1',
      'today',
      { date: '2026-06-02' },
      ['bk1'],
      'u1',
    );
    expect(result.action).toBe('no_show_recovery');
    expect(
      (await service.handleNoShowRecovery('biz-1', 'x', {}, [], 'u1')).success,
    ).toBe(false);
  });

  it('delegates sick-day replan', async () => {
    const plan = await service.prepareSickDayReplanPlan(
      'biz-1',
      'Maria is sick cancel today',
      { employeeName: 'Maria', date: '2026-06-02' },
      employees,
      'UTC',
    );
    expect(plan?.intent).toBe('sick_day_replan');

    orchestration.executePlan.mockResolvedValueOnce({
      success: true,
      action: 'sick_day_replan',
      summary: 'ok',
    });
    expect(
      (
        await service.handleSickDayReplan(
          'biz-1',
          'Maria is sick cancel today',
          { employeeName: 'Maria', date: '2026-06-02' },
          employees,
          'UTC',
        )
      ).action,
    ).toBe('sick_day_replan');
    expect(
      (await service.handleSickDayReplan('biz-1', 'x', {}, employees, 'UTC'))
        .success,
    ).toBe(false);
  });

  it('delegates import, pricing, and matrix handlers', async () => {
    expect(
      service.prepareImportServicesFromMenuPlan('biz-1', 'menu', {
        menuText: 'Facial 60min $50',
      })?.intent,
    ).toBe('import_services_from_menu');
    orchestration.executePlan.mockResolvedValueOnce({
      success: true,
      action: 'import_services_from_menu',
      summary: 'ok',
    });
    expect(
      (
        await service.handleImportServicesFromMenu('biz-1', 'menu', {
          menuText: 'Facial 60min $50',
        })
      ).action,
    ).toBe('import_services_from_menu');
    expect(
      (await service.handleImportServicesFromMenu('biz-1', 'x', {})).success,
    ).toBe(false);

    expect(
      service.prepareUpdateServicePricesPlan(
        'biz-1',
        'Raise all massage prices 10%',
        {},
        services,
      )?.intent,
    ).toBe('update_service_prices');
    orchestration.executePlan.mockResolvedValueOnce({
      success: true,
      action: 'update_service_prices',
      summary: 'ok',
    });
    expect(
      (
        await service.handleUpdateServicePrices(
          'biz-1',
          'Raise all massage prices 10%',
          {},
          services,
        )
      ).action,
    ).toBe('update_service_prices');
    expect(
      (await service.handleUpdateServicePrices('biz-1', 'x', {}, services))
        .success,
    ).toBe(false);

    expect(
      service.prepareStaffServiceMatrixPlan(
        'biz-1',
        'Assign color to seniors',
        {},
        employees,
        services,
      )?.intent,
    ).toBe('staff_service_matrix');
    orchestration.executePlan.mockResolvedValueOnce({
      success: true,
      action: 'staff_service_matrix',
      summary: 'ok',
    });
    expect(
      (
        await service.handleStaffServiceMatrix(
          'biz-1',
          'Assign color to seniors',
          {},
          employees,
          services,
        )
      ).action,
    ).toBe('staff_service_matrix');
    expect(
      (await service.handleStaffServiceMatrix('biz-1', 'x', {}, [], services))
        .success,
    ).toBe(false);
  });

  it('delegates read-only handlers and payment sweep filters', async () => {
    bookingRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    expect(
      (
        await service.handleCheckScheduleCompliance('biz-1', 'compliance', {
          dateFrom: '2026-06-01',
          dateTo: '2026-06-30',
        })
      ).action,
    ).toBe('check_schedule_compliance');

    bookingRepo.find
      .mockResolvedValueOnce([
        { status: BookingStatus.CONFIRMED, service: { price: 50 } },
      ])
      .mockResolvedValueOnce([{ status: BookingStatus.COMPLETED }]);
    expect(
      (
        await service.handleRevenueForecast('biz-1', 'forecast', {
          dateFrom: '2026-06-09',
          dateTo: '2026-06-15',
        })
      ).action,
    ).toBe('revenue_forecast');

    const filtered = service.applyPaymentSweepFilters('except walk-ins', {}, [
      { customerId: null, status: 'completed' },
      { customerId: 'c1', status: 'completed' },
    ]);
    expect(filtered.bookings).toHaveLength(1);
  });
});
