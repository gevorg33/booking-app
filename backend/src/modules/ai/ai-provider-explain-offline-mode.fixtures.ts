/** ai-cmd-provider-5.13.3 — provider mobile: why the provider app is offline / whether queued actions will sync. */

export const PROVIDER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES = `- explain_offline_mode (provider): READ — provider mobile only: why the provider app shows offline, and whether queued actions (check-in, notes, mark paid) sync when back online (general offline copy, not a queue listing). Requires provider-app context (e.g. "provider app", "staff app", "today tab") to disambiguate from the customer-surface "explain_offline_mode". Triggers: why does the provider app say offline, will my changes sync when I'm back online, explain offline mode on the staff app. NOT offline_queue_status (lists what's actually queued right now), NOT retry_offline_action (mutate — replays the queue).`;

export const PROVIDER_EXPLAIN_OFFLINE_MODE_PROMPT_SCENARIOS = [
  { id: 'provider-offline-mode-why-app-en', prompt: 'Why does the provider app say offline?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-will-sync-en', prompt: "Will my changes sync when I'm back online on the provider app?", surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-staff-app-en', prompt: 'Explain offline mode on the staff app', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-today-tab-en', prompt: "Why is the Today tab showing offline?", surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-what-happens-en', prompt: 'What happens to my check-ins if the provider app goes offline?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-back-online-en', prompt: 'Will my provider mobile actions sync once back online?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-floor-status-en', prompt: 'Why is floor status offline right now?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-how-works-en', prompt: 'How does offline mode work on the provider app?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-no-internet-en', prompt: 'The provider app has no internet — what does that mean?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-reconnect-en', prompt: 'What happens on the staff app when I reconnect?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-hy', prompt: 'Ինչու՞ է provider app-ը ցույց տալիս offline', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-sync-hy', prompt: 'Իմ փոփոխությունները կհամաժամացվե՞ն երբ staff app-ը կրկին online լինի', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-ru', prompt: 'Почему provider app показывает офлайн?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
  { id: 'provider-offline-mode-sync-ru', prompt: 'Мои изменения синхронизируются, когда staff app снова онлайн?', surface: 'provider' as const, expectedAction: 'explain_offline_mode' },
] as const;
