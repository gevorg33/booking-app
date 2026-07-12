/** ai-cmd-provider-5.1.4 — thin alias: "who's next" style prompts route to show_appointments, narrowed to the single next upcoming slot. */

export const PROVIDER_WHO_IS_NEXT_CLASSIFIER_RULES = `- who_is_next: READ — thin alias for show_appointments, scoped to own calendar only and narrowed to the single next upcoming appointment (statusFilter=upcoming, nextOnly). Triggers: who's my next client, who's next, next appointment, what's my next booking. NOT team_whos_next (manager cross-team queue for the next 2 hours).`;

export const PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS = [
  {
    id: 'who-is-next-my-client-en',
    prompt: "Who's my next client?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-appointment-en',
    prompt: 'Next appointment',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-plain-en',
    prompt: "Who's next?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-is-next-en',
    prompt: 'Who is next?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-booking-en',
    prompt: "What's my next booking?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-do-i-have-en',
    prompt: 'Who do I have next?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-client-en',
    prompt: "Who's my next client today?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-tell-me-en',
    prompt: 'Tell me who is next',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-upcoming-client-en',
    prompt: "Who's my next appointment with?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-whos-up-en',
    prompt: "Who's up next?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-hy',
    prompt: 'Ո՞վ է հաջորդը',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-client-hy',
    prompt: 'Ո՞վ է իմ հաջորդ հաճախորդը',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-ru',
    prompt: 'Кто следующий?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'who-is-next-client-ru',
    prompt: 'Кто мой следующий клиент?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
] as const;
