/** Dashboard classifier rules for upcoming tour departure summaries (ai-cmd-tour-8). */
export const UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES = `- list_upcoming_tour_departures: READ — summarize confirmed tour bookings grouped by departure date (tourStartDate): booked pax per departure, max group size, and remaining capacity (max − booked pax). Optional serviceName filter and daysAhead. Triggers: list/show/summarize + upcoming departures|departure dates|departure schedule; remaining capacity|seats left|spots remaining on departures. NOT explain_tour_services (tour catalog metadata, cover images, or per-booking guest lines without departure aggregation), NOT explain_tour_booking_record (one booking metadata), NOT list_tour_calendar_week (provider calendar week list), NOT list_bookings (all appointment types), and NOT explain_tour_day_slots (public booking-page slot display).
- Examples:
  - "List upcoming tour departures with pax and remaining capacity" → list_upcoming_tour_departures
  - "Summarize confirmed tour departures by departure date" → list_upcoming_tour_departures
  - "Which departures still have seats in the next 14 days?" → list_upcoming_tour_departures, daysAhead=14
  - "Show remaining capacity on 3-Day Mountain Trek departures" → list_upcoming_tour_departures, serviceName=3-Day Mountain Trek
  - "Покажи предстоящие выезды туров с pax и оставшимися местами" → list_upcoming_tour_departures
  - "Ցուցադրիր առաջիկա մեկնումները pax-ով և մնացած տեղերով" → list_upcoming_tour_departures`;

export const LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS = [
  {
    id: 'list-departures-capacity',
    prompt: 'List upcoming tour departures with pax and remaining capacity',
  },
  {
    id: 'summarize-confirmed-by-date',
    prompt: 'Summarize confirmed tour departures by departure date',
  },
  {
    id: 'seats-next-14-days',
    prompt: 'Which departures still have seats in the next 14 days?',
    daysAhead: 14,
  },
  {
    id: 'remaining-capacity-departures',
    prompt: 'Show remaining capacity on upcoming tour departures',
  },
  {
    id: 'grouped-by-departure-pax',
    prompt:
      'List confirmed tour bookings grouped by departure date with pax counts',
  },
  {
    id: 'pax-and-seats-left',
    prompt:
      'Upcoming tour departures — how many pax booked and seats left?',
  },
  {
    id: 'mountain-trek-departures',
    prompt: 'Summarize mountain trek departures with remaining capacity',
    serviceName: 'mountain trek',
  },
  {
    id: 'city-tour-seats',
    prompt: 'What seats are left on upcoming City Tour departures?',
    serviceName: 'City Tour',
  },
  {
    id: 'confirmed-30-days',
    prompt:
      'Confirmed departures in the next 30 days with booked pax and capacity',
    daysAhead: 30,
  },
  {
    id: 'departure-schedule-spots',
    prompt: 'Departure schedule for tours — pax booked vs remaining spots',
  },
  {
    id: 'ru-departures-capacity',
    prompt: 'Покажи предстоящие выезды туров с pax и оставшимися местами',
  },
  {
    id: 'hy-departures-capacity',
    prompt: 'Ցուցադրիր առաջիկա մեկնումները pax-ով և մնացած տեղերով',
  },
] as const;
