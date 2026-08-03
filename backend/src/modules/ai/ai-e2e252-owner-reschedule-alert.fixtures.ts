/**
 * e2e-bug.252 — owner alert toggle must match "a customer reschedules"
 * (third-person -s) the same way e2e-bug.159 already matches "cancels".
 */
export type E2e252OwnerRescheduleAlertScenario = {
  id: string;
  prompt: string;
  expectToggle: boolean;
  enabled?: boolean;
};

export const E2E252_OWNER_RESCHEDULE_ALERT_SCENARIOS: readonly E2e252OwnerRescheduleAlertScenario[] =
  [
    {
      id: 'canon-every-time-a-customer-reschedules',
      prompt:
        'Alert me every time a customer reschedules their appointment',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'whenever-a-customer-reschedules',
      prompt: 'Alert me whenever a customer reschedules',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'notify-me-when-a-customer-reschedules',
      prompt: 'Notify me when a customer reschedules a booking',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'email-me-whenever-a-customer-reschedules',
      prompt: 'Email me whenever a customer reschedules',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'tell-me-if-a-customer-reschedules',
      prompt: 'Tell me if a customer reschedules their visit',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'customers-reschedule-still-works',
      prompt: 'Alert me whenever customers reschedule their appointment',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'cancel-s-regression',
      prompt: 'Alert me whenever a customer cancels',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'enable-email-when-customer-reschedules',
      prompt: 'Enable email when a customer reschedules',
      expectToggle: true,
      enabled: true,
    },
    {
      id: 'turn-off-when-customer-reschedules',
      prompt: 'Turn off email alerts when a customer reschedules',
      expectToggle: true,
      enabled: false,
    },
    {
      id: 'voice-alert-me-customer-reschedules',
      prompt: 'alert me whenever a customer reschedules please',
      expectToggle: true,
      enabled: true,
    },
  ];

/** Must stay off the owner toggle (customer-outbound notify). */
export const E2E252_CUSTOMER_OUTBOUND_NEGATIVE: readonly string[] = [
  'Notify the customer about their rescheduled booking',
  'Send a notification to the customer regarding their reschedule',
];
