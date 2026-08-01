/**
 * e2e-bug.304 — mid-step compound clarify must keep prior validated plans.
 */

export type E2e304ResumeCase = {
  id: string;
  prompt: string;
  expectFollowUp: boolean;
  expectResume: boolean;
};

export const E2E304_FOLLOW_UP_CASES: readonly E2e304ResumeCase[] = [
  {
    id: 'ai-e2e304-start-time-labeled',
    prompt: 'Start time: 09:00',
    expectFollowUp: true,
    expectResume: true,
  },
  {
    id: 'ai-e2e304-bare-time',
    prompt: '14:30',
    expectFollowUp: true,
    expectResume: true,
  },
  {
    id: 'ai-e2e304-first-available',
    prompt: 'first available',
    expectFollowUp: true,
    expectResume: true,
  },
  {
    id: 'ai-e2e304-new-compound',
    prompt: 'Move Sam to Monday; then book a facial for Maria',
    expectFollowUp: false,
    expectResume: false,
  },
  {
    id: 'ai-e2e304-unrelated',
    prompt: 'Show me today appointments',
    expectFollowUp: false,
    expectResume: false,
  },
] as const;

export const E2E304_CLARIFY_FIELD_CASES = [
  {
    id: 'ai-e2e304-extract-start-time',
    prompt: 'Start time: 09:00',
    expect: { timeSlot: '09:00' },
  },
  {
    id: 'ai-e2e304-extract-bare-time',
    prompt: '10:15',
    expect: { timeSlot: '10:15' },
  },
  {
    id: 'ai-e2e304-extract-date',
    prompt: 'Date: 2026-08-07',
    expect: { date: '2026-08-07' },
  },
] as const;
