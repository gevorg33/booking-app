/** Dashboard classifier rules for notification channel date/time display (ai-cmd-fmt-9..11). */
export const NOTIFICATION_DATE_FORMAT_CLASSIFIER_RULES = `- explain_notification_date_format: READ — explain how booking confirmation/reminder emails and WhatsApp/SMS format appointment dates and times using the salon business dateFormat/timeFormat (same settings as dashboard via formatNotificationDateDisplay). Triggers: how/what/why + confirmation/reminder/gift-card + email/WhatsApp + date/time format vs dashboard. NOT explain_notification_currency (amount symbol), NOT explain_business_date_format (salon settings without notification channels), and NOT explain_booking_date_format (public booking page).
- preview_notification_datetime: READ — preview a sample confirmation/reminder/gift-card email or WhatsApp line with current business date/time formatting. Triggers: preview/show sample + confirmation/reminder/gift-card + email/WhatsApp/message. Optional messageKind (confirmation | reminder | gift_card | cancellation). NOT preview_business_date_format (alternate format before saving settings).
- notify_patient_result_ready: MUTATE — send or queue clinic result-ready email/WhatsApp for a patient (vert-clinic-1.7); completedAt label uses formatResultReadyNotificationWhen with business dateFormat/timeFormat. Triggers: notify/send/tell + patient + results ready/lab results/test results + email/WhatsApp. Optional bookingId or customerName. Clinic vertical only. NOT preview_notification_datetime (read-only sample) and NOT explain_notification_date_format (date-format explanation).
- Examples:
  - "How do confirmation emails format dates vs the dashboard?" → explain_notification_date_format
  - "What date format do WhatsApp reminders use?" → explain_notification_date_format
  - "Do notification emails use the same time format as the dashboard?" → explain_notification_date_format
  - "Preview a sample confirmation email with our current date format" → preview_notification_datetime, messageKind=confirmation
  - "Show how a reminder WhatsApp message would display appointment time" → preview_notification_datetime, messageKind=reminder
  - "Sample gift card expiry email with our date settings" → preview_notification_datetime, messageKind=gift_card
  - "Notify patient their lab results are ready" → notify_patient_result_ready
  - "Send result-ready WhatsApp to the patient" → notify_patient_result_ready`;

export const NOTIFY_PATIENT_RESULT_READY_PROMPTS = [
  {
    id: 'notify-lab-results-ready',
    prompt: 'Notify patient their lab results are ready',
  },
  {
    id: 'send-result-ready-email',
    prompt: 'Send result-ready email to the patient',
  },
  {
    id: 'whatsapp-test-results-ready',
    prompt: 'Send WhatsApp message that test results are ready',
  },
  {
    id: 'tell-patient-results-available',
    prompt: 'Tell the patient their results are available',
  },
  {
    id: 'notify-result-ready-patient',
    prompt: 'Notify the patient result ready notification',
  },
  {
    id: 'send-patient-result-ready',
    prompt: 'Send patient result ready notification via email',
  },
] as const;

export const EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS = [
  {
    id: 'how-confirmation-email-dates',
    prompt: 'How do confirmation emails format dates vs the dashboard?',
  },
  {
    id: 'whatsapp-reminder-date-format',
    prompt: 'What date format do WhatsApp reminders use?',
  },
  {
    id: 'notification-vs-dashboard-time',
    prompt: 'Do notification emails use the same time format as the dashboard?',
  },
  {
    id: 'reminder-sms-date-display',
    prompt: 'How are dates shown in appointment reminder SMS messages?',
  },
  {
    id: 'gift-card-email-dates',
    prompt: 'What date format do gift card emails use for expiry?',
  },
  {
    id: 'why-same-as-dashboard',
    prompt:
      'Why do confirmation emails show dates the same way as the dashboard calendar?',
  },
] as const;

export const PREVIEW_NOTIFICATION_DATETIME_PROMPTS = [
  {
    id: 'preview-confirmation-email',
    prompt: 'Preview a sample confirmation email with our current date format',
    messageKind: 'confirmation' as const,
  },
  {
    id: 'preview-reminder-whatsapp',
    prompt: 'Show how a reminder WhatsApp message would display appointment time',
    messageKind: 'reminder' as const,
  },
  {
    id: 'sample-gift-card-expiry-email',
    prompt: 'Sample gift card expiry email with our date settings',
    messageKind: 'gift_card' as const,
  },
  {
    id: 'preview-cancellation-email',
    prompt: 'Preview cancellation email date and time formatting',
    messageKind: 'cancellation' as const,
  },
  {
    id: 'sample-reminder-email',
    prompt: 'Show a sample appointment reminder email with current time format',
    messageKind: 'reminder' as const,
  },
  {
    id: 'preview-whatsapp-confirmation',
    prompt: 'What would a WhatsApp booking confirmation look like with our date format?',
    messageKind: 'confirmation' as const,
  },
] as const;
