/** Dashboard classifier rules for tour booking record metadata (ai-cmd-tour-7). */
export const TOUR_BOOKING_RECORD_CLASSIFIER_RULES = `- explain_tour_booking_record: READ — explain one tour booking's stored metadata: paxCount, tourStartDate, tourEndDate, specialRequirements, and why it spans multiple days on the provider calendar (vert-tour-1.10 uses tourStartDate–tourEndDate overlap). Triggers: explain/show + booking/appointment + pax|tour dates|special requirements|calendar span. Optional bookingId or customerName. NOT explain_tour_calendar_span (general calendar colors/clipping/stacking), NOT explain_tour_services (catalog list or upcoming departures summary), NOT list_bookings (all appointment types), NOT explain_tour_booking (public catalog pricing), and NOT explain_tour_day_slots (booking-page slot display).
- Examples:
  - "Explain tour booking record for booking bk-tour-1 — pax and dates" → explain_tour_booking_record, bookingId=bk-tour-1
  - "What tourStartDate and tourEndDate are stored on booking #bk-1?" → explain_tour_booking_record, bookingId=bk-1
  - "Show pax count and special requirements for John's mountain trek booking" → explain_tour_booking_record, customerName=John
  - "Why does this tour booking span June 11–13 on the provider calendar?" → explain_tour_booking_record
  - "Объясни запись тура: pax и даты начала/конца для бронирования bk-1" → explain_tour_booking_record, bookingId=bk-1
  - "Բացատրիր էքսկուրսիայի ամրագրումը pax-ով և տարեթվերով" → explain_tour_booking_record`;

/** Customer mobile classifier rules (ai-cmd-customer-4.10.4). */
export const CUSTOMER_TOUR_BOOKING_RECORD_CLASSIFIER_RULES = `- explain_tour_booking_record: READ — signed-in customer: summarize one of their tour bookings — confirmation number (booking ID), paxCount, tourStartDate, tourEndDate, specialRequirements. Triggers: "my tour confirmation number", "summarize my group booking", "my tour reservation details", "how many people on my tour". Uses session customer bookings when bookingId omitted. Optional bookingId. NOT confirm_my_booking_details (single appointment time/service summary without tour metadata), NOT explain_tour_booking (catalog max group / per-person price), NOT list_my_appointments (browse all bookings), NOT explain_tour_services (catalog list), and NOT explain_tour_day_slots (slot display).
- Examples:
  - "What's my tour confirmation number?" → explain_tour_booking_record, aspect=confirmationNumber
  - "Summarize my group booking" → explain_tour_booking_record, aspect=all
  - "How many people are on my tour reservation?" → explain_tour_booking_record, aspect=paxCount
  - "When does my group tour start and end?" → explain_tour_booking_record, aspect=dates
  - "Do I have special requirements saved on my tour?" → explain_tour_booking_record, aspect=specialRequirements
  - "Какой номер подтверждения моего тура?" → explain_tour_booking_record, aspect=confirmationNumber
  - "Ամփոփիր իմ խմբային ամրագրումը" → explain_tour_booking_record, aspect=all`;

/** Declared so the array is one type, not a union of twelve literal shapes. */
export type ExplainTourBookingRecordPromptFixture = {
  id: string;
  prompt: string;
  bookingId?: string;
  aspect:
    | 'all'
    | 'calendarSpan'
    | 'confirmationNumber'
    | 'dates'
    | 'paxCount'
    | 'specialRequirements';
  customerName?: string;
};

export const EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS: readonly ExplainTourBookingRecordPromptFixture[] = [
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
];

export const EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS = [
  {
    id: 'customer-confirmation-number',
    prompt: "What's my tour confirmation number?",
    aspect: 'confirmationNumber' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-summarize-group-booking',
    prompt: 'Summarize my group booking',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-confirmation-code',
    prompt: 'What is my tour booking confirmation code?',
    aspect: 'confirmationNumber' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-wine-tour-details',
    prompt: 'Show details for my Wine Country tour booking',
    aspect: 'all' as const,
    surface: 'customer' as const,
    serviceName: 'Wine Country',
  },
  {
    id: 'customer-pax-on-reservation',
    prompt: 'How many people are on my tour reservation?',
    aspect: 'paxCount' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-tour-start-end',
    prompt: 'When does my group tour start and end?',
    aspect: 'dates' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-recap-tour',
    prompt: 'Recap my tour booking details',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-mountain-trek-stored',
    prompt: "What's stored on my Mountain Trek booking?",
    aspect: 'all' as const,
    surface: 'customer' as const,
    serviceName: 'Mountain Trek',
  },
  {
    id: 'customer-special-requirements-saved',
    prompt: 'Do I have special requirements saved on my tour?',
    aspect: 'specialRequirements' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-confirmation-hash',
    prompt: 'My tour confirmation # — what is it?',
    aspect: 'confirmationNumber' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-summarize-pax-dates',
    prompt: 'Summarize pax and dates for my tour',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-group-booking-summary',
    prompt: 'Give me a summary of my group tour booking',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'ru-customer-confirmation-number',
    prompt: 'Какой номер подтверждения моего тура?',
    aspect: 'confirmationNumber' as const,
    surface: 'customer' as const,
  },
  {
    id: 'ru-customer-summarize-group',
    prompt: 'Кратко опиши мою групповую запись на тур',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'hy-customer-summarize-group',
    prompt: 'Ամփոփիր իմ խմբային ամրագրումը',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'hy-customer-confirmation-number',
    prompt: 'Ո՞րն է իմ էքսկուրսիայի հաստատման համարը',
    aspect: 'confirmationNumber' as const,
    surface: 'customer' as const,
  },
] as const;
