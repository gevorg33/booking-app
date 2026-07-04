/** ai-cmd-dashboard-6.1 — AI Ops agent-task classifier appendix. */
export const AGENT_OPS_CLASSIFIER_RULES = `- list_agent_tasks: READ — list autonomous agent tasks (all or pending), or preview one task by taskId. Triggers: show agent tasks, pending agent tasks, task queue, preview task <id>. Optional scope=pending|all (default all), taskId. NOT rebook_all_from_agent_task/undo_latest_agent_task (those mutate).
- rebook_all_from_agent_task: MUTATE — replay every rebooking proposal from a cancellation-recovery agent task as one chained step, executed immediately. Requires taskId. Triggers: rebook all from this task, rebook everyone from task <id>. NOT list_agent_tasks (read only).
- undo_latest_agent_task: MUTATE — reverse the most recently completed agent-initiated action. Without confirmed=true, returns a preview of what would be undone (does not execute). Only set confirmed=true once the user has explicitly confirmed after seeing the preview. Triggers: undo the last agent action, undo latest task, revert last agent action, yes undo it (confirmed=true only on explicit confirmation).
- Examples:
  - "Show pending agent tasks" → list_agent_tasks, scope=pending
  - "Preview task abc123" → list_agent_tasks, taskId=abc123
  - "Rebook all from task abc123" → rebook_all_from_agent_task, taskId=abc123
  - "Undo the last agent action" → undo_latest_agent_task (preview only, confirmed omitted)
  - "Yes, undo it" (after a preview was shown) → undo_latest_agent_task, confirmed=true`;
