/**
 * e2e-bug.288 — "Any tours next week?" / "Tour bookings last week?" must
 * route to list_tour_calendar_week (not list_upcoming_tour_departures clarify).
 */

export type E2e288TourWeekCase = {
  id: string;
  prompt: string;
  expectCalendarWeek: boolean;
  expectUpcoming: boolean;
  /** Relative week phrase expected in parsed weekStartDate resolution. */
  weekRelative?: 'next' | 'last' | 'this';
};

/** Positives — calendar-week list for this/next/last week tour phrasing. */
export const E2E288_CALENDAR_WEEK_POSITIVES: readonly E2e288TourWeekCase[] = [
  {
    id: 'e288-any-tours-next-week',
    prompt: 'Any tours next week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'next',
  },
  {
    id: 'e288-tour-bookings-last-week',
    prompt: 'Tour bookings last week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'last',
  },
  {
    id: 'e288-any-tours-last-week',
    prompt: 'Any tours last week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'last',
  },
  {
    id: 'e288-tour-bookings-next-week',
    prompt: 'Tour bookings next week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'next',
  },
  {
    id: 'e288-show-next-weeks-tour-calendar',
    prompt: "Show me next week's tour calendar",
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'next',
  },
  {
    id: 'e288-list-departures-next-week',
    prompt: 'List tour departures next week',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'next',
  },
  {
    id: 'e288-which-tours-calendar-next-week',
    prompt: 'Which tours are on the calendar next week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'next',
  },
  {
    id: 'e288-any-tours-this-week',
    prompt: 'Any tours this week?',
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'this',
  },
  {
    id: 'e288-summarize-last-week-departures',
    prompt: "Summarize last week's tour departures on the provider calendar",
    expectCalendarWeek: true,
    expectUpcoming: false,
    weekRelative: 'last',
  },
];

/** Negatives — capacity / upcoming aggregation must stay on upcoming-departures. */
export const E2E288_UPCOMING_NEGATIVES: readonly E2e288TourWeekCase[] = [
  {
    id: 'e288-neg-upcoming-capacity',
    prompt: 'List upcoming tour departures with pax and remaining capacity',
    expectCalendarWeek: false,
    expectUpcoming: true,
  },
  {
    id: 'e288-neg-upcoming-next-7-days',
    prompt: 'List upcoming tour departures for the next 7 days with capacity',
    expectCalendarWeek: false,
    expectUpcoming: true,
  },
  {
    id: 'e288-neg-span-explain',
    prompt:
      'Why do tours appear across multiple days on the provider calendar?',
    expectCalendarWeek: false,
    expectUpcoming: false,
  },
];
