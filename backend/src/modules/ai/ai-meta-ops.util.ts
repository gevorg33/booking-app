/** ai-cmd-dashboard-6.1.4 / e2e-bug.137 — meta AI settings read rescue. */

export const META_OPS_READ_INTENTS = [
  'summarize_ai_settings',
  'summarize_ai_briefing',
  'summarize_ai_weekly_report',
  'explain_ai_audit_log',
  'explain_ai_usage_analytics',
  'explain_ai_capabilities',
] as const;

export type MetaOpsReadIntent = (typeof META_OPS_READ_INTENTS)[number];

const META_OPS_READ_SET = new Set<string>(META_OPS_READ_INTENTS);

export function isMetaOpsReadIntent(
  action: string,
): action is MetaOpsReadIntent {
  return META_OPS_READ_SET.has(action);
}

/** Live settings values — not conceptual explain_ai_settings guide. */
export function isSummarizeAiSettingsPrompt(prompt: string): boolean {
  if (
    /\b(how\s+do\s+i|where\s+(?:do|can)\s+i|walk\s+me\s+through)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\b(turn\s+on|turn\s+off|enable|disable|configure)\b/i.test(prompt)) {
    return false;
  }
  // e2e-bug.162 — quota / remaining questions belong to explain_ai_capabilities.
  if (isExplainAiCapabilitiesPrompt(prompt)) return false;
  const settingsCue =
    /\b(ai\s+settings|ai\s+automation\s+settings|autopilot\s+rules|confidence\s+thresholds|saved\s+macros|ai\s+macros)\b/i.test(
      prompt,
    ) ||
    (/\b(autopilot|macros?|playbooks?)\b/i.test(prompt) &&
      /\b(settings?|rules?|configured|summarize|show|what\s+are|current|is\s+autopilot|macros?\s+do\s+i)\b/i.test(
        prompt,
      )) ||
    (/\bautopilot\b/i.test(prompt) && /\bmacros?\b/i.test(prompt));
  const readCue =
    /\b(summarize|summary|show|list|what\s+are|current|is\s+autopilot)\b/i.test(
      prompt,
    );
  return settingsCue && readCue;
}

/** e2e-bug.162 — plan capabilities + monthly AI-command quota remaining. */
export function isExplainAiCapabilitiesPrompt(prompt: string): boolean {
  if (/\b(how\s+do\s+i|where\s+(?:do|can)\s+i|walk\s+me\s+through)\b/i.test(prompt)) {
    return false;
  }
  // e2e-bug.129 — bare "on my plan" / visits-left is customer membership, not AI quota.
  if (
    /\b(visits?|credits?|appointments?|membership)\b/i.test(prompt) &&
    !/\bai\b/i.test(prompt)
  ) {
    return false;
  }
  const quotaCue =
    /\b(ai\s+commands?|ai\s+actions?|ai\s+quota|monthly\s+limit|usage\s+limit)\b/i.test(
      prompt,
    ) &&
    /\b(left|remaining|how many|limit|used|exceeded|near|approaching|quota)\b/i.test(
      prompt,
    );
  const capabilitiesCue =
    /\b(what can (?:the )?ai do|ai capabilities|allowed ai actions?)\b/i.test(
      prompt,
    ) ||
    (/\bon my plan\b/i.test(prompt) && /\bai\b/i.test(prompt));
  return quotaCue || capabilitiesCue;
}

/**
 * e2e-bug.162 — grounded quota summary. Never treat allowedIntents.length as a
 * monthly usage limit (that count is action-type cardinality, not quota).
 */
export function formatExplainAiCapabilitiesSummary(input: {
  tierName: string;
  accessTier: string;
  allowedIntentCount: number;
  aiCommandsThisMonth: number;
  aiCommandsPerMonth: number;
  atAiCommandLimit: boolean;
  aiUsageWarning: boolean;
}): string {
  const used = Math.max(0, input.aiCommandsThisMonth);
  const limit = Math.max(0, input.aiCommandsPerMonth);
  const remaining = Math.max(0, limit - used);
  const quotaLine =
    limit > 0
      ? `• AI commands this month: ${used} used of ${limit} (${remaining} left)`
      : `• AI commands this month: ${used} used`;

  const statusLine = input.atAiCommandLimit
    ? '• You are at your AI command limit for this billing period.'
    : input.aiUsageWarning
      ? '• You are approaching your AI command limit for this billing period.'
      : limit > 0
        ? '• You are within your AI command quota for this billing period.'
        : null;

  return [
    `Plan: ${input.tierName}. Access tier: ${input.accessTier}.`,
    quotaLine,
    statusLine,
    `• ${input.allowedIntentCount} distinct AI action type(s) available on this plan/role (not a usage quota).`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

export function rescueMetaOpsIntent(
  prompt: string,
  action: string,
): { action: MetaOpsReadIntent; rescueReason: string } | null {
  if (isMetaOpsReadIntent(action)) return null;
  if (isExplainAiCapabilitiesPrompt(prompt)) {
    return {
      action: 'explain_ai_capabilities',
      rescueReason: 'explain_ai_capabilities',
    };
  }
  if (isSummarizeAiSettingsPrompt(prompt)) {
    return {
      action: 'summarize_ai_settings',
      rescueReason: 'summarize_ai_settings',
    };
  }
  return null;
}
