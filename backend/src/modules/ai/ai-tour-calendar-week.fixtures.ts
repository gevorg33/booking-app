/** Dashboard classifier rules for provider calendar week tour list (ai-cmd-tour-12). */
export const TOUR_CALENDAR_WEEK_CLASSIFIER_RULES = `- list_tour_calendar_week: READ — summarize confirmed tour departures visible on a provider's calendar week (Mon–Sun): departure dates (tourStartDate–tourEndDate), pax, and service. Optional employeeName/provider filter, serviceName filter, and weekStartDate. Triggers: list/show/summarize/any + calendar week|this|next|last week + tour|tours|tour departures|tour bookings. NOT explain_tour_calendar_span (how spans/colors/stacking render), NOT list_upcoming_tour_departures (upcoming departures with remaining capacity / next N days), NOT show_appointments (all appointment types), and NOT explain_tour_services (catalog list).
- Examples:
  - "List tour departures on the provider calendar this week" → list_tour_calendar_week
  - "Any tours next week?" → list_tour_calendar_week, weekStartDate=next week
  - "Tour bookings last week?" → list_tour_calendar_week, weekStartDate=last week
  - "Summarize tours visible on Maria's calendar this week with dates and pax" → list_tour_calendar_week, employeeName=Maria
  - "What tour departures are on Gevorg's provider calendar this week?" → list_tour_calendar_week, employeeName=Gevorg
  - "Show tour bookings with service and pax on the current calendar week" → list_tour_calendar_week
  - "Week of 2026-06-09 — tour departures on the provider calendar" → list_tour_calendar_week, weekStartDate=2026-06-09
  - "Покажи туры на календаре провайдера на этой неделе с pax" → list_tour_calendar_week
  - "Какие туры на следующей неделе в календаре?" → list_tour_calendar_week, weekStartDate=next week
  - "Туры на прошлой неделе в календаре" → list_tour_calendar_week, weekStartDate=last week
  - "Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով" → list_tour_calendar_week
  - "Անցած շաբաթվա էքսկուրսիաները օրացույցում" → list_tour_calendar_week, weekStartDate=last week
  - "Նախորդ շաբաթվա էքսկուրսիաները օրացույցում" → list_tour_calendar_week, weekStartDate=last week
  - "Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում" → list_tour_calendar_week, weekStartDate=next week`;

/**
 * Declared so the array is one type, not a union of thirteen literal shapes.
 * `employeeName` stays `string` — the two values present are sample names, not
 * a domain.
 */
export type ListTourCalendarWeekPromptFixture = {
  id: string;
  prompt: string;
  employeeName?: string;
  weekStartDate?: string;
  serviceName?: string;
};

export const LIST_TOUR_CALENDAR_WEEK_PROMPTS: readonly ListTourCalendarWeekPromptFixture[] = [
  {
    id: 'list-calendar-week-departures',
    prompt: 'List tour departures on the provider calendar this week',
  },
  {
    id: 'summarize-maria-calendar-week',
    prompt:
      "Summarize tours visible on Maria's calendar this week with dates and pax",
    employeeName: 'Maria',
  },
  {
    id: 'gevorg-provider-week',
    prompt: "What tour departures are on Gevorg's provider calendar this week?",
    employeeName: 'Gevorg',
  },
  {
    id: 'current-week-service-pax',
    prompt:
      'Show tour bookings with service and pax on the current calendar week',
  },
  {
    id: 'this-week-provider-schedule',
    prompt:
      'List tours on the provider schedule this week with service and pax',
  },
  {
    id: 'summarize-week-calendar',
    prompt: "Summarize this week's tour departures on the provider calendar",
  },
  {
    id: 'week-of-june-9',
    prompt: 'Week of 2026-06-09 — tour departures on the provider calendar',
    weekStartDate: '2026-06-09',
  },
  {
    id: 'mountain-trek-this-week',
    prompt: 'Mountain trek tours on this calendar week with pax',
    serviceName: 'Mountain trek',
  },
  {
    id: 'maria-week-tours',
    prompt: 'Which tours are on the calendar this week for Maria?',
    employeeName: 'Maria',
  },
  {
    id: 'provider-calendar-departing',
    prompt: 'Provider calendar — tours departing this week with dates and pax',
  },
  {
    id: 'visible-tours-calendar-week',
    prompt:
      'What tours are visible on the provider calendar week with departure dates and pax?',
  },
  {
    id: 'ru-calendar-week-pax',
    prompt: 'Покажи туры на календаре провайдера на этой неделе с pax',
  },
  {
    id: 'hy-calendar-week-pax',
    prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
  },
] as const;
