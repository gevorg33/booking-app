import {
  WORK_TIME_DEFAULT_PIPE_MARKER,
  WORK_TIME_DEFAULT_SCENARIOS,
} from './ai-intent-structural-enrich-work-time.fixtures.js';
import {
  applyDefaultWorkTimeSchedulePeriods,
  DEFAULT_WORK_TIME_PERIOD_FROM,
  DEFAULT_WORK_TIME_PERIOD_TO,
  shouldApplyDefaultWorkTimePeriods,
  WORK_TIME_DEFAULT_PIPE_MARKER as UTIL_MARKER,
} from './ai-intent-structural-enrich-work-time.util.js';

describe('ai-intent-structural-enrich-work-time.util (pipe-1.7.2)', () => {
  it('exports pipe marker and default window', () => {
    expect(WORK_TIME_DEFAULT_PIPE_MARKER).toBe('pipe-1.7.2');
    expect(UTIL_MARKER).toBe('pipe-1.7.2');
    expect(DEFAULT_WORK_TIME_PERIOD_FROM).toBe('09:00');
    expect(DEFAULT_WORK_TIME_PERIOD_TO).toBe('19:00');
  });

  it.each(WORK_TIME_DEFAULT_SCENARIOS)(
    'shouldApplyDefaultWorkTimePeriods $id',
    (scenario) => {
      expect(
        shouldApplyDefaultWorkTimePeriods(
          { ...(scenario.params ?? {}) },
          scenario.prompt,
        ),
      ).toBe(scenario.expectAppliedDefault);
    },
  );

  it.each(WORK_TIME_DEFAULT_SCENARIOS)(
    'applyDefaultWorkTimeSchedulePeriods $id',
    (scenario) => {
      const params = { ...(scenario.params ?? {}) };
      const result = applyDefaultWorkTimeSchedulePeriods(params, scenario.prompt);

      expect(result.appliedDefault).toBe(scenario.expectAppliedDefault);
      expect(params.timeFrom).toBe(scenario.expectTimeFrom);
      expect(params.timeTo).toBe(scenario.expectTimeTo);
      expect(result.periods[0]?.startTime).toBe(scenario.expectPeriodStart);
      if (scenario.expectPeriodEnd) {
        expect(result.periods[0]?.endTime).toBe(scenario.expectPeriodEnd);
      }
    },
  );
});
