/** Customer/public classifier rules for booking-page date display (ai-cmd-fmt-4). */
export const BOOKING_DATE_FORMAT_CLASSIFIER_RULES = `- explain_booking_date_format: READ — explain why dates on this booking page show in the salon's configured order (DD/MM vs MM/DD vs ISO) and how times are formatted (24h vs 12h). Uses business settings.dateFormat and settings.timeFormat — not the visitor's browser locale. Triggers: why/how/what + dates show/display + DD/MM vs MM/DD + booking page/this site. NOT explain_business_date_format (dashboard admin settings), NOT configure_business_date_format (mutate), and NOT explain_booking_languages (language menu).
- Examples:
  - "Why do dates show as DD/MM instead of MM/DD on the booking page?" → explain_booking_date_format
  - "Why is the date format different on this site?" → explain_booking_date_format
  - "How are dates displayed on this booking page?" → explain_booking_date_format
  - "Why aren't dates in US format here?" → explain_booking_date_format
  - "Почему даты на странице записи в формате DD/MM, а не MM/DD?" → explain_booking_date_format
  - "Ինչու՞ ամսաթվերը DD/MM են այս գրանցման էջում" → explain_booking_date_format`;

export const EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS = [
  {
    id: 'why-dd-mm-not-mm-dd',
    prompt: 'Why do dates show as DD/MM instead of MM/DD on the booking page?',
  },
  {
    id: 'why-different-format',
    prompt: 'Why is the date format different on this site?',
  },
  {
    id: 'how-dates-displayed',
    prompt: 'How are dates displayed on this booking page?',
  },
  {
    id: 'why-not-us-format',
    prompt: "Why aren't dates in US format here?",
  },
  {
    id: 'what-format-salon-bookings',
    prompt: 'What date format does this salon use for bookings?',
  },
  {
    id: 'why-european-dates',
    prompt: 'Why does the calendar use European dates?',
  },
  {
    id: 'ru-why-dd-mm-booking-page',
    prompt: 'Почему даты на странице записи в формате DD/MM, а не MM/DD?',
  },
  {
    id: 'ru-why-not-us-format',
    prompt: 'Почему даты не в американском формате на сайте записи?',
  },
  {
    id: 'ru-how-dates-shown',
    prompt: 'Как отображаются даты на этой странице записи?',
  },
  {
    id: 'hy-why-dd-mm-booking-page',
    prompt: 'Ինչու՞ ամսաթվերը DD/MM են այս գրանցման էջում',
  },
  {
    id: 'hy-why-not-mm-dd',
    prompt: 'Ինչու ամսաթվերը MM/DD չեն ցուցադրվում այս էջում',
  },
  {
    id: 'hy-how-dates-displayed',
    prompt: 'Ինչպե՞ս են ցուցադրվում ամսաթվերը գրանցման էջում',
  },
] as const;
