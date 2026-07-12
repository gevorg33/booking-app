/** ai-cmd-provider-5.19.6 — static explainer: why full intake/PHI editing requires the dashboard. */

export const PROVIDER_HANDOFF_TO_DASHBOARD_PHI_CLASSIFIER_RULES = `- handoff_to_dashboard_phi (provider): READ — provider mobile only: static explainer for why full pre-visit intake / PHI editing isn't available on mobile and requires the dashboard. Triggers: open full intake on dashboard, why can't I edit intake here. NOT explain_client_intake (reads the actual intake answers for this booking).`;

export const HANDOFF_TO_DASHBOARD_PHI_PROMPT_SCENARIOS = [
  { id: 'handoff-phi-open-full-intake-en', prompt: 'Open full intake on dashboard', surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
  { id: 'handoff-phi-why-cant-edit-en', prompt: "Why can't I edit intake here?", surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
  { id: 'handoff-phi-cannot-edit-en', prompt: 'Why cannot I edit the intake on my phone?', surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
  { id: 'handoff-phi-full-intake-dashboard-en', prompt: 'Where do I see the full intake on the dashboard?', surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
  { id: 'handoff-phi-hy', prompt: 'Բացել ամբողջական հարցաթերթը dashboard-ում', surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
  { id: 'handoff-phi-ru', prompt: 'Открыть полную анкету в dashboard', surface: 'provider' as const, expectedAction: 'handoff_to_dashboard_phi' },
] as const;
