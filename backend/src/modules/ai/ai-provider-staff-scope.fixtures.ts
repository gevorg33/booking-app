/** Staff / provider scoped ops (parity-2.2). */
export const PROVIDER_STAFF_SCOPE_CLASSIFIER_RULES = `- update_bookings (check-in): MUTATE — provider/staff marks own assigned appointment in progress. Triggers: check in, checked in, start appointment, mark in progress. Sets status=in_progress on own calendar only. NOT mark_paid (payment) and NOT cancel_bookings.
- update_bookings (notes): MUTATE — provider/staff adds or updates appointment notes on own assigned booking. Triggers: add/update/set/save + note(s). Requires notes text or bookingId. NOT cancel_bookings and NOT lookup_customer.
- show_appointments (who's next): READ — provider own calendar; next upcoming assigned appointment today. Triggers: who's next, next appointment, next client. Sets statusFilter=upcoming. NOT list_employees.
- list_bookings (assigned): READ — provider/staff lists own assigned bookings for a day. Triggers: my appointments today, assigned bookings, what's on my schedule. Scoped to linked employeeId automatically for staff tier.
- block_schedule (break): MUTATE — provider blocks lunch/break on own calendar only. Triggers: block lunch, block break, block 12:00-13:00. NOT cancel_bookings.`;

export const DASHBOARD_STAFF_SCOPE_CLASSIFIER_RULES = `- update_bookings (staff check-in): MUTATE — staff checks in their own assigned booking (status=in_progress). Triggers: check in, mark in progress on my appointment. Staff tier is scoped to own employeeId — NOT team-wide update_bookings.
- update_bookings (staff notes): MUTATE — staff updates notes on own assigned booking only. Triggers: add note, update notes on appointment. Requires notes or bookingId. Staff scoped to own calendar.
- show_appointments / check_availability (own schedule): READ — staff views own schedule and open slots. Triggers: my schedule, am I free at, show my appointments. Scoped to staff employeeId.
- list_bookings (assigned): READ — staff lists bookings assigned to them. Triggers: my bookings today, assigned appointments. Scoped to staff employeeId.`;

export const PROVIDER_STAFF_SCOPE_SCENARIOS = [
  {
    id: 'check-in-today',
    prompt: 'Check in Anna for her 2pm appointment',
    surface: 'provider' as const,
    expectedAction: 'update_bookings' as const,
    status: 'in_progress',
  },
  {
    id: 'start-visit',
    prompt: 'Start the appointment — mark in progress',
    surface: 'provider' as const,
    expectedAction: 'update_bookings' as const,
    status: 'in_progress',
  },
  {
    id: 'add-note',
    prompt: 'Add note: client prefers window seat',
    surface: 'provider' as const,
    expectedAction: 'update_bookings' as const,
  },
  {
    id: 'save-notes',
    prompt: 'Save notes on this booking: allergic to latex',
    surface: 'provider' as const,
    expectedAction: 'update_bookings' as const,
  },
  {
    id: 'whos-next',
    prompt: "Who's next on my schedule?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments' as const,
  },
  {
    id: 'my-bookings-today',
    prompt: 'List my assigned bookings today',
    surface: 'provider' as const,
    expectedAction: 'list_bookings' as const,
  },
  {
    id: 'my-schedule',
    prompt: "What's on my schedule today?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments' as const,
  },
  {
    id: 'block-lunch',
    prompt: 'Block lunch break 12:00 to 13:00 today',
    surface: 'provider' as const,
    expectedAction: 'block_schedule' as const,
  },
  {
    id: 'block-break',
    prompt: 'Block my break from 15:00 to 15:15',
    surface: 'provider' as const,
    expectedAction: 'block_schedule' as const,
  },
  {
    id: 'check-availability-own',
    prompt: 'Am I free at 4pm tomorrow?',
    surface: 'provider' as const,
    expectedAction: 'check_availability' as const,
  },
] as const;

export const DASHBOARD_STAFF_SCOPE_SCENARIOS = [
  {
    id: 'staff-check-in',
    prompt: 'Check in my 10am appointment',
    surface: 'dashboard' as const,
    expectedAction: 'update_bookings' as const,
    status: 'in_progress',
  },
  {
    id: 'staff-add-note',
    prompt: 'Add a note to my appointment: running 10 minutes late',
    surface: 'dashboard' as const,
    expectedAction: 'update_bookings' as const,
  },
  {
    id: 'staff-my-schedule',
    prompt: 'Show my schedule for today',
    surface: 'dashboard' as const,
    expectedAction: 'show_appointments' as const,
  },
  {
    id: 'staff-assigned-list',
    prompt: 'List my assigned bookings today',
    surface: 'dashboard' as const,
    expectedAction: 'list_bookings' as const,
  },
  {
    id: 'staff-own-availability',
    prompt: 'Check my availability tomorrow afternoon',
    surface: 'dashboard' as const,
    expectedAction: 'check_availability' as const,
  },
  {
    id: 'staff-block-break',
    prompt: 'Block lunch on my schedule today',
    surface: 'dashboard' as const,
    expectedAction: 'block_schedule' as const,
  },
  {
    id: 'staff-mark-in-progress',
    prompt: 'Mark my next appointment as in progress',
    surface: 'dashboard' as const,
    expectedAction: 'update_bookings' as const,
    status: 'in_progress',
  },
  {
    id: 'staff-update-notes',
    prompt: 'Update notes on my booking with VIP preference',
    surface: 'dashboard' as const,
    expectedAction: 'update_bookings' as const,
  },
  {
    id: 'staff-my-appointments',
    prompt: 'What appointments are assigned to me today?',
    surface: 'dashboard' as const,
    expectedAction: 'list_bookings' as const,
  },
  {
    id: 'staff-open-slots',
    prompt: 'Do I have open slots this afternoon?',
    surface: 'dashboard' as const,
    expectedAction: 'check_availability' as const,
  },
] as const;
