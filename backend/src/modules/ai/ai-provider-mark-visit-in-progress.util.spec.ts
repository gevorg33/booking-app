import { describe, expect, it } from '@jest/globals';
import { PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS } from './ai-provider-mark-visit-in-progress.fixtures.js';
import {
  isMarkVisitInProgressPrompt,
  rescueMarkVisitInProgressIntent,
} from './ai-provider-mark-visit-in-progress.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-mark-visit-in-progress.util (e2e-bug.240 / ai-cmd-provider-5.16.2)', () => {
  it('registers mark_visit_in_progress on provider surface', () => {
    expect(isIntentAllowedOnSurface('mark_visit_in_progress', 'provider')).toBe(
      true,
    );
  });

  it.each(
    PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects %s', (_id, prompt) => {
    expect(isMarkVisitInProgressPrompt(prompt as string)).toBe(true);
  });

  it.each(
    PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('rescues %s from unknown', (_id, prompt) => {
    const rescued = rescueMarkVisitInProgressIntent(prompt as string, 'unknown');
    expect(rescued?.action).toBe('mark_visit_in_progress');
    expect(rescued?.params.status).toBe('in_progress');
  });

  it.each([
    ['complete-en', 'Mark visit complete'],
    ['finish-en', 'Finish this appointment'],
    ['paid-en', 'Mark as paid'],
    ['no-show-en', 'Mark as no-show'],
    ['check-in-en', 'Check in client'],
    ['running-late-en', 'Mark running late'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isMarkVisitInProgressPrompt(prompt)).toBe(false);
    expect(rescueMarkVisitInProgressIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not re-rescue when already mark_visit_in_progress', () => {
    expect(
      rescueMarkVisitInProgressIntent('Start appointment now', 'mark_visit_in_progress'),
    ).toBeNull();
  });
});
