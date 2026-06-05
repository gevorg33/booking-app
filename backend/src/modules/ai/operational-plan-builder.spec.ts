import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';

describe('OperationalPlanBuilderService', () => {
  const builder = new OperationalPlanBuilderService();

  it('buildDayReplanPlan includes conflict detection and auto-apply steps', () => {
    const plan = builder.buildDayReplanPlan({
      businessId: 'biz-1',
      date: '2026-05-26',
      userId: 'user-1',
    });

    const actions = plan.steps.map((s) => s.action);
    expect(actions).toEqual([
      'fetch_current_schedule',
      'detect_conflicts',
      'analyze_resolution_options',
      'propose_resolutions',
      'apply_conflict_resolutions',
      'identify_schedule_gaps',
      'generate_optimization_recommendations',
    ]);
    expect(plan.intent).toBe('day_replan');
  });

  it('buildUpdateBookingsPlan tags no-show mutations', () => {
    const plan = builder.buildUpdateBookingsPlan({
      businessId: 'biz-1',
      bookingIds: ['b1', 'b2'],
      status: 'no_show',
      userId: 'user-1',
      label: 'Mark 2 as no-show',
    });

    expect(plan.intent).toBe('mark_no_shows');
    expect(plan.steps[0].action).toBe('update_bookings');
  });

  it('buildUpdateBookingsPlan tags payment sweep mutations', () => {
    const plan = builder.buildUpdateBookingsPlan({
      businessId: 'biz-1',
      bookingIds: ['b1'],
      paymentStatus: 'paid',
      userId: 'user-1',
      label: 'Mark unpaid as paid',
    });

    expect(plan.intent).toBe('payment_sweep');
  });
});
