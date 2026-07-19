/** ai-cmd-dashboard-6.1 — AI Ops agent-task classifier appendix. */
export const AGENT_OPS_CLASSIFIER_RULES = `- list_agent_tasks: READ — list autonomous agent tasks (all or pending), or preview one task by taskId. Triggers: show agent tasks, "Show me pending AI agent tasks", pending agent tasks, task queue, preview task <id>. Optional scope=pending|all (default all), taskId. NOT rebook_all_from_agent_task/undo_latest_agent_task (those mutate). NOT list_clinic_tasks (provider clinic to-dos — never use for "AI agent tasks" / agent task queue on the dashboard). NEVER use for Zendesk/support tickets or unread customer messages — those are explain_support_inbox (AI cannot invent ticket/message counts from the agent-task queue).
- rebook_all_from_agent_task: MUTATE — replay every rebooking proposal from a cancellation-recovery agent task as one chained step, executed immediately. Requires taskId. Triggers: rebook all from this task, rebook everyone from task <id>. NOT list_agent_tasks (read only).
- undo_latest_agent_task: MUTATE — reverse the most recently completed agent-initiated action. Without confirmed=true, returns a preview of what would be undone (does not execute). Only set confirmed=true once the user has explicitly confirmed after seeing the preview. Triggers: undo the last agent action, undo latest task, revert last agent action, yes undo it (confirmed=true only on explicit confirmation).
- approve_agent_task: MUTATE — approve an agent task that is awaiting approval and execute its plan. Requires taskId. Triggers: approve agent task <id>, approve this task, go ahead with the pending task. NOT rebook_all_from_agent_task (a specific rebooking replay, not a generic plan-approval).
- retry_agent_step: MUTATE — retry one failed step within an agent task's plan. Requires taskId and stepId. Triggers: retry step <id> of task <id>, retry the failed step. NOT approve_agent_task (approves the whole task, not a single step).
- Examples:
  - "Show me pending AI agent tasks" → list_agent_tasks, scope=pending
  - "Show pending agent tasks" → list_agent_tasks, scope=pending
  - "Preview task abc123" → list_agent_tasks, taskId=abc123
  - "Rebook all from task abc123" → rebook_all_from_agent_task, taskId=abc123
  - "Undo the last agent action" → undo_latest_agent_task (preview only, confirmed omitted)
  - "Yes, undo it" (after a preview was shown) → undo_latest_agent_task, confirmed=true`;
