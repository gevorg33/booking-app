/** prov-exp-2.4 — provider mobile stats, floor, check-in, running late AI. */

export const PROVIDER_EXP_2_CLASSIFIER_RULES = `- my_stats: READ — provider mobile only: personal or team performance rollup (completed visits, paid revenue, utilization, reviews, tips when enabled). Triggers: my stats, how am I doing, my week stats, utilization this week. Optional period=week|month, scope=mine|team (managers only for team). NOT summarize_my_revenue (earnings narrative), NOT summarize_utilization (single % only).
- team_floor_status: READ — manager/owner team view only: today's floor board counts per provider (waiting, in service, done, no-show). Triggers: team floor status, who is waiting, floor board today. NOT team_whos_next (next 2h queue), NOT show_appointments (flat list).
- check_in_client: MUTATE — check in a client for today's appointment (sets checkedInAt). Requires bookingId (session) and/or customerName; optional timeSlot. Triggers: check in Jane, client arrived, mark checked in. NOT update_bookings (generic status).
- mark_running_late: MUTATE — mark visit running late on booking metadata; optional minutesLate (default 10). Requires bookingId and/or customerName. Triggers: running 10 minutes late, I'm running late for Maria. NOT mark_no_shows, NOT mark_ready_now (opposite status).
- mark_ready_now: MUTATE — mark visit ready now on booking metadata (client/room is ready, cancels any running-late state). Requires bookingId and/or customerName. Triggers: mark Maria ready now, I'm ready for the next client, ready to be seen. NOT check_in_client (arrival, not readiness), NOT mark_running_late (opposite status).
- suggest_cancel_note: READ — AI-drafted short cancellation note for a booking about to be cancelled; optional draft to refine. Requires bookingId and/or customerName. Triggers: draft a cancellation note, write a cancel reason for Jane, suggest a cancellation message. NOT cancel_bookings (actually cancels).
- request_client_review: MUTATE — send a review request to the client for a completed booking. Requires bookingId and/or customerName. Triggers: ask Jane for a review, send a review request, request a review from this client. NOT my_stats (reads review aggregate).
- list_reassign_options: READ — live list of other providers free for this booking's exact same-day slot. Requires bookingId and/or customerName. Triggers: who else is free to take this, reassign options for this booking, which providers can cover this. NOT reassign_booking_same_day (actually reassigns).
- reassign_booking_same_day: MUTATE — reassign a booking to a different provider for the same slot today. Requires bookingId and/or customerName, plus employeeName (target provider). Triggers: reassign this to Maria, give this appointment to James. NOT list_reassign_options (read-only options), NOT change_provider_on_reschedule (customer self-service reschedule flow).`;

