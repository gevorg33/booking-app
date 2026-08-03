/**
 * e2e-bug.270 — list_tour_calendar_week must tolerate classifier garbage
 * weekStartDate / date values ("this week", "this week's", etc.) instead of
 * throwing Invalid time value via buildWeekDateKeys → addDaysToDateKey.
 */

export type E2e270WeekGarbageCase = {
  id: string;
  weekStartDate: string;
  /** When true, parse must still return a non-null plan (prompt is in-scope). */
  expectParse: boolean;
};

/** Classifier/LLM fragments that previously crashed the handler. */
export const E2E270_WEEK_START_GARBAGE: readonly E2e270WeekGarbageCase[] = [
  {
    id: 'ai-e2e270-this-week',
    weekStartDate: 'this week',
    expectParse: true,
  },
  {
    id: 'ai-e2e270-this-weeks',
    weekStartDate: "this week's",
    expectParse: true,
  },
  {
    id: 'ai-e2e270-this-calendar-week',
    weekStartDate: 'this calendar week',
    expectParse: true,
  },
  {
    id: 'ai-e2e270-current-week',
    weekStartDate: 'current week',
    expectParse: true,
  },
  {
    id: 'ai-e2e270-current-calendar-week',
    weekStartDate: 'current calendar week',
    expectParse: true,
  },
  {
    id: 'ai-e2e270-plain-week',
    weekStartDate: 'week',
    expectParse: true,
  },
  {
    id: 'ai-e2e270-not-a-date',
    weekStartDate: 'not-a-date',
    expectParse: true,
  },
] as const;

/** Live / recognition prompts that crashed before the ISO guard. */
export const E2E270_CRASH_PROMPTS = [
  {
    id: 'ai-e2e270-any-tours-this-week',
    prompt: 'Any tours this week?',
  },
  {
    id: 'ai-e2e270-show-weeks-tour-calendar',
    prompt: "Show me this week's tour calendar",
  },
  {
    id: 'ai-e2e270-summarize-weeks-departures',
    prompt: "Summarize this week's tour departures on the provider calendar",
  },
  {
    id: 'ai-e2e270-tour-bookings-this-week',
    prompt: 'Tour bookings this week?',
  },
  {
    id: 'ai-e2e270-mountain-trek-calendar-week',
    prompt: 'Mountain trek tours on this calendar week with pax',
  },
  {
    id: 'ai-e2e270-canon-what-tour-bookings',
    prompt: 'What tour bookings do I have this week?',
  },
  {
    id: 'ai-e2e270-list-departures-provider',
    prompt: 'List tour departures on the provider calendar this week',
  },
  {
    id: 'ai-e2e270-voice-tour-bookings-week-please',
    prompt: 'tour bookings this week please',
  },
  {
    id: 'ai-e2e270-which-tours-calendar-week',
    prompt: 'Which tours are on the calendar this week?',
  },
  {
    id: 'ai-e2e270-provider-schedule-this-week',
    prompt: 'List tours on the provider schedule this week with service and pax',
  },
] as const;
