/**
 * e2e-bug.159 — owner "notify me whenever customers cancel" must route to
 * toggle_business_email_on_customer_change, never customer-outbound notify.
 */
export const E2E159_OWNER_CANCEL_ALERT_SCENARIOS = [
  {
    id: 'e2e159-notify-me-whenever-cancel-today',
    prompt: 'Notify me whenever a customer cancels a booking today',
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: true,
  },
  {
    id: 'e2e159-alert-me-when-customers-cancel',
    prompt: 'Alert me when a customer cancels a booking',
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: true,
  },
  {
    id: 'e2e159-email-me-whenever-reschedule',
    prompt: 'Email me whenever customers reschedule',
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: true,
  },
  {
    id: 'e2e159-tell-me-when-customers-cancel',
    prompt: 'Tell me when customers cancel bookings',
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: true,
  },
  {
    id: 'e2e159-enable-email-customers-cancel',
    prompt: 'Enable email when customers cancel',
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: true,
  },
  {
    id: 'e2e159-dont-notify-me-when-cancel',
    prompt: "Don't notify me when customers cancel",
    expectedAction: 'toggle_business_email_on_customer_change' as const,
    rescueReason: 'business_email_toggle',
    enabled: false,
  },
] as const;

/** Must NOT be rescued as owner business-email toggle. */
export const E2E159_CUSTOMER_OUTBOUND_NOTIFY_NEGATIVE = [
  'Notify the customer about their cancelled booking today',
  'Send a notification to the customer regarding their cancelled booking',
  'Notify customers about the cancelled appointment',
] as const;
