/** Dashboard classifier rules for provider calendar week tour list (ai-cmd-tour-12). */
export const TOUR_CALENDAR_WEEK_CLASSIFIER_RULES = `- list_tour_calendar_week: READ — summarize confirmed tour departures visible on a provider's calendar week (Mon–Sun): departure dates (tourStartDate–tourEndDate), pax, and service. Optional employeeName/provider filter, serviceName filter, and weekStartDate. Triggers: list/show/summarize + calendar week|this week + tour departures|tour bookings on provider calendar. NOT explain_tour_calendar_span (how spans/colors/stacking render), NOT list_upcoming_tour_departures (next N days with remaining capacity aggregation), NOT show_appointments (all appointment types), and NOT explain_tour_services (catalog list).
- Examples:
  - "List tour departures on the provider calendar this week" → list_tour_calendar_week
  - "Summarize tours visible on Maria's calendar this week with dates and pax" → list_tour_calendar_week, employeeName=Maria
  - "What tour departures are on Gevorg's provider calendar this week?" → list_tour_calendar_week, employeeName=Gevorg
  - "Show tour bookings with service and pax on the current calendar week" → list_tour_calendar_week
  - "Week of 2026-06-09 — tour departures on the provider calendar" → list_tour_calendar_week, weekStartDate=2026-06-09
  - "Покажи туры на календаре провайдера на этой неделе с pax" → list_tour_calendar_week
  - "Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով" → list_tour_calendar_week`;

export const LIST_TOUR_CALENDAR_WEEK_PROMPTS = [
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
