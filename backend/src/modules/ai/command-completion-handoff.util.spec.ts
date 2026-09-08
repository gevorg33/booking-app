import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import {
  COMPLETION_HANDOFF_SCENARIOS,
  COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER,
} from './command-completion-handoff.fixtures.js';
import {
  runCompletionValidateHandoff,
  shouldRunCompletionValidate,
} from './command-completion-handoff.util.js';
import type { BusinessCatalog } from './command-completion.types.js';

const pipeline = new CommandCompletionPipelineService();

const catalog: BusinessCatalog = {
  employees: [
    { id: 'e1', name: 'Gevorg Gasparyan' } as BusinessCatalog['employees'][0],
  ],
  services: [{ id: 's1', name: 'Haircut' } as BusinessCatalog['services'][0]],
  customers: [],
  templates: [],
};

describe('command-completion-handoff.util (pipe-1.8.2)', () => {
  it('exports pipe marker', () => {
    expect(COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER).toBe('pipe-1.8.2');
  });

  it.each(COMPLETION_HANDOFF_SCENARIOS)(
    'shouldRunCompletionValidate $id',
    (scenario) => {
      expect(shouldRunCompletionValidate(scenario.action)).toBe(
        scenario.expectValidate,
      );
    },
  );

  it.each(COMPLETION_HANDOFF_SCENARIOS)(
    'runCompletionValidateHandoff $id',
    (scenario) => {
      const outcome = runCompletionValidateHandoff(
        {
          businessId: 'biz-1',
          prompt: scenario.prompt,
          classified: {
            action: scenario.action,
            params: scenario.params,
            reasoning: 'fixture',
          },
          catalog,
          timeZone: 'UTC',
        },
        pipeline,
      );

      if (scenario.expectClarify) {
        expect(outcome.status).toBe('clarify');
        if (outcome.status === 'clarify') {
          expect(outcome.result.success).toBe(false);
          expect(outcome.result.details.needsClarification).toBe(true);
          expect(outcome.result.details.pipeMarker).toBe('pipe-1.8.2');
          expect(outcome.trace.some((t) => t.stage === 'validate')).toBe(true);
          for (const field of scenario.expectedMissingFields ?? []) {
            expect(
              outcome.result.details.missing?.some((i) => i.field === field),
            ).toBe(true);
          }
        }
        return;
      }

      expect(outcome.status).toBe('ready');
      if (outcome.status === 'ready') {
        expect(outcome.resolved.action).toBe(scenario.action);
        expect(outcome.trace.some((t) => t.stage === 'resolve')).toBe(true);
        if (scenario.expectValidate) {
          expect(outcome.trace.some((t) => t.stage === 'validate')).toBe(true);
        } else {
          expect(outcome.trace.some((t) => t.stage === 'validate')).toBe(false);
        }
      }
    },
  );

  it('merges clarifyExtras into validation clarify result', () => {
    const outcome = runCompletionValidateHandoff(
      {
        businessId: 'biz-1',
        prompt: 'Book Gevorg tomorrow at 9',
        classified: {
          action: 'create_booking',
          params: {
            employeeName: 'Gevorg Gasparyan',
            date: '2026-06-15',
            timeSlot: '09:00',
          },
          reasoning: 'fixture',
        },
        catalog,
        timeZone: 'UTC',
        clarifyExtras: { compoundStep: 'create_booking' },
      },
      pipeline,
    );

    expect(outcome.status).toBe('clarify');
    if (outcome.status === 'clarify') {
      expect(outcome.result.details.compoundStep).toBe('create_booking');
    }
  });

  it('appends priorTrace before resolve/validate stages', () => {
    const priorTrace = [
      {
        stage: 'classify' as const,
        action: 'create_booking',
        at: '2026-06-01T00:00:00.000Z',
      },
    ];
    const outcome = runCompletionValidateHandoff(
      {
        businessId: 'biz-1',
        prompt: 'Book Anna for a haircut tomorrow at 3pm',
        classified: {
          action: 'create_booking',
          params: {
            employeeName: 'Gevorg Gasparyan',
            serviceName: 'Haircut',
            date: '2026-06-15',
            timeSlot: '15:00',
          },
          reasoning: 'fixture',
        },
        catalog,
        timeZone: 'UTC',
        priorTrace,
      },
      pipeline,
    );

    expect(outcome.status).toBe('ready');
    if (outcome.status === 'ready') {
      expect(outcome.trace[0]).toEqual(priorTrace[0]);
      expect(outcome.trace[1]?.stage).toBe('resolve');
    }
  });
});
