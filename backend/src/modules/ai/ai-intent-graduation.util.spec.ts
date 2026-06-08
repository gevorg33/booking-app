import {
  buildIntentGraduationStatus,
  buildIntentTrafficFromCommandMetrics,
  buildIntentTrafficFromTraceAnalytics,
  buildProposeOnlySummary,
  isIntentGraduatedForAutoExecute,
  requiresProposeOnlyExecution,
  resolveGraduatedAutoExecute,
  resolveIntentGraduationThresholds,
  validateIntentGraduationAtExecute,
} from './ai-intent-graduation.util.js';
import {
  INTENT_GRADUATION_SCENARIOS,
  INTENT_TRAFFIC_BUILD_SCENARIOS,
} from './ai-intent-graduation.fixtures.js';

describe('ai-intent-graduation.util (acc-5.8)', () => {
  it.each(INTENT_GRADUATION_SCENARIOS)('$id graduation rules', (scenario) => {
    expect(
      requiresProposeOnlyExecution(scenario.action, scenario.traffic, {
        minSamples: 20,
        minAccuracy: scenario.confidenceHigh ?? 0.85,
      }),
    ).toBe(scenario.expectProposeOnly);
    expect(
      isIntentGraduatedForAutoExecute(scenario.action, scenario.traffic, {
        minSamples: 20,
        minAccuracy: scenario.confidenceHigh ?? 0.85,
      }),
    ).toBe(scenario.expectGraduated);
  });

  it.each(INTENT_TRAFFIC_BUILD_SCENARIOS)(
    '$id builds intent traffic index',
    (scenario) => {
      if (scenario.id === 'trace-analytics') {
        const fromTrace = buildIntentTrafficFromTraceAnalytics(
          scenario.input as Record<string, { total: number; accurate: number }>,
        );
        expect(fromTrace.payment_sweep?.samples).toBe(scenario.expect.samples);
        expect(fromTrace.payment_sweep?.accurateRate).toBeCloseTo(
          scenario.expect.accurateRate,
          5,
        );
        return;
      }

      const stats = scenario.input.payment_sweep as {
        total: number;
        success: number;
      };
      const fromCommands = buildIntentTrafficFromCommandMetrics({
        payment_sweep: { total: stats.total, success: stats.success },
      });
      expect(fromCommands.payment_sweep?.samples).toBe(scenario.expect.samples);
      expect(fromCommands.payment_sweep?.accurateRate).toBeCloseTo(
        scenario.expect.accurateRate,
        5,
      );
    },
  );

  it('resolveIntentGraduationThresholds uses ai-e5 confidenceHigh when provided', () => {
    expect(resolveIntentGraduationThresholds({ confidenceHigh: 0.9 })).toEqual({
      minSamples: 20,
      minAccuracy: 0.9,
    });
  });

  it('buildProposeOnlySummary explains remaining bar', () => {
    const summary = buildProposeOnlySummary(
      buildIntentGraduationStatus({
        action: 'payment_sweep',
        traffic: { samples: 8, accurateRate: 0.75 },
      }),
    );
    expect(summary.toLowerCase()).toContain('propose-only');
    expect(summary).toContain('8/20');
  });

  it('validateIntentGraduationAtExecute blocks auto execute until approved', () => {
    const blocked = validateIntentGraduationAtExecute({
      action: 'payment_sweep',
      autoExecutePath: true,
    });
    expect(blocked.ok).toBe(false);

    const approved = validateIntentGraduationAtExecute({
      action: 'payment_sweep',
      autoExecutePath: true,
      planApproved: true,
    });
    expect(approved.ok).toBe(true);
  });

  it('resolveGraduatedAutoExecute blocks auto until graduation', () => {
    expect(
      resolveGraduatedAutoExecute({
        action: 'payment_sweep',
        autoExecute: true,
      }),
    ).toBe(false);
    expect(
      resolveGraduatedAutoExecute({
        action: 'payment_sweep',
        autoExecute: true,
        context: {
          _intentTraffic: {
            payment_sweep: { samples: 25, accurateRate: 0.9 },
          },
        },
      }),
    ).toBe(true);
  });
});
