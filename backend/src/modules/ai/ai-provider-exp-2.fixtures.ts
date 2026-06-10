/** prov-exp-2.4 — provider mobile stats, floor, check-in, running late AI. */

export const PROVIDER_EXP_2_CLASSIFIER_RULES = `- my_stats: READ — provider mobile only: personal or team performance rollup (completed visits, paid revenue, utilization, reviews, tips when enabled). Triggers: my stats, how am I doing, my week stats, utilization this week. Optional period=week|month, scope=mine|team (managers only for team). NOT summarize_my_revenue (earnings narrative), NOT summarize_utilization (single % only).
- team_floor_status: READ — manager/owner team view only: today's floor board counts per provider (waiting, in service, done, no-show). Triggers: team floor status, who is waiting, floor board today. NOT team_whos_next (next 2h queue), NOT show_appointments (flat list).
- check_in_client: MUTATE — check in a client for today's appointment (sets checkedInAt). Requires bookingId (session) and/or customerName; optional timeSlot. Triggers: check in Jane, client arrived, mark checked in. NOT update_bookings (generic status).
- mark_running_late: MUTATE — mark visit running late on booking metadata; optional minutesLate (default 10). Requires bookingId and/or customerName. Triggers: running 10 minutes late, I'm running late for Maria. NOT mark_no_shows, NOT ready_now unless user says ready now (separate future action).`;

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
] as const;
