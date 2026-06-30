import { isConfigureMultiServiceSettingsPrompt } from './ai-catalog.util.js';

/** Dashboard read intent (ai-cmd-ext-2.29). */
export const EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT =
  'explain_multi_service_settings' as const;

export const EXPLAIN_MULTI_SERVICE_SETTINGS_CLASSIFIER_RULES = `- explain_multi_service_settings: READ — summarize multi-service booking settings on Services → Multi-service tab: enabled flag, maxServiceCount, maxDurationMinutes, turnoverBufferMinutes, schedulingMode (same_visit|per_service), incompatible pair mode, and blocked service/category pairs. Triggers: explain/show/describe/what/which/summarize + multi-service settings|limits|scheduling mode|duration cap|max services. NOT configure_multi_service_settings (mutate limits), NOT configure_multi_service_scheduling_mode (mutate mode only), NOT set_service_compatibility (block specific service pairs), NOT check_multi_service_block_availability (customer slot check).
- Examples:
  - "Explain multi-service booking settings" → explain_multi_service_settings
  - "What are our multi-service booking limits?" → explain_multi_service_settings
  - "Is multi-service booking enabled?" → explain_multi_service_settings
  - "Explain multi-service scheduling mode" → explain_multi_service_settings
  - NOT "Enable multi-service booking max 3 services" → configure_multi_service_settings`;

export type ExplainMultiServiceSettingsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT;
};

export const EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS: ExplainMultiServiceSettingsPromptFixture[] =
  [
    {
      id: 'explain-settings',
      prompt: 'Explain multi-service booking settings',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'what-limits',
      prompt: 'What are our multi-service booking limits?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'max-services',
      prompt: 'What is the max number of services per visit?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'duration-cap',
      prompt: 'What is the multi-service duration cap?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'scheduling-mode',
      prompt: 'Explain multi-service scheduling mode',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'same-visit-status',
      prompt: 'Are we using same visit or per service scheduling?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'enabled-status',
      prompt: 'Is multi-service booking enabled?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'incompatible-pairs',
      prompt: 'Which service pairs are blocked on the same visit?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'turnover-buffer',
      prompt: 'What turnover buffer is configured for multi-service?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'summarize-settings',
      prompt: 'Summarize multi-service settings',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'show-configuration',
      prompt: 'Show multi-service booking configuration',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
    {
      id: 'describe-limits-mode',
      prompt: 'Describe our multi-service limits and scheduling mode',
      surface: 'dashboard',
      expectedAction: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
    },
  ];

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|show|describe|what|which|how|summarize|overview|status|are\s+we)\b/i.test(
      prompt,
    ) ||
    /\b(is|are)\b/i.test(prompt) ||
    /(?:բացատրիր|ցույց\s+տուր)/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|какой)/i.test(prompt)
  );
}

function hasMultiServiceSettingsSurface(prompt: string): boolean {
  return (
    /\bmulti[\s-]?service\b/i.test(prompt) ||
    /\bmax(?:imum)?\s+\d+\s+services?\b/i.test(prompt) ||
    /\b(?:max|duration)\s+(?:services?|minutes?|cap|limit)\b/i.test(prompt) ||
    /\b(?:same[\s-]?visit|per[\s-]?service)\b/i.test(prompt) ||
    /\bscheduling\s+mode\b/i.test(prompt) ||
    /\bturnover\s+buffer\b/i.test(prompt) ||
    /\b(?:blocked|incompatible)\s+(?:service\s+)?pairs?\b/i.test(prompt) ||
    /\bservices?\s+per\s+visit\b/i.test(prompt) ||
    /\bduration\s+cap\b/i.test(prompt) ||
    /\bmulti[\s-]?service\s+(?:settings?|limits?|configuration)\b/i.test(prompt)
  );
}

function isConfigureMultiServiceSchedulingModeMutate(prompt: string): boolean {
  return (
    /\b(configure|set|switch|change)\b/i.test(prompt) &&
    /\b(multi[\s-]?service|same[\s-]?visit|per[\s-]?service)\b/i.test(prompt) &&
    /\b(scheduling\s+mode|scheduling)\b/i.test(prompt)
  );
}

export function isExplainMultiServiceSettingsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isConfigureMultiServiceSettingsPrompt(text)) return false;
  if (isConfigureMultiServiceSchedulingModeMutate(text)) return false;
  if (/\b(block|prevent|incompatible|cannot)\b/i.test(text) && /\btogether\b/i.test(text)) {
    return false;
  }
  if (!hasExplainReadCue(text)) return false;
  return hasMultiServiceSettingsSurface(text);
}

export function parseExplainMultiServiceSettingsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> | null {
  if (
    !isExplainMultiServiceSettingsPrompt(prompt) &&
    params.explainMultiServiceSettings !== true
  ) {
    return null;
  }
  return {};
}

export function rescueExplainMultiServiceSettingsIntent(
  prompt: string,
  action: string,
): {
  action: typeof EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT;
  rescueReason: string;
} | null {
  if (
    isExplainMultiServiceSettingsPrompt(prompt) &&
    action !== EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT
  ) {
    return {
      action: EXPLAIN_MULTI_SERVICE_SETTINGS_INTENT,
      rescueReason: 'explain_multi_service_settings',
    };
  }
  return null;
}
