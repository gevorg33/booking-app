/** ai-cmd-provider-5.13.6 — provider mobile: why the provider app is gating on an app-store update. */

export const PROVIDER_EXPLAIN_APP_UPDATE_GATE_CLASSIFIER_RULES = `- explain_app_update_gate: READ — provider mobile only: why the provider app is blocking or nudging for an update (AppVersionGate on the staff/provider app). Requires provider-app context (e.g. "provider app", "staff app") to disambiguate from the customer-surface "explain_app_update_required". Triggers: why must I update the provider app, skip this update for now on the staff app, update required on the provider app, kill switch on staff app. NOT explain_offline_mode (network offline, not version gating), NOT explain_push_setup (notification permissions).`;

export const PROVIDER_EXPLAIN_APP_UPDATE_GATE_PROMPT_SCENARIOS = [
  { id: 'provider-app-update-gate-why-en', prompt: 'Why must I update the provider app?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-skip-en', prompt: 'Skip this update for now on the staff app', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-required-en', prompt: 'Why is update required on the provider app?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-kill-switch-en', prompt: 'What does kill switch mean on the staff app?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-version-blocked-en', prompt: 'My provider app version is blocked — why?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-not-now-en', prompt: 'What happens if I tap not now on the provider app update banner?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-explain-en', prompt: 'Explain the app update gate on the staff app', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-minimum-en', prompt: 'What is the minimum version for the provider app?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-newer-version-en', prompt: 'There is a newer version on the staff app — do I have to update?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-store-en', prompt: 'Why does the provider app want me to update from the app store?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-hy', prompt: 'Ինչու՞ պետք է թարմացնեմ provider app-ը', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-skip-hy', prompt: 'Բաց թողնել թարմացումը staff app-ում հիմա', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-ru', prompt: 'Почему нужно обновить provider app?', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
  { id: 'provider-app-update-gate-skip-ru', prompt: 'Пропустить обновление на staff app сейчас', surface: 'provider' as const, expectedAction: 'explain_app_update_gate' },
] as const;
