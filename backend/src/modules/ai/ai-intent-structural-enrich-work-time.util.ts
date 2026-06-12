import {
  hasExplicitTimeWindow,
  inferDirectSchedulePeriods,
  parseTimeWindow,
} from './ai-orchestration.helpers.js';
import { WORK_TIME_DEFAULT_PIPE_MARKER } from './ai-intent-structural-enrich-work-time.fixtures.js';

export { WORK_TIME_DEFAULT_PIPE_MARKER };

/** Default service block when create_direct_schedule has no hours in prompt (pipe-1.7.2). */
export const DEFAULT_WORK_TIME_PERIOD_FROM = '09:00';
export const DEFAULT_WORK_TIME_PERIOD_TO = '19:00';

export type WorkTimePeriodEnrichResult = {
  periods: Array<Record<string, unknown>>;
  appliedDefault: boolean;
};

/** True when prompt/params lack an explicit daily time window. */
export function shouldApplyDefaultWorkTimePeriods(
  params: Record<string, unknown>,
  prompt: string,
): boolean {
  return !hasExplicitTimeWindow(
    {
      timeFrom: params.timeFrom as string | null | undefined,
      timeTo: params.timeTo as string | null | undefined,
    },
    prompt,
  );
}

/**
 * Apply 09:00–19:00 work-time periods for create_direct_schedule when no hours
 * are present in prompt or params (pipe-1.7.2).
 */
export function applyDefaultWorkTimeSchedulePeriods(
  params: Record<string, unknown>,
  prompt: string,
): WorkTimePeriodEnrichResult {
  const appliedDefault = shouldApplyDefaultWorkTimePeriods(params, prompt);

  if (appliedDefault) {
    if (!params.timeFrom) params.timeFrom = DEFAULT_WORK_TIME_PERIOD_FROM;
    if (!params.timeTo) params.timeTo = DEFAULT_WORK_TIME_PERIOD_TO;
  } else {
    const window = parseTimeWindow(
      {
        timeFrom: params.timeFrom as string | null | undefined,
        timeTo: params.timeTo as string | null | undefined,
      },
      prompt,
    );
    params.timeFrom = window.timeFrom;
    params.timeTo = window.timeTo;
  }

  const periods = inferDirectSchedulePeriods(params, prompt);

  return { periods, appliedDefault };
}
