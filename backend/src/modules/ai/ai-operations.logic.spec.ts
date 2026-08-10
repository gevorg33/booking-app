import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  applyPaymentSweepFilters,
  buildComplianceCheckFailure,
  buildImportServicesFailure,
  buildNoShowRecoveryFailure,
  buildRevenueForecastFailure,
  buildSickDayReplanFailure,
  buildStaffServiceMatrixFailure,
  buildUpdateServicePricesFailure,
  executeOperationsPlan,
  handleCheckScheduleComplianceLogic,
  handleRevenueForecastLogic,
  prepareImportServicesFromMenuPlanLogic,
  prepareNoShowRecoveryPlanLogic,
  prepareStaffServiceMatrixPlanLogic,
  prepareSickDayReplanPlanLogic,
  prepareUpdateServicePricesPlanLogic,
} from './ai-operations.logic.js';
import type { OperationsLogicDeps } from './ai-operations.logic.js';

describe('ai-operations.logic', () => {
  const planBuilder = {
    wrapOperationsPlan: jest.fn((_b, intent, steps, meta) => ({
      id: 'plan-1',
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
  } as unknown as OperationsLogicDeps['planBuilder'];

  const bookingRepo = {
    find: jest.fn(),
  } as unknown as OperationsLogicDeps['bookingRepo'];

  const businessRepo = {
    findOne: jest.fn(),
  } as unknown as OperationsLogicDeps['businessRepo'];

  const orchestration = {
    executePlan: jest.fn().mockResolvedValue({
      success: true,
      action: 'no_show_recovery',
      summary: 'done',
    }),
    approveTask: jest.fn().mockResolvedValue({
      success: true,
      action: 'update_service_prices',
      summary: 'approved-and-executed',
    }),
  };

  const deps: OperationsLogicDeps = {
    bookingRepo,
    businessRepo,
    orchestration,
    planBuilder,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds failure summaries for each operations intent', () => {
    expect(buildNoShowRecoveryFailure({}).action).toBe('no_show_recovery');
    expect(buildSickDayReplanFailure({}).action).toBe('sick_day_replan');
    expect(buildImportServicesFailure({}).action).toBe(
      'import_services_from_menu',
    );
    expect(buildUpdateServicePricesFailure({}).action).toBe(
      'update_service_prices',
    );
    expect(buildStaffServiceMatrixFailure({}).action).toBe(
      'staff_service_matrix',
    );
    expect(buildComplianceCheckFailure({}).action).toBe(
      'check_schedule_compliance',
    );
    expect(buildRevenueForecastFailure({}).action).toBe('revenue_forecast');
  });

  it('prepares no-show recovery plan', async () => {
    const plan = await prepareNoShowRecoveryPlanLogic(
      deps,
      'biz-1',
      'today',
      { date: '2026-06-02' },
      ['bk1'],
      'u1',
    );
    expect(plan?.intent).toBe('no_show_recovery');
    expect(plan?.steps).toHaveLength(4);
    expect(
      await prepareNoShowRecoveryPlanLogic(
        deps,
        'biz-1',
        'today',
        {},
        [],
        'u1',
      ),
    ).toBeNull();

    const ranged = await prepareNoShowRecoveryPlanLogic(
      deps,
      'biz-1',
      'this week',
      { dateFrom: '2026-06-01', dateTo: '2026-06-07' },
      ['bk1'],
      'u1',
    );
    expect(ranged?.steps[1].params.dateRange).toBeDefined();

    const sameDay = await prepareNoShowRecoveryPlanLogic(
      deps,
      'biz-1',
      'today',
      { date: '2026-06-02' },
      ['bk1'],
    );
    expect(sameDay?.steps[1].params.date).toBe('2026-06-02');
    expect(sameDay?.steps[1].params.dateRange).toBeUndefined();

    const noRangeRecovery = await prepareNoShowRecoveryPlanLogic(
      deps,
      'biz-1',
      'mark no-shows',
      {},
      ['bk1'],
    );
    expect(noRangeRecovery?.steps[1].params.date).toBeUndefined();
    expect(noRangeRecovery?.steps[1].params.dateRange).toBeUndefined();
  });

  it('prepares sick-day replan plan', async () => {
    (bookingRepo.find as jest.Mock).mockResolvedValue([
      { id: 'bk1', notes: 'urgent', metadata: {} },
      { id: 'bk2', notes: '', metadata: {} },
    ]);

    const employees = [
      {
        id: 'e1',
        name: 'Maria',
        serviceIds: [],
        metadata: {},
        isActive: true,
      } as any,
    ];
    const plan = await prepareSickDayReplanPlanLogic(
      deps,
      'biz-1',
      'Maria is sick cancel urgent bookings today',
      { employeeName: 'Maria', date: '2026-06-02' },
      employees,
      'UTC',
      'u1',
    );
    expect(plan?.intent).toBe('sick_day_replan');

    const promptDateOnly = await prepareSickDayReplanPlanLogic(
      deps,
      'biz-1',
      'Maria is sick — cancel her appointments today',
      { employeeName: 'Maria' },
      employees,
      'UTC',
      'u1',
    );
    expect(promptDateOnly?.intent).toBe('sick_day_replan');

    const noEmployee = await prepareSickDayReplanPlanLogic(
      deps,
      'biz-1',
      'sick today',
      {},
      employees,
      'UTC',
    );
    expect(noEmployee).toBeNull();
    expect(
      await prepareSickDayReplanPlanLogic(
        deps,
        'biz-1',
        'no date context',
        { employeeName: 'Maria' },
        employees,
        'UTC',
      ),
    ).toBeNull();

    const twoEmployees = [
      { id: 'e1', name: 'Maria', serviceIds: [], metadata: {}, isActive: true },
      { id: 'e2', name: 'Anna', serviceIds: [], metadata: {}, isActive: true },
    ] as any[];
    expect(
      await prepareSickDayReplanPlanLogic(
        deps,
        'biz-1',
        'sick',
        {
          employeeName: 'Maria',
          employeeNames: ['Maria', 'Anna'],
          date: '2026-06-02',
        },
        twoEmployees,
        'UTC',
      ),
    ).toBeNull();

    expect(
      await prepareSickDayReplanPlanLogic(
        deps,
        'biz-1',
        'Maria is sick — cancel appointments',
        { employeeName: 'Maria' },
        employees,
        'UTC',
      ),
    ).toBeNull();
  });

  it('prepares import, price, and matrix plans', () => {
    const importPlan = prepareImportServicesFromMenuPlanLogic(
      deps,
      'biz-1',
      'import menu',
      { menuText: 'Facial 60min $50' },
      'u1',
    );
    expect(importPlan?.intent).toBe('import_services_from_menu');
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'x', {}),
    ).toBeNull();
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'import', {
        services: [{ serviceName: 'X', durationMinutes: 0, price: -1 }],
      }),
    ).toBeNull();
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'import', {
        services: [{ serviceName: 'Quick', price: 15 }],
      })?.steps,
    ).toHaveLength(1);
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'import', {
        services: [{ name: 'Freebie', durationMinutes: 20 }],
      })?.steps[0].params.price,
    ).toBe(0);
    const fromArray = prepareImportServicesFromMenuPlanLogic(
      deps,
      'biz-1',
      'import',
      {
        services: [{ name: 'Wax', durationMinutes: 20, price: 30 }],
      },
    );
    expect(fromArray?.intent).toBe('import_services_from_menu');
    const fromServiceName = prepareImportServicesFromMenuPlanLogic(
      deps,
      'biz-1',
      'import',
      {
        services: [{ serviceName: 'Polish', durationMinutes: 15, price: 25 }],
      },
    );
    expect(fromServiceName?.steps).toHaveLength(1);
    const prefersServiceName = prepareImportServicesFromMenuPlanLogic(
      deps,
      'biz-1',
      'import',
      {
        services: [
          {
            serviceName: 'Primary',
            name: 'Ignored',
            durationMinutes: 10,
            price: 12,
          },
        ],
      },
    );
    expect(prefersServiceName?.steps[0].params.name).toBe('Primary');
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'import', {
        services: [
          {
            serviceName: null,
            name: 'NullFallback',
            durationMinutes: 10,
            price: 5,
          },
        ],
      })?.steps[0].params.name,
    ).toBe('NullFallback');
    expect(
      prepareImportServicesFromMenuPlanLogic(deps, 'biz-1', 'import', {
        services: [{ durationMinutes: 15, price: 10 }],
      }),
    ).toBeNull();

    const services = [
      { id: 's1', name: 'Massage', price: 100, category: { name: 'Wellness' } },
    ] as any[];
    const pricePlan = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'Raise massage prices 10%',
      {},
      services,
      'u1',
    );
    expect(pricePlan?.intent).toBe('update_service_prices');
    expect(
      prepareUpdateServicePricesPlanLogic(deps, 'biz-1', 'bad', {}, services),
    ).toBeNull();
    const byName = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'adjust',
      { percentChange: 5, serviceName: 'Massage' },
      services,
    );
    expect(byName?.steps[0].params.price).toBe(105);

    // e2e-bug.164 — dollar delta must win over a mis-filled percentChange.
    const byDollars = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'Increase the price of the Massage service by 5 dollars',
      { percentChange: 5, serviceName: 'Massage' },
      [
        {
          id: 's1',
          name: 'Massage',
          price: 20,
          category: { name: 'Wellness' },
        } as any,
      ],
    );
    expect(byDollars?.steps[0].params.price).toBe(25);
    const byCategory = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'Raise all massage prices 10%',
      {},
      [
        {
          id: 's1',
          name: 'Massage',
          price: 100,
          category: { name: 'Massage' },
        } as any,
      ],
    );
    expect(byCategory?.steps).toHaveLength(1);
    expect(
      prepareUpdateServicePricesPlanLogic(
        deps,
        'biz-1',
        'adjust',
        { percentChange: 5, serviceName: 'ZZZZNOTFOUND' },
        services,
      ),
    ).toBeNull();
    const onlyNameHint = prepareUpdateServicePricesPlanLogic(
      deps,
      'biz-1',
      'n/a',
      { percentChange: 10, serviceName: 'Massage' },
      services,
    );
    expect(onlyNameHint?.intent).toBe('update_service_prices');

    const employees = [
      {
        id: 'e1',
        name: 'Senior Anna',
        serviceIds: [],
        metadata: { seniority: 'senior' },
      },
      {
        id: 'e2',
        name: 'Junior Bob',
        serviceIds: ['s1'],
        metadata: { level: 'junior' },
      },
    ] as any[];
    const matrixPlan = prepareStaffServiceMatrixPlanLogic(
      deps,
      'biz-1',
      'Assign all color services to senior stylists only',
      {},
      employees,
      services,
      'u1',
    );
    expect(matrixPlan?.intent).toBe('staff_service_matrix');
    expect(
      prepareStaffServiceMatrixPlanLogic(
        deps,
        'biz-1',
        'matrix',
        {},
        [],
        services,
      ),
    ).toBeNull();
    expect(
      prepareStaffServiceMatrixPlanLogic(
        deps,
        'biz-1',
        'matrix',
        {},
        employees,
        [],
      ),
    ).toBeNull();
    expect(
      prepareStaffServiceMatrixPlanLogic(deps, 'biz-1', 'matrix', {}, [], []),
    ).toBeNull();
    expect(
      prepareUpdateServicePricesPlanLogic(
        deps,
        'biz-1',
        'Raise all massage prices 10%',
        {},
        [],
      ),
    ).toBeNull();
    expect(
      prepareStaffServiceMatrixPlanLogic(
        deps,
        'biz-1',
        'matrix',
        { categoryName: 'Spa' },
        employees,
        services,
      )?.intent,
    ).toBe('staff_service_matrix');
    expect(
      prepareStaffServiceMatrixPlanLogic(
        deps,
        'biz-1',
        'matrix',
        { serviceName: 'Massage' },
        employees,
        services,
      )?.intent,
    ).toBe('staff_service_matrix');
    expect(
      prepareStaffServiceMatrixPlanLogic(
        deps,
        'biz-1',
        'Assign all color services to seniors',
        {},
        employees,
        services,
      )?.intent,
    ).toBe('staff_service_matrix');
  });

  it('summarizes many compliance violations with overflow line', async () => {
    (businessRepo.findOne as jest.Mock).mockResolvedValue({
      settings: { hours: '09:00–19:00' },
    });
    (bookingRepo.find as jest.Mock).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        id: `bk${i}`,
        startTime: new Date('2026-06-02T07:00:00.000Z'),
        endTime: new Date('2026-06-02T08:00:00.000Z'),
        employee: { name: 'Anna' },
        service: { name: 'Massage' },
      })),
    );
    const result = await handleCheckScheduleComplianceLogic(
      deps,
      'biz-1',
      'outside business hours',
      { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    );
    expect(result.summary).toContain('and 2 more');
  });

  it('handles compliance when business settings are missing', async () => {
    (businessRepo.findOne as jest.Mock).mockResolvedValue(null);
    (bookingRepo.find as jest.Mock).mockResolvedValue([]);
    const result = await handleCheckScheduleComplianceLogic(
      deps,
      'biz-1',
      'compliance',
      { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    );
    expect(result.success).toBe(true);
  });

  it('handles compliance violations', async () => {
    (businessRepo.findOne as jest.Mock).mockResolvedValue({
      settings: { hours: { open: '09:00', close: '19:00' } },
    });
    (bookingRepo.find as jest.Mock).mockResolvedValue([
      {
        id: 'bk1',
        startTime: new Date('2026-06-02T07:00:00.000Z'),
        endTime: new Date('2026-06-02T08:00:00.000Z'),
        employee: { name: 'Anna' },
        service: { name: 'Massage' },
      },
    ]);

    const compliance = await handleCheckScheduleComplianceLogic(
      deps,
      'biz-1',
      'outside business hours this month',
      { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    );
    expect(compliance.details.violationCount).toBe(1);
    expect(
      await handleCheckScheduleComplianceLogic(deps, 'biz-1', 'check', {}),
    ).toMatchObject({
      success: false,
    });

    (bookingRepo.find as jest.Mock).mockResolvedValueOnce([
      {
        id: 'bk-null',
        startTime: new Date('2026-06-02T07:00:00.000Z'),
        endTime: new Date('2026-06-02T08:00:00.000Z'),
        employee: null,
        service: null,
      },
    ]);
    const nullNames = await handleCheckScheduleComplianceLogic(
      deps,
      'biz-1',
      'outside hours',
      { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    );
    expect(nullNames.summary).toContain('Provider');
    expect(nullNames.summary).toContain('Service');
  });

  it('handles compliance clean slate and revenue forecast', async () => {
    (businessRepo.findOne as jest.Mock).mockResolvedValue({
      settings: { hours: { open: '09:00', close: '19:00' } },
    });
    (bookingRepo.find as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'bk2',
          startTime: new Date('2026-06-02T10:00:00.000Z'),
          endTime: new Date('2026-06-02T11:00:00.000Z'),
          employee: { name: 'Anna' },
          service: { name: 'Massage' },
        },
      ])
      .mockResolvedValueOnce([
        { status: BookingStatus.COMPLETED, service: { price: 100 } },
      ])
      .mockResolvedValueOnce([
        { status: BookingStatus.COMPLETED },
        { status: BookingStatus.NO_SHOW },
      ])
      .mockResolvedValueOnce([
        { status: BookingStatus.CONFIRMED, service: { price: 50 } },
      ])
      .mockResolvedValueOnce([]);

    const clean = await handleCheckScheduleComplianceLogic(
      deps,
      'biz-1',
      'compliance',
      { dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    );
    expect(clean.summary).toContain('All 1 appointment');

    const forecast = await handleRevenueForecastLogic(
      deps,
      'biz-1',
      'forecast next week revenue',
      { dateFrom: '2026-06-09', dateTo: '2026-06-15' },
    );
    expect(forecast.details.grossRevenue).toBe(100);

    expect(
      await handleRevenueForecastLogic(deps, 'biz-1', 'forecast', {}),
    ).toMatchObject({
      success: false,
    });

    const zeroNoShow = await handleRevenueForecastLogic(
      deps,
      'biz-1',
      'forecast next week',
      { dateFrom: '2026-06-09', dateTo: '2026-06-15' },
    );
    expect(zeroNoShow.details.noShowRatePercent).toBe(0);

    (bookingRepo.find as jest.Mock)
      .mockResolvedValueOnce([
        { status: BookingStatus.CONFIRMED, service: null },
      ])
      .mockResolvedValueOnce([{ status: BookingStatus.COMPLETED }]);
    const noServicePrice = await handleRevenueForecastLogic(
      deps,
      'biz-1',
      'forecast next week',
      { dateFrom: '2026-06-09', dateTo: '2026-06-15' },
    );
    expect(noServicePrice.details.grossRevenue).toBe(0);
  });

  it('filters urgent sick-day bookings only when prompted', async () => {
    (bookingRepo.find as jest.Mock).mockResolvedValue([
      { id: 'bk1', notes: 'urgent', metadata: { urgent: true } },
      { id: 'bk2', notes: '', metadata: {} },
    ]);
    const employees = [
      {
        id: 'e1',
        name: 'Maria',
        serviceIds: [],
        metadata: {},
        isActive: true,
      } as any,
    ];
    const urgentPlan = await prepareSickDayReplanPlanLogic(
      deps,
      'biz-1',
      'Maria is sick redistribute urgent bookings today',
      { employeeName: 'Maria', date: '2026-06-02' },
      employees,
      'UTC',
    );
    expect(
      urgentPlan?.steps.find((s) => s.action === 'cancel_bookings')?.params
        .bookingIds,
    ).toEqual(['bk1']);

    const allPlan = await prepareSickDayReplanPlanLogic(
      deps,
      'biz-1',
      'Maria is sick cancel her day today',
      { employeeName: 'Maria', date: '2026-06-02' },
      employees,
      'UTC',
    );
    expect(
      allPlan?.steps.find((s) => s.action === 'cancel_bookings')?.params
        .bookingIds,
    ).toEqual(['bk1', 'bk2']);
  });

  it('applies payment sweep filters and executes plans', async () => {
    const result = applyPaymentSweepFilters(
      'except walk-ins completed today',
      {},
      [
        { customerId: null, status: BookingStatus.COMPLETED },
        { customerId: 'c1', status: BookingStatus.COMPLETED },
      ],
    );
    expect(result.bookings).toHaveLength(1);
    expect(result.params.excludeWalkIns).toBe(true);

    const executed = await executeOperationsPlan(
      { orchestration },
      {
        id: 'p1',
        intent: 'no_show_recovery',
        steps: [],
        businessId: 'biz-1',
      } as any,
      'biz-1',
      'u1',
    );
    expect(executed.action).toBe('no_show_recovery');

    // e2e-bug.164 — pending policy approval must be auto-approved for price updates
    // once the AI confirmation gate has already authorized execution.
    orchestration.executePlan.mockResolvedValueOnce({
      success: true,
      action: 'update_service_prices',
      summary: 'planned',
      requiresApproval: true,
      taskId: 'task-price-1',
    });
    const priceExecuted = await executeOperationsPlan(
      { orchestration },
      {
        id: 'p2',
        intent: 'update_service_prices',
        steps: [],
        businessId: 'biz-1',
      } as any,
      'biz-1',
      'u1',
    );
    expect(orchestration.approveTask).toHaveBeenCalledWith(
      'task-price-1',
      'u1',
    );
    expect(priceExecuted.summary).toBe('approved-and-executed');
  });
});
