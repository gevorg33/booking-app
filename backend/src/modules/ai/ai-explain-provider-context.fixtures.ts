export const EXPLAIN_PROVIDER_CONTEXT_INTENTS = ['explain_provider_context'] as const;

export type ExplainProviderContextIntent =
  (typeof EXPLAIN_PROVIDER_CONTEXT_INTENTS)[number];

export const PROVIDER_EXPLAIN_CONTEXT_CLASSIFIER_RULES = `- explain_provider_context: READ — live read of this session's provider mobile context: membership role, own vs team view, linked employee, and which feature areas (clinic lab, retail POS, WhatsApp contact) are enabled for this business. Triggers: "What can I see right now?", "Am I in team view or my own?", "What's my role here?". Uses GET …/provider/context. NOT explain_team_view_scope (generic tour of what team view means), NOT explain_provider_app_tabs (tab tour), NOT explain_visibility_block (live diagnosis of a specific missing/blocked screen).`;

export type ExplainProviderContextPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: ExplainProviderContextIntent;
};

export const EXPLAIN_PROVIDER_CONTEXT_PROMPTS: readonly ExplainProviderContextPromptFixture[] =
  [
    {
      id: 'what-can-i-see',
      prompt: 'What can I see right now?',
      expectedAction: 'explain_provider_context',
    },
    {
      id: 'current-session-details',
      prompt: 'Tell me my current provider session details',
      expectedAction: 'explain_provider_context',
    },
    {
      id: 'whats-my-role',
      prompt: "What's my role here?",
      expectedAction: 'explain_provider_context',
    },
  ];
