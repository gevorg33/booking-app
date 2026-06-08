import {
  buildClarifyFieldContext,
  fieldSatisfiedForClarify,
  filterTargetedClarifyIssues,
} from './ai-targeted-clarify.util.js';
import { TARGETED_SLOT_CLARIFY_SCENARIOS } from './ai-smart-clarify.fixtures.js';
import { buildTargetedSlotClarify } from './ai-smart-clarify.util.js';

describe('ai-targeted-clarify.util (acc-4.1)', () => {
  it.each(TARGETED_SLOT_CLARIFY_SCENARIOS)(
    '$id asks only missing fields',
    (scenario) => {
      const clarify = buildTargetedSlotClarify({
        prompt: scenario.prompt,
        surface: scenario.surface,
        action: scenario.action,
        params: scenario.params,
        sessionContext: scenario.sessionContext,
        confidence: 0.82,
        resolved: scenario.resolved
          ? {
              action: scenario.action,
              prompt: scenario.prompt,
              businessId: 'biz-1',
              params: scenario.resolved.params,
              enrichedParams: scenario.resolved.enrichedParams,
              entities: scenario.resolved.entities,
              reasoning: 'test',
            }
          : undefined,
        phase: 'late',
      });

      if (!scenario.expectClarify) {
        expect(clarify).toBeNull();
        return;
      }

      expect(clarify).not.toBeNull();
      const missingFields = (clarify?.details.missing ?? []).map((row) => row.field);
      for (const field of scenario.expectMissingFields) {
        expect(missingFields).toContain(field);
      }
      for (const field of scenario.expectSkippedFields) {
        expect(missingFields).not.toContain(field);
      }
    },
  );

  it('fieldSatisfiedForClarify honors clarify memory', () => {
    expect(
      fieldSatisfiedForClarify('date', {
        params: {},
        clarifyMemory: { date: '2026-06-08' },
      }),
    ).toBe(true);
  });

  it('filterTargetedClarifyIssues removes resolved entity fields', () => {
    const filtered = filterTargetedClarifyIssues(
      [
        {
          field: 'serviceName',
          label: 'Service',
          message: 'Which service?',
        },
        { field: 'date', label: 'Date', message: 'Which date?' },
      ],
      buildClarifyFieldContext({
        params: { employeeName: 'Gevorg', timeSlot: '10:00' },
        resolved: {
          action: 'create_booking',
          prompt: 'book',
          businessId: 'b1',
          params: {},
          enrichedParams: { serviceId: 'svc-1', serviceName: 'Massage' },
          entities: { service: { id: 'svc-1' } },
          reasoning: 'x',
        },
      }),
    );
    expect(filtered.map((row) => row.field)).toEqual(['date']);
  });
});
