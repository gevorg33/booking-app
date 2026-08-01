/**
 * e2e-bug.276 — Home-tab tour must not be stolen by explain_home_screen_widget
 * (or compare_services) under locale:hy English prompts.
 */

export const E2E276_HOME_TAB_RECLAIM_SCENARIOS = [
  {
    id: 'e276-how-use-home-tab',
    prompt: 'How do I use the Home tab?',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-how-use-home-tab-step-by-step',
    prompt: 'How do I use the Home tab step by step?',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-what-on-home-tab',
    prompt: 'What is on the Home tab?',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-walk-home-tab',
    prompt: 'Walk me through the Home tab',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-home-vs-services-from-compare',
    prompt: 'What is on the Home tab vs Services?',
    fromAction: 'compare_services',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-services-tab',
    prompt: 'What is on the Services tab?',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
  {
    id: 'e276-account-tab',
    prompt: 'How do I use the Account tab?',
    fromAction: 'explain_home_screen_widget',
    expectedAction: 'explain_app_feature' as const,
  },
] as const;

export const E2E276_WIDGET_TRUE_POSITIVES = [
  {
    id: 'e276-widget-add-home-screen',
    prompt: 'Add next appointment to home screen',
  },
  {
    id: 'e276-widget-how-works',
    prompt: 'How does the home screen widget work?',
  },
  {
    id: 'e276-widget-what-shows',
    prompt: 'What does the widget show?',
  },
] as const;

export const E2E276_WIDGET_CLARIFY_LOCALES = [
  { id: 'e276-clarify-en', locale: 'en' as const, expectScript: 'latin' },
  { id: 'e276-clarify-hy', locale: 'hy' as const, expectScript: 'hy' },
  { id: 'e276-clarify-ru', locale: 'ru' as const, expectScript: 'cyr' },
] as const;
