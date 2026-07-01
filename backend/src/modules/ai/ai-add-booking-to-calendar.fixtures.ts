export type AddBookingToCalendarFormat = 'google' | 'outlook' | 'ics' | 'all';

export type AddBookingToCalendarPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'add_booking_to_calendar';
  format: AddBookingToCalendarFormat;
  rescueReason: 'add_booking_calendar';
  serviceName?: string;
};

export const ADD_BOOKING_TO_CALENDAR_PROMPTS: readonly AddBookingToCalendarPromptFixture[] =
  [
    {
      id: 'add-to-calendar-customer',
      prompt: 'Add to my calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'add-appointment-calendar-customer',
      prompt: 'Add my appointment to calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'send-ics-customer',
      prompt: 'Send me an ICS file for my booking',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'ics',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'download-ics-customer',
      prompt: 'Download calendar file for my appointment',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'ics',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'google-calendar-customer',
      prompt: 'Put my booking in Google Calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'google',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'outlook-calendar-customer',
      prompt: 'Add this booking to Outlook calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'outlook',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'calendar-invite-customer',
      prompt: 'Give me a calendar invite for my appointment',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'this-booking-calendar-customer',
      prompt: 'Add this booking to my phone calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'tomorrow-massage-calendar-customer',
      prompt: 'Add tomorrow massage to my calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
      serviceName: 'massage',
    },
    {
      id: 'save-appointment-calendar-customer',
      prompt: 'Save my appointment to calendar',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'export-ics-customer',
      prompt: 'Export my booking as ICS',
      surface: 'customer',
      expectedAction: 'add_booking_to_calendar',
      format: 'ics',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'add-to-calendar-public',
      prompt: 'Add to my calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'add-appointment-calendar-public',
      prompt: 'Add my appointment to calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'send-ics-public',
      prompt: 'Send me an ICS for this booking',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'ics',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'download-calendar-public',
      prompt: 'Download calendar invite for my appointment',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'google-calendar-public',
      prompt: 'Open this appointment in Google Calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'google',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'outlook-calendar-public',
      prompt: 'Add to Outlook calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'outlook',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'calendar-invite-public',
      prompt: 'I need a calendar invite for this booking',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'just-booked-calendar-public',
      prompt: 'Add what I just booked to my calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'save-booking-calendar-public',
      prompt: 'Save this booking to my phone calendar',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'ics-file-public',
      prompt: 'Get an ICS file for my appointment',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'ics',
      rescueReason: 'add_booking_calendar',
    },
    {
      id: 'calendar-event-public',
      prompt: 'Create a calendar event for my booking',
      surface: 'public',
      expectedAction: 'add_booking_to_calendar',
      format: 'all',
      rescueReason: 'add_booking_calendar',
    },
  ] as const;

export const ADD_BOOKING_TO_CALENDAR_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-add-calendar',
    prompt: 'Add to my calendar',
    misclassifiedAction: 'unknown',
    expectedAction: 'add_booking_to_calendar',
  },
  {
    id: 'confirm-to-add-calendar',
    prompt: 'Send me an ICS for my booking',
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'add_booking_to_calendar',
  },
  {
    id: 'manage-link-to-add-calendar',
    prompt: 'Add my appointment to Google Calendar',
    misclassifiedAction: 'get_manage_link',
    expectedAction: 'add_booking_to_calendar',
  },
] as const;
