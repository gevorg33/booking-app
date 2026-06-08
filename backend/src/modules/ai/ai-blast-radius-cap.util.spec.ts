import {
  assessBlastRadius,
  buildBlastRadiusCapGateResult,
  buildBlastRadiusConfirmResult,
  buildBlastRadiusExecuteSummary,
  evaluateBlastRadiusFromParams,
  evaluateBlastRadiusFromPlan,
  validateBlastRadiusAtExecute,
} from './ai-blast-radius-cap.util.js';
import {
  BLAST_RADIUS_EXECUTE_SCENARIOS,
  BLAST_RADIUS_PARAM_SCENARIOS,
  BLAST_RADIUS_PLAN_SCENARIOS,
} from './ai-blast-radius-cap.fixtures.js';

describe('ai-blast-radius-cap.util (acc-5.7)', () => {
  it.each(BLAST_RADIUS_PARAM_SCENARIOS)('$id evaluateBlastRadiusFromParams', (scenario) => {
    const assessment = evaluateBlastRadiusFromParams(scenario.action, scenario.params);
    expect(assessment.exceedsCap).toBe(scenario.expectExceeds);
  });

  it.each(BLAST_RADIUS_PLAN_SCENARIOS)('$id evaluateBlastRadiusFromPlan', (scenario) => {
    const assessment = evaluateBlastRadiusFromPlan(scenario.plan);
    expect(assessment.exceedsCap).toBe(scenario.expectExceeds);
    if (scenario.expectBookingCount != null) {
      expect(assessment.bookingCount).toBe(scenario.expectBookingCount);
    }
  });

  it.each(BLAST_RADIUS_EXECUTE_SCENARIOS)(
    '$id validateBlastRadiusAtExecute',
    (scenario) => {
      const plan = BLAST_RADIUS_PLAN_SCENARIOS[0]!.plan;
      const result = validateBlastRadiusAtExecute({
        action: 'cancel_bookings',
        params: scenario.params,
        plan,
        confirmed: scenario.confirmed,
      });
      expect(result.ok).toBe(scenario.expectOk);
      if (!scenario.expectOk) {
        expect(result.requiresConfirm).toBe(true);
        expect(result.summary.toLowerCase()).toContain('safe limits');
      }
    },
  );

  it('assessBlastRadius merges params and plan counts', () => {
    const assessment = assessBlastRadius({
      action: 'cancel_bookings',
      params: { bookingIds: ['a', 'b'] },
      plan: BLAST_RADIUS_PLAN_SCENARIOS[0]!.plan,
    });
    expect(assessment.bookingCount).toBe(30);
    expect(assessment.exceedsCap).toBe(true);
  });

  it('buildBlastRadiusCapGateResult returns null when confirmed', () => {
    expect(
      buildBlastRadiusCapGateResult({
        prompt: 'cancel all',
        action: 'cancel_bookings',
        params: { bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`) },
        confirmed: true,
      }),
    ).toBeNull();
  });

  it('does not treat allProviders on availability reads as blast radius', () => {
    const assessment = evaluateBlastRadiusFromParams('check_availability', {
      allProviders: true,
      serviceName: 'Permanent lashes',
      date: '2026-06-09',
    });
    expect(assessment.exceedsCap).toBe(false);
    expect(assessment.providerCount).toBe(0);
  });

  it('buildBlastRadiusConfirmResult wires high-risk confirm clarify', () => {
    const assessment = evaluateBlastRadiusFromParams('cancel_bookings', {
      bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`),
    });
    const result = buildBlastRadiusConfirmResult({
      prompt: 'cancel 30',
      action: 'cancel_bookings',
      params: { bookingIds: ['bk-1'] },
      assessment,
    });
    expect(result.details?.clarifySource).toBe('blast_radius_cap');
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
  });

  it('buildBlastRadiusExecuteSummary mentions violations', () => {
    const assessment = evaluateBlastRadiusFromParams('clear_schedule', {
      employeeIds: ['1', '2', '3', '4', '5', '6'],
    });
    expect(buildBlastRadiusExecuteSummary(assessment)).toContain('providers');
  });
});
