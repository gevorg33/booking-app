import type { GuideFlowSurface } from './guide/guide-flow.types.js';

/** ai-guide-1.8.7 — meta-AI help intents (assistant settings, chips, approval). */
export const META_PRODUCT_GUIDE_INTENTS = [
  'explain_ai_settings',
  'explain_ai_suggestions',
  'explain_assistant_approval',
] as const;

export type MetaProductGuideIntent = (typeof META_PRODUCT_GUIDE_INTENTS)[number];

/** Provider meta guide intents (approval + suggestion chips). */
export const PROVIDER_META_GUIDE_INTENTS = [
  'explain_ai_suggestions',
  'explain_assistant_approval',
] as const;

export type ProviderMetaGuideIntent = (typeof PROVIDER_META_GUIDE_INTENTS)[number];

export interface SuggestionChipGuideTarget {
  topicId: string;
  stepIndex?: number;
}

export const META_GUIDE_TOPIC_BY_INTENT: Readonly<
  Record<MetaProductGuideIntent, { dashboard: string; provider?: string }>
> = {
  explain_ai_settings: { dashboard: 'dashboard.ai.getting-started' },
  explain_ai_suggestions: {
    dashboard: 'dashboard.ai.command-bar',
    provider: 'provider-assistant',
  },
  explain_assistant_approval: {
    dashboard: 'dashboard.ai.approval',
    provider: 'provider-assistant-confirm',
  },
};

export const DASHBOARD_SUGGESTION_CHIP_GUIDE: Readonly<
  Record<string, SuggestionChipGuideTarget>
> = {
  'apply-week': { topicId: 'dashboard.core.schedule', stepIndex: 0 },
  'fill-gaps': { topicId: 'dashboard.core.schedule', stepIndex: 2 },
  'resolve-conflicts': { topicId: 'dashboard.core.calendar', stepIndex: 1 },
  'reassign-cancelled': { topicId: 'dashboard.core.calendar', stepIndex: 2 },
  utilization: { topicId: 'dashboard.ai.command-bar', stepIndex: 1 },
  'no-bookings': { topicId: 'dashboard.core.calendar', stepIndex: 0 },
};

export const PROVIDER_SUGGESTION_CHIP_GUIDE: Readonly<
  Record<string, SuggestionChipGuideTarget>
> = {
  'confirm-pending': { topicId: 'provider-appointments', stepIndex: 0 },
  'unpaid-today': { topicId: 'provider-appointments', stepIndex: 2 },
  'gaps-today': { topicId: 'provider-schedule-blocks', stepIndex: 0 },
  'next-up': { topicId: 'provider-appointments', stepIndex: 0 },
  'empty-today': { topicId: 'provider-getting-started', stepIndex: 0 },
};

