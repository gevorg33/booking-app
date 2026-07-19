/** ai-cmd-provider-5.1.5 — provider mobile "walk me through my day" narrative + gap chips from ProviderTodayTimeline. */

export const PROVIDER_EXPLAIN_TODAY_TIMELINE_CLASSIFIER_RULES = `- explain_today_timeline: READ — provider mobile own calendar only: narrative walkthrough of today's bookings in order, calling out gaps between clients (ProviderTodayTimeline segments). Triggers: walk me through my day, talk me through today, gaps between my clients today, what does my day look like, any breaks today. NOT summarize_day (status-breakdown by confirmed/completed/no-show, not a chronological walkthrough), NOT show_appointments (flat list, no gap narrative), NOT fill_unused_slots (afternoon-gap availability action, mutate-adjacent).`;

export const PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS = [
  {
    id: 'explain-today-timeline-walk-me-en',
    prompt: 'Walk me through my day',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-gaps-clients-en',
    prompt: 'Gaps between clients?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-talk-me-en',
    prompt: 'Talk me through today',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-look-like-en',
    prompt: 'What does my day look like?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-any-breaks-en',
    prompt: 'Any breaks today?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-timeline-en',
    prompt: 'Show me my timeline for today',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-gap-between-appts-en',
    prompt: 'Any gaps between my appointments today?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-walk-through-schedule-en',
    prompt: 'Walk me through my schedule for today',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-breaks-between-en',
    prompt: 'Do I have breaks between clients today?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-downtime-en',
    prompt: "What's my downtime today?",
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-hy',
    prompt: 'Պատմիր իմ օրվա մասին',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-gaps-hy',
    prompt: 'Կան դադարներ իմ հաճախորդների միջև',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-ru',
    prompt: 'Расскажи о моём дне',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
  {
    id: 'explain-today-timeline-gaps-ru',
    prompt: 'Есть окна между клиентами сегодня?',
    surface: 'provider' as const,
    expectedAction: 'explain_today_timeline',
  },
] as const;
