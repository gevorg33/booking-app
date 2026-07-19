import { PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS } from './ai-provider-mark-visit-complete.fixtures.js';
import {
  isMarkVisitCompletePrompt,
  rescueMarkVisitCompleteIntent,
} from './ai-provider-mark-visit-complete.util.js';

describe('ai-provider-mark-visit-complete.util', () => {
  it.each(
    PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('detects mark_visit_complete prompt %s', (_id, prompt) => {
    expect(isMarkVisitCompletePrompt(prompt)).toBe(true);
  });

  it('does not misdetect mark_paid (payment status, not visit status)', () => {
    expect(isMarkVisitCompletePrompt('Mark payment as paid')).toBe(false);
    expect(isMarkVisitCompletePrompt('Payment done')).toBe(false);
    expect(isMarkVisitCompletePrompt("Mark Sam's payment as paid")).toBe(
      false,
    );
  });

  it('does not misdetect other update_bookings statuses', () => {
    expect(isMarkVisitCompletePrompt('Mark as no show')).toBe(false);
    expect(isMarkVisitCompletePrompt('Mark in progress')).toBe(false);
    expect(isMarkVisitCompletePrompt('I am running late')).toBe(false);
  });

  it('does not misdetect check_in_client', () => {
    expect(isMarkVisitCompletePrompt('Mark Sam checked in')).toBe(false);
  });

  it.each(
    PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )('rescues mark_visit_complete from unknown for %s', (_id, prompt) => {
    const rescued = rescueMarkVisitCompleteIntent(prompt, 'unknown');
    expect(rescued?.action).toBe('mark_visit_complete');
    expect(rescued?.rescueReason).toBe('mark_visit_complete');
    expect(rescued?.params.status).toBe('completed');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueMarkVisitCompleteIntent('Mark payment as paid', 'unknown'),
    ).toBeNull();
  });

  it('returns null when already classified as mark_visit_complete', () => {
    expect(
      rescueMarkVisitCompleteIntent('Mark done', 'mark_visit_complete'),
    ).toBeNull();
  });
});
