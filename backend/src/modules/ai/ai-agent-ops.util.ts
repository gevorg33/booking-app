/** ai-cmd-dashboard-6.1 — dashboard AI ops for the autonomous agent-task system. */

export const DASHBOARD_AGENT_OPS_READ_INTENTS = ['list_agent_tasks'] as const;

export const DASHBOARD_AGENT_OPS_MUTATE_INTENTS = [
  'rebook_all_from_agent_task',
  'undo_latest_agent_task',
] as const;

export const DASHBOARD_AGENT_OPS_INTENTS = [
  ...DASHBOARD_AGENT_OPS_READ_INTENTS,
  ...DASHBOARD_AGENT_OPS_MUTATE_INTENTS,
] as const;

export type AgentOpsIntent = (typeof DASHBOARD_AGENT_OPS_INTENTS)[number];

const AGENT_OPS_INTENT_SET = new Set<string>(DASHBOARD_AGENT_OPS_INTENTS);

export function isAgentOpsIntent(action: string): action is AgentOpsIntent {
  return AGENT_OPS_INTENT_SET.has(action);
}

export function extractAgentTaskIdFromPrompt(prompt: string): string | null {
  const match = prompt.match(/\btask[- ]?(?:id)?\s*[:#]?\s*([a-f0-9-]{8,})\b/i);
  return match ? match[1] : null;
}

export function isListAgentTasksPrompt(prompt: string): boolean {
  return /\b(agent\s+tasks?|pending\s+tasks?|task\s+queue)\b/i.test(prompt) &&
    !/\b(rebook|undo)\b/i.test(prompt);
}

export function isRebookAllFromAgentTaskPrompt(prompt: string): boolean {
  return /\brebook\s+(all|everyone|every\s+customer)\b/i.test(prompt);
}

export function isUndoLatestAgentTaskPrompt(prompt: string): boolean {
  return /\bundo\s+(the\s+)?(last|latest)\s+(agent\s+)?(action|task)\b/i.test(
    prompt,
  ) || /\brevert\s+(the\s+)?(last|latest)\s+agent\b/i.test(prompt);
}

export function rescueAgentOpsIntent(
  prompt: string,
  action: string,
): { action: AgentOpsIntent; rescueReason: string } | null {
  if (isAgentOpsIntent(action)) return null;

  if (isRebookAllFromAgentTaskPrompt(prompt)) {
    return { action: 'rebook_all_from_agent_task', rescueReason: 'rebook_all' };
  }
  if (isUndoLatestAgentTaskPrompt(prompt)) {
    return { action: 'undo_latest_agent_task', rescueReason: 'undo_latest' };
  }
  if (isListAgentTasksPrompt(prompt)) {
    return { action: 'list_agent_tasks', rescueReason: 'list_tasks' };
  }
  return null;
}