export interface MetaProductGuideRescueScenario {
  id: string;
  intent: MetaProductGuideIntent;
  surface: GuideFlowSurface;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

export const META_PRODUCT_GUIDE_RESCUE_SCENARIOS: readonly MetaProductGuideRescueScenario[] =
  [
    {
      id: 'dashboard-ai-settings',
      intent: 'explain_ai_settings',
      surface: 'dashboard',
      samplePrompt: 'Where do I configure the OpenAI API key?',
      prompt:
        /\b(?:ai\s+settings?|openai\s+(?:api\s+)?key|confidence\s+threshold|autopilot\s+rules?|platform\s+default\s+api|bring\s+your\s+own\s+key|integrations\s+openai)\b/i,
      fromActions: ['unknown', 'configure_business_tax', 'explain_app_feature'],
    },
    {
      id: 'dashboard-suggestion-chips',
      intent: 'explain_ai_suggestions',
      surface: 'dashboard',
      samplePrompt: 'What do the AI suggestion chips do?',
      prompt:
        /\b(?:suggestion\s+chips?|page\s+suggestions?|orchestrix\s+suggestions?|why\s+(?:am\s+i\s+)?seeing\s+(?:these\s+)?suggestions?|what\s+(?:do|does)\s+(?:the\s+)?(?:ai\s+)?suggestions?\s+(?:mean|do))\b/i,
      fromActions: ['unknown', 'explain_app_feature', 'guide_user_flow'],
    },
    {
      id: 'dashboard-diff-preview',
      intent: 'explain_assistant_approval',
      surface: 'dashboard',
      samplePrompt: 'What is the plan diff preview before Approve & execute?',
      prompt:
        /\b(?:diff\s+preview|approve\s+&?\s*execute|plan\s+diff|review\s+(?:the\s+)?plan|what\s+will\s+change\s+before|approval\s+settings?|pending\s+ai\s+task)\b/i,
      fromActions: ['unknown', 'explain_app_feature', 'update_bookings'],
    },
    {
      id: 'provider-suggestion-chips',
      intent: 'explain_ai_suggestions',
      surface: 'provider',
      samplePrompt: 'What are the Today tab suggestion cards?',
      prompt:
        /\b(?:suggestion\s+cards?|today\s+suggestions?|ai\s+chips?|tap\s+to\s+run\s+suggestion|what\s+(?:do|does)\s+(?:these\s+)?suggestions?\s+(?:mean|do))\b/i,
      fromActions: ['unknown', 'show_appointments', 'explain_provider_app_tabs'],
    },
    {
      id: 'provider-swipe-approval',
      intent: 'explain_assistant_approval',
      surface: 'provider',
      samplePrompt: 'Why do I swipe to confirm AI changes?',
      prompt:
        /\b(?:swipe\s+to\s+confirm|confirm\s+swipe|what\s+will\s+change\s+before\s+confirm|bulk\s+confirm\s+preview|assistant\s+approval)\b/i,
      fromActions: [
        'unknown',
        'update_bookings',
        'mark_paid',
        'explain_assistant_confirm_swipe',
      ],
    },
  ] as const;

export const META_PRODUCT_GUIDE_CLASSIFIER_RULES = `- explain_ai_settings: READ — dashboard only: explain AI/OpenAI settings (Settings → Integrations, platform default vs custom API key, confidence, autopilot). Triggers: where is AI settings, how do I add OpenAI key, what is autopilot. NOT configure_* mutates and NOT explain_app_feature (generic UI).
- explain_ai_suggestions: READ — explain contextual AI suggestion chips/cards on dashboard pages or provider Today tab; optional suggestionId maps chip → guide step. Triggers: what are suggestion chips, what does this suggestion mean. NOT list_* reads and NOT executing the suggested command.
- explain_assistant_approval: READ — explain approval safety before mutating AI actions: dashboard plan diff preview + Approve & execute; provider mobile swipe-to-confirm preview. Triggers: diff preview, what will change, swipe to confirm. NOT confirm mutate execution and NOT explain_assistant_confirm_swipe on provider when user asks about dashboard diff (surface-specific rescue applies).`;

export const PROVIDER_META_GUIDE_CLASSIFIER_RULES = `- explain_ai_suggestions: READ — provider mobile Today suggestion cards; optional suggestionId (confirm-pending, unpaid-today, gaps-today, next-up, empty-today) maps chip → playbook step. NOT show_appointments list read.
- explain_assistant_approval: READ — provider swipe-to-confirm bulk preview before mutating AI actions (playbook provider-assistant-confirm). Triggers: swipe to confirm, what will change. NOT mark_paid / update_bookings mutate.`;

export const META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS = [
  {
    id: '8.7-settings',
    intent: 'explain_ai_settings' as const,
    surface: 'dashboard' as const,
    prompt: 'How do I configure AI settings and OpenAI?',
  },
  {
    id: '8.7-suggestions-dashboard',
    intent: 'explain_ai_suggestions' as const,
    surface: 'dashboard' as const,
    prompt: 'What do the suggestion chips on Schedule mean?',
  },
  {
    id: '8.7-approval-dashboard',
    intent: 'explain_assistant_approval' as const,
    surface: 'dashboard' as const,
    prompt: 'Explain the diff preview before I approve an AI plan',
  },
  {
    id: '8.7-suggestions-provider',
    intent: 'explain_ai_suggestions' as const,
    surface: 'provider' as const,
    prompt: 'What are the Today tab AI suggestion cards?',
  },
  {
    id: '8.7-approval-provider',
    intent: 'explain_assistant_approval' as const,
    surface: 'provider' as const,
    prompt: 'Why swipe to confirm before AI changes run?',
  },
] as const;
