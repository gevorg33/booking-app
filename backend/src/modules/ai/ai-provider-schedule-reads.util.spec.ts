import {
  extractDaysFromPrompt,
  isGetScheduleSummaryPrompt,
  isListUpcomingBookingsPrompt,
  rescueProviderScheduleReadsIntent,
} from './ai-provider-schedule-reads.util.js';

describe('extractDaysFromPrompt', () => {
  it('extracts numeric days', () => {
    expect(
      extractDaysFromPrompt(
        "What's coming up on my schedule for the next 10 days?",
      ),
    ).toBe(10);
  });

  it('extracts weeks converted to days', () => {
    expect(
      extractDaysFromPrompt('Summarize my schedule for the next two weeks'),
    ).toBe(14);
  });

  it('extracts "this week" as 7 days', () => {
    expect(extractDaysFromPrompt("What's coming up this week?")).toBe(7);
  });

  it('extracts "this month" as 30 days', () => {
    expect(extractDaysFromPrompt('How does my schedule look this month?')).toBe(
      30,
    );
  });

  it('returns undefined with no day cue', () => {
    expect(extractDaysFromPrompt('Give me a schedule overview')).toBeUndefined();
  });
});

describe('isListUpcomingBookingsPrompt', () => {
  it.each([
    "What's coming up this week?",
    "What's coming up on my schedule for the next 10 days?",
    'What do I have coming up?',
  ])('matches %s', (prompt) => {
    expect(isListUpcomingBookingsPrompt(prompt)).toBe(true);
  });

  it('does not match unrelated prompts', () => {
    expect(isListUpcomingBookingsPrompt('Check in this client')).toBe(false);
  });
});

describe('isGetScheduleSummaryPrompt', () => {
  it.each([
    'Summarize my schedule for the next two weeks',
    'Give me a schedule overview',
    'How does my schedule look this month?',
  ])('matches %s', (prompt) => {
    expect(isGetScheduleSummaryPrompt(prompt)).toBe(true);
  });

  it('does not match unrelated prompts', () => {
    expect(isGetScheduleSummaryPrompt('Mark this booking paid')).toBe(false);
  });
});

describe('rescueProviderScheduleReadsIntent', () => {
  it('rescues to list_upcoming_bookings', () => {
    expect(
      rescueProviderScheduleReadsIntent("What's coming up this week?", 'unknown'),
    ).toEqual({
      action: 'list_upcoming_bookings',
      rescueReason: 'list_upcoming_bookings',
    });
  });

  it('rescues to get_schedule_summary', () => {
    expect(
      rescueProviderScheduleReadsIntent('Give me a schedule overview', 'unknown'),
    ).toEqual({
      action: 'get_schedule_summary',
      rescueReason: 'get_schedule_summary',
    });
  });

  it('returns null when action already matches', () => {
    expect(
      rescueProviderScheduleReadsIntent(
        "What's coming up this week?",
        'list_upcoming_bookings',
      ),
    ).toBeNull();
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueProviderScheduleReadsIntent('Check in this client', 'unknown'),
    ).toBeNull();
  });
});
