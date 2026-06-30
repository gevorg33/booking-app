import type { AppGuideIntent } from './ai-product-guide.util.js';
import type { MetaProductGuideIntent } from './ai-meta-product-guide.util.js';
import type { ProviderProductGuideIntent } from './ai-provider-product-guide.util.js';

export interface ProductGuideCompletionScenario {
  id: string;
  action: AppGuideIntent | ProviderProductGuideIntent | MetaProductGuideIntent;
  prompt: string;
  params?: Record<string, unknown>;
  expectValid: boolean;
}

export const APP_GUIDE_COMPLETION_SCENARIOS: readonly ProductGuideCompletionScenario[] =
  [
    {
      id: 'flow-topic-id',
      action: 'guide_user_flow',
      prompt: 'help',
      params: { topicId: 'dashboard.core.schedule' },
      expectValid: true,
    },
    {
      id: 'flow-route',
      action: 'guide_user_flow',
      prompt: 'help',
      params: { route: '/dashboard/schedule' },
      expectValid: true,
    },
    {
      id: 'flow-walkthrough',
      action: 'guide_user_flow',
      prompt: 'Walk me through setting up weekly schedule templates',
      expectValid: true,
    },
    {
      id: 'flow-empty',
      action: 'guide_user_flow',
      prompt: 'hello',
      expectValid: false,
    },
    {
      id: 'feature-meaning',
      action: 'explain_app_feature',
      prompt: 'What does the command bar button do?',
      expectValid: true,
    },
    {
      id: 'screen-this-page',
      action: 'explain_current_screen',
      prompt: 'What can I do on this page?',
      params: { route: '/dashboard/schedule' },
      expectValid: true,
    },
    {
      id: 'screen-empty',
      action: 'explain_current_screen',
      prompt: 'book Anna tomorrow',
      expectValid: false,
    },
  ] as const;

export const PROVIDER_GUIDE_COMPLETION_SCENARIOS: readonly ProductGuideCompletionScenario[] =
  [
    {
      id: 'staff-invite',
      action: 'explain_staff_invite',
      prompt: 'What is this invite link?',
      expectValid: true,
    },
    {
      id: 'provider-tabs',
      action: 'explain_provider_app_tabs',
      prompt: "What's on Today vs Calendar?",
      expectValid: true,
    },
    {
      id: 'team-scope',
      action: 'explain_team_view_scope',
      prompt: "Why do I see everyone's bookings?",
      expectValid: true,
    },
    {
      id: 'profile-settings',
      action: 'explain_profile_settings',
      prompt: 'How do I update my avatar?',
      expectValid: true,
    },
    {
      id: 'assistant-swipe',
      action: 'explain_assistant_confirm_swipe',
      prompt: 'Why do I have to swipe to confirm?',
      expectValid: true,
    },
    {
      id: 'compound-steps',
      action: 'explain_provider_compound_steps',
      prompt: 'Do these compound steps run one at a time?',
      expectValid: true,
    },
    {
      id: 'provider-empty',
      action: 'explain_staff_invite',
      prompt: 'cancel all bookings today',
      expectValid: false,
    },
  ] as const;

export const META_GUIDE_COMPLETION_SCENARIOS: readonly ProductGuideCompletionScenario[] =
  [
    {
      id: 'meta-ai-settings',
      action: 'explain_ai_settings',
      prompt: 'Where do I configure the OpenAI API key?',
      expectValid: true,
    },
    {
      id: 'meta-suggestions-chip',
      action: 'explain_ai_suggestions',
      prompt: 'help',
      params: { suggestionId: 'apply-week' },
      expectValid: true,
    },
    {
      id: 'meta-approval-dashboard',
      action: 'explain_assistant_approval',
      prompt: 'Explain the diff preview before Approve & execute',
      expectValid: true,
    },
    {
      id: 'meta-suggestions-provider',
      action: 'explain_ai_suggestions',
      prompt: 'What are Today suggestion cards?',
      expectValid: true,
    },
    {
      id: 'meta-approval-provider',
      action: 'explain_assistant_approval',
      prompt: 'Why swipe to confirm?',
      expectValid: true,
    },
    {
      id: 'meta-empty',
      action: 'explain_ai_settings',
      prompt: 'hello',
      expectValid: false,
    },
  ] as const;
