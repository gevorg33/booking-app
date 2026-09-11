/** prov-exp-1 / ai-cmd-provider-5.10.3 — provider mobile explain the most recent push notification/alert. */

export const PROVIDER_EXPLAIN_LAST_PUSH_CLASSIFIER_RULES = `- explain_last_push: READ — explain what the most recent push notification/alert said (inherit lastPush from session). Triggers: what was that alert, explain my last notification, what did that push say, tell me about my last push. NOT open_booking_from_push (navigates to the booking instead of explaining), NOT list_push_notifications (full inbox, not just the last one).`;

export const PROVIDER_EXPLAIN_LAST_PUSH_PROMPT_SCENARIOS = [
  {
    id: 'explain-last-push-what-alert-en',
    prompt: 'What was that alert?',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-last-notification-en',
    prompt: 'Explain my last notification',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-that-push-en',
    prompt: 'Explain that push',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-what-was-push-en',
    prompt: 'What was that push notification?',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-tell-me-en',
    prompt: 'Tell me about my last push',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-decode-en',
    prompt: 'Decode that alert',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-understand-en',
    prompt: 'Understand this notification',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-what-did-say-en',
    prompt: 'What did that push say?',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-explain-alert-en',
    prompt: 'Explain this alert',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-what-was-last-en',
    prompt: 'What was my last notification?',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-hy',
    prompt: 'Ի՞նչ էր այդ ծանուցումը',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-explain-hy',
    prompt: 'Բացատրիր իմ վերջին push-ը',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-ru',
    prompt: 'Что было в этом уведомлении?',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
  {
    id: 'explain-last-push-explain-ru',
    prompt: 'Объясни мой последний push',
    surface: 'provider' as const,
    expectedAction: 'explain_last_push',
  },
] as const;
