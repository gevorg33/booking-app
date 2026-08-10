/** ai-cmd-provider-6.10.1 — provider mobile: read the signed-in provider's own live profile (GET …/profile). */

export const PROVIDER_SHOW_PROFILE_CLASSIFIER_RULES = `- show_provider_profile: READ — live read of the signed-in provider's own profile (name, title, avatar, contact info). Triggers: "What's my current title?", "Show my profile", "What avatar am I using?". Uses GET …/profile. NOT explain_profile_settings (static FAQ on how to change title/avatar, doesn't read current values), NOT update_provider_profile (mutate).`;

export const PROVIDER_SHOW_PROFILE_PROMPT_SCENARIOS = [
  {
    id: 'show-profile-current-title-en',
    prompt: "What's my current title?",
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
  {
    id: 'show-profile-show-my-profile-en',
    prompt: 'Show my profile',
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
  {
    id: 'show-profile-avatar-en',
    prompt: 'What avatar am I using?',
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
  {
    id: 'show-profile-whats-on-en',
    prompt: "What's on my provider profile?",
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
  {
    id: 'show-profile-hy',
    prompt: 'Ցույց տուր իմ պրովայդեր պրոֆիլը',
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
  {
    id: 'show-profile-ru',
    prompt: 'Покажи мой профиль провайдера',
    surface: 'provider' as const,
    expectedAction: 'show_provider_profile',
  },
] as const;
