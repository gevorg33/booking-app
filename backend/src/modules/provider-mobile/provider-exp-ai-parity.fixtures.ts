/** prov-exp-11 — every shipped prov-exp UI action maps to provider AI or is dashboard-only. */

export type ProviderExpAiParityCoverage =
  | { kind: 'provider-ai'; intents: readonly string[] }
  | { kind: 'dashboard-only'; dashboardReason: string };

export interface ProviderExpUiActionParity {
  id: string;
  taskId: string;
  screen: string;
  uiAction: string;
  coverage: ProviderExpAiParityCoverage;
  notes?: string;
}

/** Sprint 62 waitlist slices — not shipped; excluded from prov-exp-11 gate. */
export const PROVIDER_EXP_DEFERRED_TASK_IDS = [
  'prov-exp-8.1',
  'prov-exp-8.2',
] as const;

export const PROVIDER_EXP_UI_AI_PARITY: readonly ProviderExpUiActionParity[] = [
  // prov-exp-1 — customer context at the chair
  {
    id: 'exp-1-1-view-customer-snapshot',
    taskId: 'prov-exp-1.1',
    screen: 'Booking detail',
    uiAction: 'View customer snapshot card',
    coverage: { kind: 'provider-ai', intents: ['summarize_client'] },
  },
  {
    id: 'exp-1-1-tap-call',
    taskId: 'prov-exp-1.1',
    screen: 'Booking detail',
    uiAction: 'Tap phone to call client',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Native tel: deep link — messaging parity via send_client_message',
    },
    notes: 'Call is OS-level; AI covers SMS/WhatsApp via send_client_message',
  },
  {
    id: 'exp-1-2-visit-history',
    taskId: 'prov-exp-1.2',
    screen: 'Booking detail',
    uiAction: 'View visit history strip / tap for history',
    coverage: { kind: 'provider-ai', intents: ['show_client_history'] },
  },
  {
    id: 'exp-1-3-add-staff-note',
    taskId: 'prov-exp-1.3',
    screen: 'Booking detail',
    uiAction: 'Add staff note on customer',
    coverage: { kind: 'provider-ai', intents: ['add_client_note'] },
  },
  {
    id: 'exp-1-4-package-badges',
    taskId: 'prov-exp-1.4',
    screen: 'Booking detail',
    uiAction: 'View package / subscription / multi-service badges',
    coverage: {
      kind: 'provider-ai',
      intents: [
        'summarize_client',
        'list_my_package_visits',
        'list_my_multi_service_groups',
      ],
    },
  },
  {
    id: 'exp-1-5-pre-visit-intake',
    taskId: 'prov-exp-1.5',
    screen: 'Booking detail',
    uiAction: 'View pre-visit intake summary',
    coverage: { kind: 'provider-ai', intents: ['summarize_client'] },
    notes: 'Full questionnaire editing remains dashboard-only',
  },
  {
    id: 'exp-1-5-intake-full-answers',
    taskId: 'prov-exp-1.5',
    screen: 'Booking detail',
    uiAction: 'Open full intake answers (manager link)',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason: 'Clinical/intake admin and PHI review on dashboard web',
    },
  },
  // prov-exp-2 — stats & reputation
  {
    id: 'exp-2-1-my-stats',
    taskId: 'prov-exp-2.1',
    screen: 'Profile / Insights',
    uiAction: 'View personal stats (week/month rollup)',
    coverage: {
      kind: 'provider-ai',
      intents: ['my_stats', 'summarize_my_revenue'],
    },
  },
  {
    id: 'exp-2-1-team-stats-toggle',
    taskId: 'prov-exp-2.1',
    screen: 'Profile / Insights',
    uiAction: 'Manager team stats toggle',
    coverage: { kind: 'provider-ai', intents: ['my_stats'] },
    notes: 'scope=team param on my_stats',
  },
  {
    id: 'exp-2-2-reviews-inbox',
    taskId: 'prov-exp-2.2',
    screen: 'Profile',
    uiAction: 'Browse reviews inbox with filters',
    coverage: { kind: 'provider-ai', intents: ['my_stats'] },
    notes: 'Review list is UI; AI summarizes via my_stats',
  },
  {
    id: 'exp-2-2-request-review',
    taskId: 'prov-exp-2.2',
    screen: 'Profile',
    uiAction: 'Request review from client',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Review request policy and triggers configured on dashboard',
    },
  },
  {
    id: 'exp-2-3-tip-totals',
    taskId: 'prov-exp-2.3',
    screen: 'Profile / Insights',
    uiAction: 'View tip totals when tips enabled',
    coverage: {
      kind: 'provider-ai',
      intents: ['my_stats', 'summarize_my_revenue'],
    },
  },
  // prov-exp-3 — check-in & timeline
  {
    id: 'exp-3-1-check-in',
    taskId: 'prov-exp-3.1',
    screen: 'Today / Booking detail',
    uiAction: 'Check in client',
    coverage: { kind: 'provider-ai', intents: ['check_in_client'] },
  },
  {
    id: 'exp-3-2-running-late',
    taskId: 'prov-exp-3.2',
    screen: 'Booking detail',
    uiAction: 'Mark running late / ready now',
    coverage: { kind: 'provider-ai', intents: ['mark_running_late'] },
  },
  {
    id: 'exp-3-3-today-timeline',
    taskId: 'prov-exp-3.3',
    screen: 'Today',
    uiAction: 'View compact today timeline',
    coverage: {
      kind: 'provider-ai',
      intents: [
        'show_appointments',
        'summarize_day',
        'summarize_my_appointments',
      ],
    },
  },
  // prov-exp-4 — manager floor
  {
    id: 'exp-4-1-team-floor',
    taskId: 'prov-exp-4.1',
    screen: 'Today (manager)',
    uiAction: 'View team floor board',
    coverage: { kind: 'provider-ai', intents: ['team_floor_status'] },
  },
  {
    id: 'exp-4-2-reassign-booking',
    taskId: 'prov-exp-4.2',
    screen: 'Booking detail (manager)',
    uiAction: 'Reassign booking to another provider same day',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Same-day reassignment uses dedicated mobile API; AI reschedule_booking moves time slots — complex multi-service reassignment stays dashboard',
    },
    notes:
      'Simple same-day reassign is manager UI; AI uses dashboard reassign_cancelled / operations flows',
  },
  {
    id: 'exp-4-3-whos-next',
    taskId: 'prov-exp-4.3',
    screen: 'Today (manager)',
    uiAction: "View who's next across team (2h queue)",
    coverage: { kind: 'provider-ai', intents: ['team_whos_next'] },
  },
  // prov-exp-5 — retail
  {
    id: 'exp-5-1-retail-cart-add',
    taskId: 'prov-exp-5.1',
    screen: 'Booking detail',
    uiAction: 'Add retail product to booking cart',
    coverage: {
      kind: 'provider-ai',
      intents: ['add_retail_to_booking', 'suggest_retail_upsell'],
    },
  },
  {
    id: 'exp-5-1-retail-cart-save',
    taskId: 'prov-exp-5.1',
    screen: 'Booking detail',
    uiAction: 'Save retail cart on booking',
    coverage: { kind: 'provider-ai', intents: ['add_retail_to_booking'] },
  },
  {
    id: 'exp-5-2-retail-search',
    taskId: 'prov-exp-5.2',
    screen: 'Booking detail',
    uiAction: 'Search SKU / quick-add product',
    coverage: { kind: 'provider-ai', intents: ['add_retail_to_booking'] },
  },
  // prov-exp-6 — communications
  {
    id: 'exp-6-1-sms-whatsapp',
    taskId: 'prov-exp-6.1',
    screen: 'Booking detail',
    uiAction: 'Open SMS or WhatsApp to client',
    coverage: { kind: 'provider-ai', intents: ['send_client_message'] },
  },
  {
    id: 'exp-6-2-canned-template',
    taskId: 'prov-exp-6.2',
    screen: 'Booking detail',
    uiAction: 'Pick canned message template',
    coverage: { kind: 'provider-ai', intents: ['send_client_message'] },
  },
  {
    id: 'exp-6-2-edit-templates',
    taskId: 'prov-exp-6.2',
    screen: 'Dashboard settings',
    uiAction: 'Edit canned message templates',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Template CRUD is business admin configuration on dashboard web',
    },
  },
  // prov-exp-7 — schedule self-service
  {
    id: 'exp-7-1-self-block',
    taskId: 'prov-exp-7.1',
    screen: 'Schedule',
    uiAction: 'Block lunch / break on own calendar',
    coverage: {
      kind: 'provider-ai',
      intents: ['block_my_time', 'block_schedule'],
    },
  },
  {
    id: 'exp-7-2-request-time-off',
    taskId: 'prov-exp-7.2',
    screen: 'Schedule',
    uiAction: 'Submit time-off request',
    coverage: { kind: 'provider-ai', intents: ['request_time_off'] },
  },
  {
    id: 'exp-7-2-list-time-off',
    taskId: 'prov-exp-7.2',
    screen: 'Schedule',
    uiAction: 'View own time-off request status',
    coverage: { kind: 'provider-ai', intents: ['list_my_time_off_requests'] },
  },
  {
    id: 'exp-7-2-approve-time-off',
    taskId: 'prov-exp-7.2',
    screen: 'Dashboard',
    uiAction: 'Approve or deny time-off request',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Manager approval uses dashboard approve_time_off_request / deny_time_off_request',
    },
  },
  {
    id: 'exp-7-3-open-shifts-fill-gap',
    taskId: 'prov-exp-7.3',
    screen: 'Calendar',
    uiAction: 'Tap open shift gap → fill with waitlist suggestion',
    coverage: {
      kind: 'provider-ai',
      intents: ['suggest_waitlist_for_gap', 'fill_unused_slots'],
    },
  },
  // prov-exp-9 — growth hints (read-only)
  {
    id: 'exp-9-1-customer-badges',
    taskId: 'prov-exp-9.1',
    screen: 'Booking detail',
    uiAction: 'View referral / first-visit / win-back badges',
    coverage: { kind: 'provider-ai', intents: ['summarize_client'] },
  },
  {
    id: 'exp-9-2-loyalty-quick-view',
    taskId: 'prov-exp-9.2',
    screen: 'Booking detail',
    uiAction: 'View loyalty balance and last earn/redeem',
    coverage: { kind: 'provider-ai', intents: ['summarize_client'] },
  },
  {
    id: 'exp-9-2-adjust-loyalty',
    taskId: 'prov-exp-9.2',
    screen: 'Dashboard',
    uiAction: 'Adjust loyalty points',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Point adjustments are dashboard CRM / admin AI only (adjust_loyalty)',
    },
  },
  // prov-exp-10 — notifications & polish
  {
    id: 'exp-10-1-notification-center',
    taskId: 'prov-exp-10.1',
    screen: 'Profile / header',
    uiAction: 'Open in-app notification center',
    coverage: { kind: 'provider-ai', intents: ['explain_last_push'] },
  },
  {
    id: 'exp-10-1-open-booking-from-push',
    taskId: 'prov-exp-10.1',
    screen: 'Notification center',
    uiAction: 'Tap notification → open booking',
    coverage: {
      kind: 'provider-ai',
      intents: ['open_booking_from_push', 'confirm_booking_from_push'],
    },
  },
  {
    id: 'exp-10-1-dismiss-push',
    taskId: 'prov-exp-10.1',
    screen: 'Notification center',
    uiAction: 'Dismiss / mark notification read',
    coverage: { kind: 'provider-ai', intents: ['dismiss_push'] },
  },
  {
    id: 'exp-10-2-calendar-month',
    taskId: 'prov-exp-10.2',
    screen: 'Calendar',
    uiAction: 'Browse month grid with utilization bands',
    coverage: {
      kind: 'provider-ai',
      intents: ['check_availability', 'summarize_utilization'],
    },
  },
  {
    id: 'exp-10-3-a11y-settings',
    taskId: 'prov-exp-10.3',
    screen: 'App (global)',
    uiAction: 'Font scale / hit-target accessibility preferences',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Local device UI preferences — no provider AI command surface',
    },
  },
  {
    id: 'exp-10-4-locale-switch',
    taskId: 'prov-exp-10.4',
    screen: 'Profile',
    uiAction: 'Switch app language (EN/HY/RU)',
    coverage: {
      kind: 'dashboard-only',
      dashboardReason:
        'Locale picker is client UI — not an operational AI intent',
    },
  },
];
