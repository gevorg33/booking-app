export type NotifyRunningLatePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'notify_running_late';
  rescueReason: 'notify_running_late';
  minutesLate?: number;
  serviceName?: string;
};

export const CUSTOMER_NOTIFY_RUNNING_LATE_CLASSIFIER_RULES = `- notify_running_late: MUTATE — logged-in customer tells the salon they are running late for their own upcoming appointment. Triggers: I'm 15 minutes late, running late for my appointment, notify the salon I'm late, tell them I'll be 10 min behind. Set minutesLate when extracted (default 10). Set bookingId when known; otherwise serviceName and/or date/timeSlot to pick the visit. Uses POST /me/bookings/:id/running-late and emails staff when business notifications are enabled. NOT mark_running_late (provider marks client late), NOT send_client_message (provider texts client), NOT reschedule_my_booking (move time), NOT cancel_my_booking, NOT explain_cancel_policy.`;

export const NOTIFY_RUNNING_LATE_PROMPTS: readonly NotifyRunningLatePromptFixture[] =
  [
    {
      id: 'minutes-late-customer',
      prompt: "I'm 15 minutes late",
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 15,
    },
    {
      id: 'running-late-appointment-customer',
      prompt: 'Running late for my appointment',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'notify-salon-late-customer',
      prompt: 'Notify the salon I am running late',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'ten-min-late-customer',
      prompt: "I'll be 10 minutes late for my booking",
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 10,
    },
    {
      id: 'tell-them-late-customer',
      prompt: 'Tell them I am 20 min late for my haircut',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 20,
      serviceName: 'haircut',
    },
    {
      id: 'running-behind-customer',
      prompt: 'Running behind for my massage today',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      serviceName: 'massage',
    },
    {
      id: 'stuck-traffic-customer',
      prompt: "Stuck in traffic — I'm late for my visit",
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'five-min-late-customer',
      prompt: 'Running 5 minutes late',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 5,
    },
    {
      id: 'let-salon-know-customer',
      prompt: 'Let the salon know I am running 12 minutes late',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 12,
    },
    {
      id: 'im-late-customer',
      prompt: "I'm late for my appointment",
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'ping-salon-late-customer',
      prompt: 'Ping the salon — 15 min late for my facial',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 15,
      serviceName: 'facial',
    },
    {
      id: 'on-my-way-late-customer',
      prompt: "On my way but 25 minutes late for today's booking",
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 25,
    },
  ];

export const NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-cancel',
    prompt: "I'm 15 minutes late",
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'notify_running_late' as const,
  },
  {
    id: 'misclassified-reschedule',
    prompt: 'Notify the salon I am running late',
    misclassifiedAction: 'reschedule_my_booking',
    expectedAction: 'notify_running_late' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: "I'll be 10 minutes late for my booking",
    misclassifiedAction: 'unknown',
    expectedAction: 'notify_running_late' as const,
  },
];

export const NOTIFY_RUNNING_LATE_BOUNDARY_PROMPTS = [
  {
    id: 'provider-mark-client',
    prompt: 'Mark Maria running late',
    surface: 'customer' as const,
  },
  {
    id: 'provider-text-client',
    prompt: 'Text Jane that I am running late',
    surface: 'customer' as const,
  },
  {
    id: 'reschedule-not-late',
    prompt: 'Move my visit to Friday 3pm',
    surface: 'customer' as const,
  },
];
