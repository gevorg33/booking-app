import {
  PIPELINE_MUTATING_GUARD_SCENARIOS,
  PIPELINE_MUTATING_ACTIONS_PIPE_MARKER,
  PIPELINE_SCHEDULE_RESOLVED_INTENTS,
} from './command-pipeline-mutating-actions.fixtures.js';
import {
  DASHBOARD_PIPELINE_MUTATING_ACTIONS,
  isDashboardPipelineMutatingAction,
  isPipelineScheduleResolvedIntent,
  shouldBlockLowConfidencePipelineMutate,
} from './command-pipeline-mutating-actions.util.js';

describe('command-pipeline-mutating-actions.util (pipe-1.9.1)', () => {
  it('exports pipe marker', () => {
    expect(PIPELINE_MUTATING_ACTIONS_PIPE_MARKER).toBe('pipe-1.9.1');
  });

  it('includes create_direct_schedule in dashboard mutating actions', () => {
    expect(
      DASHBOARD_PIPELINE_MUTATING_ACTIONS.has('create_direct_schedule'),
    ).toBe(true);
    expect(isDashboardPipelineMutatingAction('create_direct_schedule')).toBe(
      true,
    );
  });

  it.each(PIPELINE_SCHEDULE_RESOLVED_INTENTS)(
    'pipeline schedule intent %s is mutating',
    (action) => {
      expect(isPipelineScheduleResolvedIntent(action)).toBe(true);
      expect(isDashboardPipelineMutatingAction(action)).toBe(true);
    },
  );

  it.each(PIPELINE_MUTATING_GUARD_SCENARIOS)(
    'shouldBlockLowConfidencePipelineMutate $id',
    (scenario) => {
      expect(
        shouldBlockLowConfidencePipelineMutate(
          scenario.action,
          scenario.confidence,
          scenario.lowThreshold,
        ),
      ).toBe(scenario.expectBlock);
    },
  );
});
