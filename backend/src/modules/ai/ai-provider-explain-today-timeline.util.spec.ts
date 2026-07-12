import { PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS } from './ai-provider-explain-today-timeline.fixtures.js';
import {
  isExplainTodayTimelinePrompt,
  rescueExplainTodayTimelineIntent,
} from './ai-provider-explain-today-timeline.util.js';

describe('ai-provider-explain-today-timeline.util', () => {
  it.each(
    PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects explain_today_timeline prompt %s', (_id, prompt) => {
    expect(isExplainTodayTimelinePrompt(prompt)).toBe(true);
  });

  it('does not misdetect sibling provider READ intents', () => {
    expect(isExplainTodayTimelinePrompt('Show me my appointments today')).toBe(
      false,
    );
    expect(isExplainTodayTimelinePrompt("How's today looking?")).toBe(false);
    expect(
      isExplainTodayTimelinePrompt('Any gaps this afternoon on my book'),
    ).toBe(false);
    expect(isExplainTodayTimelinePrompt('Fill this gap')).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues explain_today_timeline from unknown for %s', (_id, prompt) => {
    const rescued = rescueExplainTodayTimelineIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('explain_today_timeline');
    expect(rescued?.rescueReason).toBe('explain_today_timeline');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueExplainTodayTimelineIntent('Show me my appointments', 'unknown'),
    ).toBeNull();
  });

  it('returns null when already classified as explain_today_timeline', () => {
    expect(
      rescueExplainTodayTimelineIntent(
        'Walk me through my day',
        'explain_today_timeline',
      ),
    ).toBeNull();
  });
});
