import { PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS } from './ai-provider-summarize-utilization.fixtures.js';
import {
  isSummarizeUtilizationPrompt,
  rescueSummarizeUtilizationIntent,
} from './ai-provider-summarize-utilization.util.js';

describe('ai-provider-summarize-utilization.util', () => {
  it.each(
    PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects summarize_utilization prompt %s', (_id, prompt) => {
    expect(isSummarizeUtilizationPrompt(prompt)).toBe(true);
  });

  it('does not misdetect unrelated prompts', () => {
    expect(isSummarizeUtilizationPrompt('Show me my appointments today')).toBe(
      false,
    );
    expect(isSummarizeUtilizationPrompt("How's today looking?")).toBe(false);
  });

  it.each(
    PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues summarize_utilization from unknown for %s', (_id, prompt) => {
    const rescued = rescueSummarizeUtilizationIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('summarize_utilization');
    expect(rescued?.rescueReason).toBe('summarize_utilization');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueSummarizeUtilizationIntent('Show me my appointments', 'unknown'),
    ).toBeNull();
  });
});