export const PROVIDER_EXP_2_PROMPT_SCENARIOS = [
  {
    id: 'my-stats-week-en',
    prompt: 'Show my stats this week',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-month-en',
    prompt: 'How am I doing this month?',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-utilization-en',
    prompt: 'My utilization and revenue this week',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-team-en',
    prompt: 'Team stats for the week',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
    paramsPartial: { scope: 'team' },
  },
  {
    id: 'my-stats-performance-en',
    prompt: 'Summarize my performance this week',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-reviews-en',
    prompt: 'My stats including reviews this month',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-hy',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'my-stats-ru',
    prompt: 'Моя статистика за неделю',
    surface: 'provider' as const,
    expectedAction: 'my_stats',
  },
  {
    id: 'team-floor-status-en',
    prompt: 'Team floor status today',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-waiting-en',
    prompt: 'Who is waiting on the team floor?',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-board-en',
    prompt: 'Show the floor board for all providers',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-in-service-en',
    prompt: 'Who is in service right now on the floor?',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-counts-en',
    prompt: 'Floor status counts for today',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-hy',
    prompt: 'Թիմի հարկի կարգավիճակն այսօր',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'team-floor-ru',
    prompt: 'Статус команды на зале сегодня',
    surface: 'provider' as const,
    expectedAction: 'team_floor_status',
  },
  {
    id: 'check-in-client-en',
    prompt: 'Check in Jane Doe',
    surface: 'provider' as const,
    expectedAction: 'check_in_client',
    paramsPartial: { customerName: 'Jane Doe' },
  },
  {
    id: 'check-in-arrived-en',
    prompt: 'Jane arrived — check her in',
    surface: 'provider' as const,
    expectedAction: 'check_in_client',
    paramsPartial: { customerName: 'Jane' },
  },
  {
    id: 'check-in-mark-en',
    prompt: 'Mark Sam checked in',
    surface: 'provider' as const,
    expectedAction: 'check_in_client',
    paramsPartial: { customerName: 'Sam' },
  },
  {
    id: 'check-in-client-hy',
    prompt: 'Գրանցել Jane-ի ժամանումը',
    surface: 'provider' as const,
    expectedAction: 'check_in_client',
  },
  {
    id: 'check-in-client-ru',
    prompt: 'Отметить приход клиента Jane',
    surface: 'provider' as const,
    expectedAction: 'check_in_client',
  },
  {
    id: 'running-late-10-en',
    prompt: "I'm running 10 minutes late for Jane",
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
    paramsPartial: { customerName: 'Jane', minutesLate: 10 },
  },
  {
    id: 'running-late-client-en',
    prompt: 'Mark Maria running late',
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
    paramsPartial: { customerName: 'Maria' },
  },
  {
    id: 'running-late-minutes-en',
    prompt: 'Running 15m late for my 2pm client',
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
    paramsPartial: { minutesLate: 15 },
  },
  {
    id: 'running-late-notify-en',
    prompt: 'Tell the client I am running late',
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
  },
  {
    id: 'running-late-hy',
    prompt: 'Ես 10 րոպե ուշ եմ Jane-ի համար',
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
  },
  {
    id: 'running-late-ru',
    prompt: 'Я опаздываю на 10 минут к Jane',
    surface: 'provider' as const,
    expectedAction: 'mark_running_late',
  },
  {
    id: 'ready-now-client-en',
    prompt: 'Mark Maria ready now',
    surface: 'provider' as const,
    expectedAction: 'mark_ready_now',
    paramsPartial: { customerName: 'Maria' },
  },
  {
    id: 'ready-now-self-en',
    prompt: "I'm ready for the next client",
    surface: 'provider' as const,
    expectedAction: 'mark_ready_now',
  },
  {
    id: 'ready-to-be-seen-en',
    prompt: 'Ready to be seen',
    surface: 'provider' as const,
    expectedAction: 'mark_ready_now',
  },
  {
    id: 'suggest-cancel-note-en',
    prompt: 'Draft a cancellation note for Jane',
    surface: 'provider' as const,
    expectedAction: 'suggest_cancel_note',
    paramsPartial: { customerName: 'Jane' },
  },
  {
    id: 'suggest-cancel-note-generic-en',
    prompt: 'Suggest a cancel reason for this booking',
    surface: 'provider' as const,
    expectedAction: 'suggest_cancel_note',
  },
  {
    id: 'request-client-review-en',
    prompt: 'Ask Jane for a review',
    surface: 'provider' as const,
    expectedAction: 'request_client_review',
    paramsPartial: { customerName: 'Jane' },
  },
  {
    id: 'request-review-generic-en',
    prompt: 'Send a review request for this booking',
    surface: 'provider' as const,
    expectedAction: 'request_client_review',
  },
  {
    id: 'list-reassign-options-en',
    prompt: 'Who else is free to take this appointment instead?',
    surface: 'provider' as const,
    expectedAction: 'list_reassign_options',
  },
  {
    id: 'reassign-options-generic-en',
    prompt: 'Reassign options for this booking',
    surface: 'provider' as const,
    expectedAction: 'list_reassign_options',
  },
  {
    id: 'reassign-booking-same-day-en',
    prompt: 'Reassign this to Maria',
    surface: 'provider' as const,
    expectedAction: 'reassign_booking_same_day',
    paramsPartial: { employeeName: 'Maria' },
  },
] as const;
