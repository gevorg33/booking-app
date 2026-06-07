/** Provider mobile classifier rules for schedule/booking date display (ai-cmd-fmt-15..16). */
export const PROVIDER_DATE_FORMAT_CLASSIFIER_RULES = `- explain_provider_date_display: READ — explain how the provider mobile app formats dates and times on schedule and booking cards using dateFormat/timeFormat from auth business settings at login (fmt-1.8), via formatDateDisplay / formatTimeDisplay — not browser locale. Triggers: how/why/explain + provider app/schedule/booking card + date/time format/display. NOT explain_provider_payment_currency (currency symbol), NOT explain_business_date_format (dashboard admin), and NOT explain_last_push (push action buttons).
- configure_provider_push_date_format: MUTATE — acknowledge wiring provider FCM push notification bodies to format booking times using business timeFormat when fmt-1.8 push bodies ship (deferred). Triggers: configure/set/enable + push/notification/FCM + 12-hour/24-hour/time format. Optional timeFormat mirrors business settings preview. NOT explain_provider_date_display (read-only) and NOT dashboard configure_business_date_format (salon settings).
- Examples:
  - "How does the provider app format dates on booking cards?" → explain_provider_date_display
  - "What date format does the provider app use from business settings?" → explain_provider_date_display
  - "Explain provider schedule date and time display" → explain_provider_date_display
  - "Configure push notifications to use our business time format" → configure_provider_push_date_format
  - "Use business timeFormat in FCM push notification bodies" → configure_provider_push_date_format
  - "Enable 24-hour times in provider push notifications" → configure_provider_push_date_format`;

export const EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS = [
  {
    id: 'how-booking-cards-format-dates',
    prompt: 'How does the provider app format dates on booking cards?',
  },
  {
    id: 'why-12-hour-schedule',
    prompt: 'Why do my schedule appointments show times in 12-hour format?',
  },
  {
    id: 'date-format-from-settings',
    prompt:
      'What date format does the provider app use from business settings?',
  },
  {
    id: 'booking-card-date-display',
    prompt: 'How are booking card dates formatted in the provider mobile app?',
  },
  {
    id: 'explain-schedule-display',
    prompt: 'Explain provider schedule date and time display',
  },
  {
    id: 'salon-format-from-login',
    prompt: 'Do provider booking cards use the salon date format from login?',
  },
] as const;

export const CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS = [
  {
    id: 'configure-push-business-time',
    prompt: 'Configure push notifications to use our business time format',
  },
  {
    id: 'push-12-hour-format',
    prompt: 'Set provider push booking times to 12-hour format',
    timeFormat: '12h' as const,
  },
  {
    id: 'fcm-business-timeformat',
    prompt: 'Use business timeFormat in FCM push notification bodies',
  },
  {
    id: 'enable-24h-push',
    prompt: 'Enable 24-hour times in provider push notifications',
    timeFormat: '24h' as const,
  },
  {
    id: 'push-salon-time-settings',
    prompt: 'Format booking times in push alerts using salon time settings',
  },
  {
    id: 'configure-new-booking-push-time',
    prompt: 'Configure provider push date format for new booking notifications',
  },
] as const;
