/** Dashboard classifier rules for tour booking record metadata (ai-cmd-tour-7). */
export const TOUR_BOOKING_RECORD_CLASSIFIER_RULES = `- explain_tour_booking_record: READ — explain one tour booking's stored metadata: paxCount, tourStartDate, tourEndDate, specialRequirements, and why it spans multiple days on the provider calendar (vert-tour-1.10 uses tourStartDate–tourEndDate overlap). Triggers: explain/show + booking/appointment + pax|tour dates|special requirements|calendar span. Optional bookingId or customerName. NOT explain_tour_calendar_span (general calendar colors/clipping/stacking), NOT explain_tour_services (catalog list or upcoming departures summary), NOT list_bookings (all appointment types), NOT explain_tour_booking (public catalog pricing), and NOT explain_tour_day_slots (booking-page slot display).
- Examples:
  - "Explain tour booking record for booking bk-tour-1 — pax and dates" → explain_tour_booking_record, bookingId=bk-tour-1
  - "What tourStartDate and tourEndDate are stored on booking #bk-1?" → explain_tour_booking_record, bookingId=bk-1
  - "Show pax count and special requirements for John's mountain trek booking" → explain_tour_booking_record, customerName=John
  - "Why does this tour booking span June 11–13 on the provider calendar?" → explain_tour_booking_record
  - "Объясни запись тура: pax и даты начала/конца для бронирования bk-1" → explain_tour_booking_record, bookingId=bk-1
  - "Բացատրիր էքսկուրսիայի ամրագրումը pax-ով և տարեթվերով" → explain_tour_booking_record`;

export const EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS = [
  {
    id: 'explain-record-bk-tour-1',
    prompt: 'Explain tour booking record for booking bk-tour-1 — pax and dates',
    bookingId: 'bk-tour-1',
    aspect: 'all' as const,
  },
  {
    id: 'tour-dates-stored-bk-tour-1',
    prompt:
      'What tourStartDate and tourEndDate are stored on booking bk-tour-1?',
    bookingId: 'bk-tour-1',
    aspect: 'dates' as const,
  },
  {
    id: 'pax-special-john-trek',
    prompt:
      "Show pax count and special requirements for John Doe's 3-Day Mountain Trek booking",
    customerName: 'John Doe',
    aspect: 'all' as const,
  },
  {
    id: 'calendar-span-june',
    prompt:
      'Why does this tour booking span June 11–13 on the provider calendar?',
    aspect: 'calendarSpan' as const,
  },
  {
    id: 'metadata-booking-abcdef',
    prompt: "What's stored in tour metadata for booking #abcdef123456?",
    bookingId: 'abcdef123456',
    aspect: 'all' as const,
  },
  {
    id: 'special-requirements-maria',
    prompt: 'Explain special requirements on the City Tour booking for Maria',
    customerName: 'Maria',
    aspect: 'specialRequirements' as const,
  },
  {
    id: 'pax-heritage-bk-tour-2',
    prompt: 'How many pax are on booking bk-tour-2 for the heritage tour?',
    bookingId: 'bk-tour-2',
    aspect: 'paxCount' as const,
  },
  {
    id: 'provider-calendar-multi-day',
    prompt:
      'Why does this tour booking span multiple days on the provider calendar?',
    aspect: 'calendarSpan' as const,
  },
  {
    id: 'ru-record-bk-tour-1',
    prompt:
      'Объясни запись тура: pax и даты начала/конца для бронирования bk-tour-1',
    bookingId: 'bk-tour-1',
    aspect: 'all' as const,
  },
  {
    id: 'hy-record-pax-dates',
    prompt: 'Բացատրիր էքսկուրսիայի ամրագրումը pax-ով և տարեթվերով',
    aspect: 'all' as const,
  },
  {
    id: 'tour-end-date-bk-tour-1',
    prompt: 'What is the tourEndDate on booking bk-tour-1?',
    bookingId: 'bk-tour-1',
    aspect: 'dates' as const,
  },
  {
    id: 'pax-only-upcoming-single',
    prompt: 'Explain the pax count stored on tour booking bk-tour-1',
    bookingId: 'bk-tour-1',
    aspect: 'paxCount' as const,
  },
] as const;
