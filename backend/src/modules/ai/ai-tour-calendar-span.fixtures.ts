/** Dashboard classifier rules for provider tour calendar span UI (ai-cmd-tour-11). */
export const TOUR_CALENDAR_SPAN_CLASSIFIER_RULES = `- explain_tour_calendar_span: READ — explain how vert-tour-1.10 renders tours on the provider calendar: multi-day spans (tourStartDate–tourEndDate columns), per-service colors, week-boundary clipping, and stacked departure lanes when tours overlap. Triggers: explain/how/why + provider calendar|tour calendar + span|colors|clipped week|stacked lanes|multi-day. Optional serviceName or weekStartDate filter. NOT explain_tour_booking_record (one booking's stored pax/dates/metadata), NOT list_upcoming_tour_departures (departure aggregation with remaining capacity), NOT explain_tour_services (catalog list), and NOT explain_tour_day_slots (public booking-page slots).
- Examples:
  - "Why do tours appear across multiple days on the provider calendar?" → explain_tour_calendar_span, aspect=multiDaySpan
  - "How are tour service colors assigned on the provider calendar?" → explain_tour_calendar_span, aspect=serviceColors
  - "Why is a multi-day tour clipped at the week boundary on the calendar?" → explain_tour_calendar_span, aspect=clippedWeek
  - "Why do stacked departure lanes appear on the tour calendar?" → explain_tour_calendar_span, aspect=stackedDepartures
  - "Explain how the provider calendar shows tour spans (vert-tour-1.10)" → explain_tour_calendar_span, aspect=all
  - "Explain how 3-Day Mountain Trek spans show on the provider calendar" → explain_tour_calendar_span, serviceName=3-Day Mountain Trek
  - "Почему у каждого тура свой цвет на календаре провайдера?" → explain_tour_calendar_span, aspect=serviceColors
  - "Ինչու են տուրերը կուտակված տողերում օրացույցում?" → explain_tour_calendar_span, aspect=stackedDepartures`;

export const EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS = [
  {
    id: 'multi-day-span-general',
    prompt: 'Why do tours appear across multiple days on the provider calendar?',
    aspect: 'multiDaySpan' as const,
  },
  {
    id: 'service-colors',
    prompt: 'How are tour service colors assigned on the provider calendar?',
    aspect: 'serviceColors' as const,
  },
  {
    id: 'clipped-week',
    prompt:
      'Why is a multi-day tour clipped at the week boundary on the calendar?',
    aspect: 'clippedWeek' as const,
  },
  {
    id: 'stacked-lanes',
    prompt: 'Why do stacked departure lanes appear on the tour calendar?',
    aspect: 'stackedDepartures' as const,
  },
  {
    id: 'vert-tour-mechanics',
    prompt:
      'Explain how the provider calendar shows tour spans (vert-tour-1.10)',
    aspect: 'all' as const,
  },
  {
    id: 'multi-day-display',
    prompt: 'How does the dashboard calendar display multi-day tour bookings?',
    aspect: 'multiDaySpan' as const,
  },
  {
    id: 'color-per-service',
    prompt:
      'Why does each tour service have a different color on the calendar?',
    aspect: 'serviceColors' as const,
  },
  {
    id: 'week-clipping-long-tour',
    prompt:
      'Why does a 7-day tour only show the visible week on the calendar?',
    aspect: 'clippedWeek' as const,
  },
  {
    id: 'same-day-stack',
    prompt:
      'Why do two tours departing the same day stack on separate lanes?',
    aspect: 'stackedDepartures' as const,
  },
  {
    id: 'mountain-trek-span',
    prompt:
      'Explain how 3-Day Mountain Trek spans show on the provider calendar',
    serviceName: '3-Day Mountain Trek',
    aspect: 'multiDaySpan' as const,
  },
  {
    id: 'ru-colors',
    prompt: 'Почему у каждого тура свой цвет на календаре провайдера?',
    aspect: 'serviceColors' as const,
  },
  {
    id: 'hy-stacked',
    prompt: 'Ինչու են տուրերը կուտակված տողերում օրացույցում?',
    aspect: 'stackedDepartures' as const,
  },
] as const;
