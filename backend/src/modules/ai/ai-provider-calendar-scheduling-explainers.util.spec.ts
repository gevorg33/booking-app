import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS,
} from './ai-provider-calendar-scheduling-explainers.fixtures.js';
import {
  buildExplainBlockVsTimeOffSummary,
  buildExplainCalendarUtilizationBandsSummary,
  isExplainBlockVsTimeOffPrompt,
  isExplainCalendarUtilizationBandsPrompt,
  rescueCalendarSchedulingExplainersIntent,
} from './ai-provider-calendar-scheduling-explainers.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-calendar-scheduling-explainers.util (e2e-bug.245 / ai-cmd-provider-5.23.2–5.23.4)', () => {
  it('registers both explainers on provider surface', () => {
    expect(
      isIntentAllowedOnSurface(
        'explain_calendar_utilization_bands',
        'provider',
      ),
    ).toBe(true);
    expect(
      isIntentAllowedOnSurface('explain_block_vs_time_off', 'provider'),
    ).toBe(true);
  });

  it.each(
    PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects utilization-bands explainer %s', (_id, prompt) => {
    expect(isExplainCalendarUtilizationBandsPrompt(prompt as string)).toBe(
      true,
    );
    expect(isExplainBlockVsTimeOffPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects block-vs-time-off explainer %s', (_id, prompt) => {
    expect(isExplainBlockVsTimeOffPrompt(prompt as string)).toBe(true);
    expect(isExplainCalendarUtilizationBandsPrompt(prompt as string)).toBe(
      false,
    );
  });

  it.each(
    PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_calendar_utilization_bands', (_id, prompt) => {
    expect(
      rescueCalendarSchedulingExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_calendar_utilization_bands',
      rescueReason: 'explain_calendar_utilization_bands',
    });
  });

  it.each(
    PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_block_vs_time_off', (_id, prompt) => {
    expect(
      rescueCalendarSchedulingExplainersIntent(prompt as string, 'unknown'),
    ).toEqual({
      action: 'explain_block_vs_time_off',
      rescueReason: 'explain_block_vs_time_off',
    });
  });

  it.each([
    ['summarize-util', 'How busy am I this month?'],
    ['calendar-month', 'Show me my calendar for this month'],
    ['block-my-time', 'Block my lunch from 12 to 1'],
    ['request-time-off', 'Request time off next Friday'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isExplainCalendarUtilizationBandsPrompt(prompt)).toBe(false);
    expect(isExplainBlockVsTimeOffPrompt(prompt)).toBe(false);
    expect(
      rescueCalendarSchedulingExplainersIntent(prompt, 'unknown'),
    ).toBeNull();
  });

  it('builds summaries with required vocabulary', () => {
    const bands = buildExplainCalendarUtilizationBandsSummary();
    for (const word of ['Empty', 'Low', 'Medium', 'High', 'calendar']) {
      expect(bands).toContain(word);
    }
    const blockVs = buildExplainBlockVsTimeOffSummary();
    expect(blockVs.toLowerCase()).toContain('block');
    expect(blockVs.toLowerCase()).toContain('time off');
    expect(blockVs.toLowerCase()).toContain('approval');
  });
});
