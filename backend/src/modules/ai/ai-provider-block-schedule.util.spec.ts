import { describe, expect, it } from '@jest/globals';
import { PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS } from './ai-provider-block-schedule.fixtures.js';
import {
  isProviderBlockSchedulePrompt,
  rescueProviderBlockScheduleIntent,
} from './ai-provider-block-schedule.util.js';

describe('ai-provider-block-schedule.util (ai-cmd-provider-5.0.1)', () => {
  it.each(
    PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects and rescues %s', (_id, prompt) => {
    expect(isProviderBlockSchedulePrompt(prompt)).toBe(true);
    expect(rescueProviderBlockScheduleIntent(prompt, 'unknown')).toEqual({
      action: 'block_schedule',
      rescueReason: 'provider_block_schedule',
    });
  });

  it('does not steal block_my_time prompts', () => {
    expect(isProviderBlockSchedulePrompt('Block my lunch 12-1')).toBe(false);
    expect(isProviderBlockSchedulePrompt('Block my break')).toBe(false);
  });

  it('does not rescue when the action is already block_schedule', () => {
    expect(
      rescueProviderBlockScheduleIntent(
        'Block 2-3pm team meeting',
        'block_schedule',
      ),
    ).toBeNull();
  });

  it('requires a schedule/team-meeting cue alongside block', () => {
    expect(isProviderBlockSchedulePrompt('Block')).toBe(false);
    expect(isProviderBlockSchedulePrompt('What is on my schedule today')).toBe(
      false,
    );
  });
});
