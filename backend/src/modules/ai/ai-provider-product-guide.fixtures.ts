import type { ProviderProductGuideIntent } from './ai-provider-product-guide.util.js';

export interface ProviderProductGuideRescueScenario {
  id: string;
  intent: ProviderProductGuideIntent;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

export interface ProviderProductGuideClassifierScenario {
  id: string;
  intent: ProviderProductGuideIntent;
  prompt: string;
}

/** Post-LLM rescue — ai-guide-1.4.1 / ai-cmd-provider-5.21 + 5.24.2/4. */
export const PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS: readonly ProviderProductGuideRescueScenario[] =
  [
    {
      id: 'staff-invite-link',
      intent: 'explain_staff_invite',
      samplePrompt: 'What is this invite link?',
      prompt:
        /\b(?:what\s+is\s+(?:this\s+)?(?:staff\s+)?invite(?:\s+link)?|accept\s+(?:the\s+)?invite|join\s+(?:the\s+)?(?:salon|business|team)\s+as|staff\s+invite|invitation\s+link)\b/i,
    },
    {
      id: 'provider-app-tabs',
      intent: 'explain_provider_app_tabs',
      samplePrompt: "What's on Today vs Calendar?",
      prompt:
        /\b(?:today\s+vs\s+calendar|calendar\s+vs\s+today|what(?:'s|\s+is)\s+on\s+(?:the\s+)?today\s+tab|where\s+is\s+(?:the\s+)?schedule\s+tab|provider\s+app\s+tabs?|difference\s+between\s+today\s+and\s+calendar)\b|(?:что\s+показывает\s+вкладка\s+today|вкладка\s+today)/iu,
      fromActions: ['unknown', 'show_appointments', 'list_bookings'],
    },
    {
      id: 'team-view-scope',
      intent: 'explain_team_view_scope',
      samplePrompt: "Why do I see everyone's bookings?",
      prompt:
        /\b(?:everyone(?:'s|\s+else(?:'s)?)?\s+bookings?|all\s+providers?(?:'|\s)?\s+calendar|team\s+view|see\s+all\s+(?:the\s+)?(?:appointments|bookings)|switch\s+to\s+my\s+calendar\s+only|my\s+calendar\s+only|why\s+do\s+i\s+see\s+everyone)\b/i,
    },
    {
      id: 'profile-settings',
      intent: 'explain_profile_settings',
      samplePrompt: 'How do I update my avatar?',
      // NOT matched when the user supplies the actual new value ("... to <value>") —
      // that phrasing routes to the update_provider_profile mutate instead.
      prompt:
        /\b(?:change\s+my\s+title(?!\s+to\b)|update\s+(?:my\s+)?avatar(?!\s+(?:to|url)\b)|edit\s+(?:my\s+)?profile|profile\s+settings?|change\s+profile\s+photo|update\s+my\s+name\s+on\s+profile(?!\s+to\b))\b/i,
    },
    {
      id: 'assistant-confirm-swipe',
      intent: 'explain_assistant_confirm_swipe',
      samplePrompt: 'Why do I have to swipe to confirm?',
      prompt:
        /\b(?:swipe\s+to\s+confirm|why\s+swipe|what\s+will\s+change|confirm\s+swipe|assistant\s+confirm|before\s+(?:it\s+)?(?:goes\s+live|changes))\b/i,
    },
    {
      id: 'provider-compound-steps',
      intent: 'explain_provider_compound_steps',
      samplePrompt: 'Do these compound steps run one at a time?',
      prompt:
        /\b(?:one\s+at\s+a\s+time|compound\s+steps?|what\s+happens\s+next\s+in|do\s+these\s+(?:one\s+by\s+one|separately)|multi[\s-]?step\s+command|several\s+steps\s+in\s+one)\b/i,
    },
  ] as const;

export const PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS: readonly ProviderProductGuideClassifierScenario[] =
  [
    {
      id: '5.21.1-invite',
      intent: 'explain_staff_invite',
      prompt: 'What is this invite link?',
    },
    {
      id: '5.21.2-tabs',
      intent: 'explain_provider_app_tabs',
      prompt: "What's on Today vs Calendar?",
    },
    {
      id: '5.21.3-team-scope',
      intent: 'explain_team_view_scope',
      prompt: "Why do I see everyone's bookings?",
    },
    {
      id: '5.21.4-profile',
      intent: 'explain_profile_settings',
      prompt: 'How do I change my title on my profile?',
    },
    {
      id: '5.24.2-swipe',
      intent: 'explain_assistant_confirm_swipe',
      prompt: 'Why do I have to swipe to confirm?',
    },
    {
      id: '5.24.4-compound',
      intent: 'explain_provider_compound_steps',
      prompt: 'Do these compound steps run one at a time?',
    },
  ] as const;

export { PROVIDER_APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
