import {
  STRUCTURAL_ENRICH_PIPE_MARKER,
  STRUCTURAL_ENRICH_SCENARIOS,
} from './ai-intent-structural-enrich.fixtures.js';
import {
  applyStructuralIntentEnrichment,
  readStructuralEnrichHints,
  STRUCTURAL_DATE_RANGE_ACTIONS,
  STRUCTURAL_ENRICH_PIPE_MARKER as UTIL_MARKER,
  summarizeStructuralEnrichTrace,
} from './ai-intent-structural-enrich.util.js';

describe('ai-intent-structural-enrich.util (pipe-1.7.1 / pipe-1.7.2)', () => {
  it('exports pipe marker and date-range action set', () => {
    expect(STRUCTURAL_ENRICH_PIPE_MARKER).toBe('pipe-1.7.1');
    expect(UTIL_MARKER).toBe('pipe-1.7.1');
    expect(STRUCTURAL_DATE_RANGE_ACTIONS.has('clear_schedule')).toBe(true);
    expect(STRUCTURAL_DATE_RANGE_ACTIONS.has('create_booking')).toBe(false);
  });

  it.each(STRUCTURAL_ENRICH_SCENARIOS)(
    'applyStructuralIntentEnrichment $id',
    (scenario) => {
      const result = applyStructuralIntentEnrichment(
        {
          action: scenario.action,
          params: { ...(scenario.params ?? {}) },
          reasoning: 'test',
          confidence: 0.8,
        },
        {
          prompt: scenario.prompt,
          timeZone: scenario.timeZone ?? 'UTC',
          employees: scenario.employees,
          sessionContext: scenario.sessionContext,
        },
      );

      if (scenario.expectUnchanged) {
        expect(result.params).toEqual(scenario.params ?? {});
        return;
      }

      if (scenario.expectDateRange) {
        expect(result.params.dateFrom).toBeTruthy();
        expect(result.params.dateTo).toBeTruthy();
      }
      if (scenario.expectPeriods) {
        expect(Array.isArray(result.params.periods)).toBe(true);
        expect((result.params.periods as unknown[]).length).toBeGreaterThan(0);
      }
      if (scenario.expectWorkTimeDefault !== undefined) {
        const hints = readStructuralEnrichHints(result.params ?? {});
        expect(hints?.workTimeDefault).toBe(scenario.expectWorkTimeDefault);
      }
      if (scenario.expectPeriodStart) {
        const periods = result.params.periods as Array<{
          startTime: string;
          endTime: string;
        }>;
        expect(periods[0]?.startTime).toBe(scenario.expectPeriodStart);
        expect(periods[0]?.endTime).toBe(scenario.expectPeriodEnd);
      }
      if (scenario.expectEmployeeName) {
        expect(result.params.employeeName).toBe(scenario.expectEmployeeName);
      }
      if (scenario.expectEmployeeNames) {
        expect(
          (result.params.employeeNames as string[] | undefined)?.slice().sort(),
        ).toEqual(scenario.expectEmployeeNames.slice().sort());
      }
      if (scenario.expectTimeOfDay) {
        expect(result.params.timeOfDay).toBe(scenario.expectTimeOfDay);
      }
    },
  );

  it('summarizeStructuralEnrichTrace lists active enrichers', () => {
    expect(
      summarizeStructuralEnrichTrace({
        dateRange: true,
        periods: false,
        workTimeDefault: true,
        employees: true,
        availabilityFollowUp: false,
      }),
    ).toBe('dateRange, workTimeDefault, employees');
    expect(
      summarizeStructuralEnrichTrace({
        dateRange: false,
        periods: false,
        workTimeDefault: false,
        employees: false,
        availabilityFollowUp: false,
      }),
    ).toBe('no-op');
  });

  it('readStructuralEnrichHints returns trace metadata', () => {
    const enriched = applyStructuralIntentEnrichment(
      {
        action: 'create_direct_schedule',
        params: {},
        reasoning: 'test',
        confidence: 0.8,
      },
      {
        prompt: 'Create work time for Gevorg tomorrow 9-19',
        employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      },
    );
    const hints = readStructuralEnrichHints(enriched.params ?? {});
    expect(hints?.periods).toBe(true);
    expect(hints?.employees).toBe(true);
  });
});
