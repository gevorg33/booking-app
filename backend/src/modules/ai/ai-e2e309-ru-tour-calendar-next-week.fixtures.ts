/**
 * e2e-bug.309 — RU next/last-week calendar tour lists must route to
 * list_tour_calendar_week (not list_upcoming_tour_departures clarify).
 * Residual of e2e-bug.289 / sibling of e2e-bug.288 EN next/last week.
 */

export type E2e309RuTourWeekCase = {
  id: string;
  prompt: string;
  expectCalendarWeek: boolean;
  weekRelative?: 'next' | 'last' | 'this';
};

export const E2E309_RU_CALENDAR_WEEK_POSITIVES: readonly E2e309RuTourWeekCase[] =
  [
    {
      id: 'ai-e2e309-ru-next-week-calendar',
      prompt: 'Какие туры на следующей неделе в календаре?',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
    {
      id: 'ai-e2e309-ru-next-week-short',
      prompt: 'Какие туры на следующей неделе?',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
    {
      id: 'ai-e2e309-ru-next-week-provider-calendar',
      prompt: 'Покажи туры на следующей неделе на календаре провайдера',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
    {
      id: 'ai-e2e309-ru-next-calendar-week-word',
      prompt: 'Покажи туры на следующей календарной неделе',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
    {
      id: 'ai-e2e309-en-provider-next-no-employee',
      prompt: 'Show tours for next week on the provider calendar',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
    {
      id: 'ai-e2e309-ru-last-week-calendar',
      prompt: 'Туры на прошлой неделе в календаре',
      expectCalendarWeek: true,
      weekRelative: 'last',
    },
    {
      id: 'ai-e2e309-ru-last-week-question',
      prompt: 'Какие туры были на прошлой неделе в календаре?',
      expectCalendarWeek: true,
      weekRelative: 'last',
    },
    {
      id: 'ai-e2e309-ru-this-week-still-ok',
      prompt: 'Какие туры на этой неделе в календаре?',
      expectCalendarWeek: true,
      weekRelative: 'this',
    },
    {
      id: 'ai-e2e309-ru-this-week-pax',
      prompt: 'Покажи туры на этой неделе в календаре с pax',
      expectCalendarWeek: true,
      weekRelative: 'this',
    },
    {
      id: 'ai-e2e309-ru-excursions-next-week',
      prompt: 'Какие экскурсии на следующей неделе в календаре?',
      expectCalendarWeek: true,
      weekRelative: 'next',
    },
  ] as const;

/** Capacity / upcoming must not become calendar-week. */
export const E2E309_UPCOMING_NEGATIVES: readonly E2e309RuTourWeekCase[] = [
  {
    id: 'ai-e2e309-neg-ru-upcoming-capacity',
    prompt: 'Покажи предстоящие выезды туров с оставшимися местами',
    expectCalendarWeek: false,
  },
  {
    id: 'ai-e2e309-neg-en-upcoming-next-7-days',
    prompt: 'List upcoming tour departures for the next 7 days with capacity',
    expectCalendarWeek: false,
  },
] as const;

export const E2E309_RESCUE_CASES = [
  {
    id: 'rescue-ru-next-from-upcoming',
    prompt: 'Какие туры на следующей неделе в календаре?',
    fromAction: 'list_upcoming_tour_departures',
    expectedAction: 'list_tour_calendar_week',
  },
  {
    id: 'rescue-ru-last-from-upcoming',
    prompt: 'Туры на прошлой неделе в календаре',
    fromAction: 'list_upcoming_tour_departures',
    expectedAction: 'list_tour_calendar_week',
  },
  {
    id: 'rescue-ru-next-from-unknown',
    prompt: 'Какие туры на следующей неделе в календаре?',
    fromAction: 'unknown',
    expectedAction: 'list_tour_calendar_week',
  },
] as const;

export const E2E309_LIVE_CASES = [
  {
    id: 'live-ru-next-week-calendar',
    prompt: 'Какие туры на следующей неделе в календаре?',
    locale: 'ru' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'next' as const,
    expectSummaryMatch: /нет подтверждённых|календарной неделе|выезд/iu,
  },
  {
    id: 'live-ru-next-week-short',
    prompt: 'Какие туры на следующей неделе?',
    locale: 'ru' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'next' as const,
  },
  {
    id: 'live-ru-last-week-calendar',
    prompt: 'Туры на прошлой неделе в календаре',
    locale: 'ru' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-ru-this-week-control',
    prompt: 'Какие туры на этой неделе в календаре?',
    locale: 'ru' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'this' as const,
  },
  {
    id: 'live-ru-next-provider-calendar',
    prompt: 'Покажи туры на следующей неделе на календаре провайдера',
    locale: 'ru' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'next' as const,
  },
  {
    id: 'live-en-next-week-regression',
    prompt: 'Any tours next week?',
    locale: 'en' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'next' as const,
  },
  {
    id: 'live-hy-next-week-regression',
    prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectedAction: 'list_tour_calendar_week',
    forbidActions: ['list_upcoming_tour_departures'] as const,
    expectWeekRelative: 'next' as const,
  },
] as const;
