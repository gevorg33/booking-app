/** Provider classifier rules for HIPAA session timeout (ai-cmd-compliance-20). */
export const PROVIDER_SESSION_TIMEOUT_CLASSIFIER_RULES = `- explain_provider_session_timeout: READ — clinic only: explain when the provider mobile app auto-logs out after inactivity using business HIPAA sessionTimeoutMinutes (compliance-1.13 provider deferred). Triggers: when/what/how long + provider app/mobile app + log out/session timeout/inactivity. NOT explain_provider_date_display (date/time formatting), NOT dashboard explain_hipaa_session_timeout (owner dashboard wording), and NOT configure_hipaa_session_timeout (mutate).
  - "When will the provider app log me out?" → explain_provider_session_timeout
  - "What is the provider mobile app session timeout?" → explain_provider_session_timeout
  - "How long before the provider app logs me out for inactivity?" → explain_provider_session_timeout`;

export const EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS = [
  {
    id: 'when-will-provider-app-logout',
    prompt: 'When will the provider app log me out?',
  },
  {
    id: 'provider-mobile-session-timeout',
    prompt: 'What is the provider mobile app session timeout?',
  },
  {
    id: 'provider-app-inactivity-logout',
    prompt: 'How long before the provider app logs me out for inactivity?',
  },
  {
    id: 'provider-app-auto-logout',
    prompt: 'When does the provider mobile app auto logout?',
  },
] as const;
