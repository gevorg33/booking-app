import {
  buildImportServicesReviewPlanMeta,
  buildImportServicesReviewPlanSteps,
  buildNoShowRecoveryPlanMeta,
  buildNoShowRecoveryPlanSteps,
  buildSickDayReplanPlanMeta,
  buildSickDayReplanPlanSteps,
  buildStaffServiceMatrixPlanMeta,
  buildStaffServiceMatrixPlanSteps,
  buildUpdateServicePricesPlanMeta,
  buildUpdateServicePricesPlanSteps,
} from './ai-operations-plan.util.js';

describe('ai-operations-plan.util', () => {
  const idFactory = (() => {
    let n = 0;
    return () => `step-${++n}`;
  })();

  it('builds no-show recovery plan steps', () => {
    const steps = buildNoShowRecoveryPlanSteps({
      businessId: 'b1',
      bookingIds: ['bk1', 'bk2'],
      userId: 'u1',
      date: '2026-06-02',
      dateRange: { start: '2026-06-01', end: '2026-06-03' },
      idFactory,
    });
    expect(steps).toHaveLength(4);
    expect(steps[0].action).toBe('mark_no_shows');
    expect(steps[1].params.includeNoShows).toBe(true);
    expect(steps[3].action).toBe('propose_reassignment');
    expect(buildNoShowRecoveryPlanMeta(2).requiresApproval).toBe(true);
    expect(buildNoShowRecoveryPlanMeta(10).risk.level).toBe('medium');
  });

  it('builds sick-day replan plan steps', () => {
    const withBookings = buildSickDayReplanPlanSteps({
      businessId: 'b1',
      employeeId: 'e1',
      employeeName: 'Maria',
      date: '2026-06-02',
      bookingIds: ['bk1'],
      userId: 'u1',
      idFactory,
    });
    expect(withBookings.some((s) => s.action === 'cancel_bookings')).toBe(true);
    expect(withBookings.some((s) => s.action === 'block_schedule')).toBe(true);
    expect(withBookings.at(-1)?.dependsOn?.length).toBe(1);

    const empty = buildSickDayReplanPlanSteps({
      businessId: 'b1',
      employeeId: 'e1',
      employeeName: 'Maria',
      date: '2026-06-02',
      bookingIds: [],
      idFactory,
    });
    expect(empty).toHaveLength(1);
    expect(empty[0].action).toBe('block_schedule');
    expect(
      buildSickDayReplanPlanMeta({
        employeeName: 'Maria',
        date: '2026-06-02',
        bookingCount: 1,
      }).requiresApproval,
    ).toBe(true);
    expect(
      buildSickDayReplanPlanMeta({
        employeeName: 'Maria',
        date: '2026-06-02',
        bookingCount: 5,
      }).risk.level,
    ).toBe('high');
  });

  it('builds price update and staff matrix plans', () => {
    const priceSteps = buildUpdateServicePricesPlanSteps({
      businessId: 'b1',
      updates: [
        {
          serviceId: 's1',
          serviceName: 'Massage',
          currentPrice: 100,
          newPrice: 110,
        },
      ],
      userId: 'u1',
      effectiveFrom: '2026-06-01',
      idFactory,
    });
    expect(priceSteps[0].action).toBe('update_service');
    expect(priceSteps[0].params.effectiveFrom).toBe('2026-06-01');
    expect(
      buildUpdateServicePricesPlanMeta({
        updates: [
          {
            serviceId: 's1',
            serviceName: 'Massage',
            currentPrice: 100,
            newPrice: 110,
          },
        ],
        percentChange: 10,
        effectiveFrom: '2026-06-01',
      }).reasoning,
    ).toContain('10%');
    expect(
      buildUpdateServicePricesPlanMeta({
        updates: Array.from({ length: 11 }, (_, i) => ({
          serviceId: `s${i}`,
          serviceName: `S${i}`,
          currentPrice: 10,
          newPrice: 11,
        })),
        percentChange: 10,
      }).risk.level,
    ).toBe('high');

    const matrixSteps = buildStaffServiceMatrixPlanSteps({
      businessId: 'b1',
      seniorAssignments: [
        { employeeId: 'e1', employeeName: 'Anna', serviceIds: ['s1'] },
      ],
      juniorAssignments: [
        { employeeId: 'e2', employeeName: 'Bob', serviceIds: [] },
      ],
      serviceNames: ['Color'],
      userId: 'u1',
      idFactory,
    });
    expect(matrixSteps).toHaveLength(2);
    expect(
      buildStaffServiceMatrixPlanMeta({
        serviceNames: ['Color'],
        seniorCount: 1,
        juniorCount: 1,
      }).risk.level,
    ).toBe('medium');
  });

  it('builds import services review plan', () => {
    const steps = buildImportServicesReviewPlanSteps({
      businessId: 'b1',
      services: [
        {
          name: 'Facial',
          durationMinutes: 60,
          price: 50,
          description: 'x',
          currency: 'EUR',
        },
      ],
      userId: 'u1',
      idFactory,
    });
    expect(steps[0].action).toBe('create_service');
    expect(steps[0].params.currency).toBe('EUR');
    expect(buildImportServicesReviewPlanMeta(1).requiresApproval).toBe(true);
    expect(buildImportServicesReviewPlanMeta(15).risk.level).toBe('high');
    expect(buildImportServicesReviewPlanMeta(3).risk.level).toBe('medium');
  });

  it('uses default id factory when omitted', () => {
    const steps = buildNoShowRecoveryPlanSteps({
      businessId: 'b1',
      bookingIds: ['bk1'],
    });
    expect(steps[0].id).toBeTruthy();
    const sick = buildSickDayReplanPlanSteps({
      businessId: 'b1',
      employeeId: 'e1',
      employeeName: 'Maria',
      date: '2026-06-02',
      bookingIds: ['bk1'],
    });
    expect(sick.length).toBeGreaterThan(1);
    const importSteps = buildImportServicesReviewPlanSteps({
      businessId: 'b1',
      services: [{ name: 'Facial', durationMinutes: 60, price: 50 }],
    });
    expect(importSteps[0].params.currency).toBe('USD');
  });
});
